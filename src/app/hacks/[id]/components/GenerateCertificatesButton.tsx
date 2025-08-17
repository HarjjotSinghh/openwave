"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function GenerateCertificatesButton({ hackathonId }: { hackathonId: string }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);


  const handleGenerate = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/hacks/${hackathonId}/generate-certificates`, { method: "POST" });
      const json = await res.json();
      if (json.success) setResults(json.results || []);
      else alert(json.error || "Failed");
    } catch (err) {
      console.error(err);
      alert("Failed to generate certificates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 flex items-center gap-2 flex-wrap">
      <Button disabled={loading} onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate Certificates"}
      </Button>

      {!loading && results.length > 0 && (
        <ul className="mt-4">
          {results.map(r => (
            <li key={r.projectId}>
              {r.ipfsHash ? (
                <a href={r.url} target="_blank" rel="noreferrer">{r.ipfsHash}</a>
              ) : (
                <span>Error: {r.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {loading && <p>Generating...</p>}
    </div>
  );
}