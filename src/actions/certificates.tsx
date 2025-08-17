"use server";

import { db } from "@/db";
import { hack_projects, hackathons, hackathon_results } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pdf, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import pinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";

type GenerateCertificateResult = {
  success: boolean;
  ipfsHash?: string;
  url?: string;
  error?: string;
};

export async function generateCertificateForProject(projectId: string): Promise<GenerateCertificateResult> {
  try {
    // Fetch project, hackathon and result
    const [projectRes] = await db.select().from(hack_projects).where(eq(hack_projects.id, projectId));
    if (!projectRes) return { success: false, error: "Project not found" };

    const [hackathonRes] = await db.select().from(hackathons).where(eq(hackathons.id, projectRes.hackathon_id as string));
    const [resultRes] = await db.select().from(hackathon_results).where(eq(hackathon_results.project_id, projectId));

    // Simple PDF document component
    const styles = StyleSheet.create({
      page: {
        padding: 40,
        fontFamily: "Helvetica",
        backgroundColor: "#fff"
      },
      header: { fontSize: 18, textAlign: "center", marginBottom: 20, fontWeight: "bold" },
      title: { fontSize: 24, textAlign: "center", marginTop: 12, marginBottom: 8 },
      subtitle: { fontSize: 12, textAlign: "center", color: "#666", marginBottom: 20 },
      body: { fontSize: 14, lineHeight: 1.6, marginTop: 10 },
      footer: { position: "absolute", fontSize: 10, bottom: 30, left: 40, right: 40, textAlign: "center", color: "#888" }
    });

    const Certificate = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.header}>OpenWave - Hackathon Certificate</Text>
            <Text style={styles.title}>{projectRes.project_name}</Text>
            <Text style={styles.subtitle}>{hackathonRes?.name ?? "Hackathon"}</Text>

            <View style={styles.body}>
              <Text>Presented to: {projectRes.owner_id}</Text>
              <Text>Project: {projectRes.project_name}</Text>
              <Text>Description: {projectRes.description ?? "—"}</Text>
              <Text>Result: {resultRes?.voting_status ?? "—"}{resultRes?.final_rank ? ` — Rank ${resultRes.final_rank}` : ""}</Text>
              <Text>Votes: {resultRes?.total_votes ?? "0"}</Text>
            </View>

            <Text style={styles.footer}>
              Issued by OpenWave • {new Date().toLocaleDateString()}
            </Text>
          </View>
        </Page>
      </Document>
    );

    // Render PDF to buffer (fix: use .toBuffer() from @react-pdf/renderer which returns a Buffer in Node.js)
    const pdfInstance = pdf(Certificate);
    // @react-pdf/renderer pdfInstance.toBuffer() returns a Node.js Buffer
    const pdfBuffer = await pdfInstance.toBuffer();

    // Pin to Pinata
    const pinataJwt = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataApiSecret = process.env.PINATA_API_SECRET;

    // If Pinata API keys are available, use the SDK
    if (pinataApiKey && pinataApiSecret) {
      const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

      // Pinata SDK expects a ReadableStream or a file path, not a Blob or Buffer directly.
      // Write the buffer to a temporary file, then stream it.
      const tmpDir = os.tmpdir();
      const fileName = `${projectRes.project_name}-signvault-io.pdf`;
      const filePath = path.join(tmpDir, `${Date.now()}-${fileName}`);
      await fs.promises.writeFile(filePath, pdfBuffer);

      try {
        const readableStream = fs.createReadStream(filePath);
        const response = await pinata.pinFileToIPFS(readableStream, {
          pinataMetadata: {
            name: fileName
          }
        });

        const ipfsHash = response?.IpfsHash;
        return {
          success: true,
          ipfsHash,
          url: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : undefined
        };
      } finally {
        // Clean up the temp file
        fs.promises.unlink(filePath).catch(() => {});
      }
    }

    // If only JWT is available, use the REST API
    if (pinataJwt) {
      // Use form-data package for Node.js
      const formData = new FormData();
      formData.append("file", pdfBuffer, {
        filename: `${projectRes.project_name}-signvault-io.pdf`,
        contentType: "application/pdf"
      });

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
          ...formData.getHeaders?.() // Only available in Node.js form-data
        },
        body: formData as any
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Pinata upload failed: ${res.status} ${txt}`);
      }

      const json = await res.json();
      const ipfsHash = json?.IpfsHash;
      return {
        success: true,
        ipfsHash,
        url: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : undefined
      };
    }

    return { success: false, error: "No Pinata credentials configured" };
  } catch (error: any) {
    console.error("generateCertificateForProject error:", error);
    return { success: false, error: error?.message || String(error) };
  }
}