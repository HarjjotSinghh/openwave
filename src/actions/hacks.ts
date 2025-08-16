"use server";

import { db } from "@/db";
import { hackathons, hack_projects, project_votes, project_split_payments } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

// Hackathon Actions
export async function createHackathon(formData: {
  name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  image_url?: string;
  created_by: string;
}) {
  try {
    const hackathon = await db.insert(hackathons).values({
      id: uuidv4(),
      ...formData,
      status: "upcoming",
    }).returning();

    revalidatePath("/hacks");
    return { success: true, hackathon: hackathon[0] };
  } catch (error) {
    console.error("Error creating hackathon:", error);
    return { success: false, error: "Failed to create hackathon" };
  }
}

export async function getAllHackathons() {
  try {
    const allHackathons = await db.select().from(hackathons).orderBy(hackathons.created_at);
    return { success: true, hackathons: allHackathons };
  } catch (error) {
    console.error("Error fetching hackathons:", error);
    return { success: false, error: "Failed to fetch hackathons" };
  }
}

export async function getHackathonById(id: string) {
  try {
    const hackathon = await db.select().from(hackathons).where(eq(hackathons.id, id));
    if (hackathon.length === 0) {
      return { success: false, error: "Hackathon not found" };
    }
    return { success: true, hackathon: hackathon[0] };
  } catch (error) {
    console.error("Error fetching hackathon:", error);
    return { success: false, error: "Failed to fetch hackathon" };
  }
}

// Hack Project Actions
export async function createHackProject(formData: {
  hackathon_id: string;
  project_name: string;
  description: string;
  repository: string;
  image_url?: string;
  owner_id: string;
  team_members: any[];
  tech_stack: string[];
  contract_address?: string;
}) {
  try {
    const project = await db.insert(hack_projects).values({
      id: uuidv4(),
      ...formData,
    }).returning();

    revalidatePath("/hacks");
    revalidatePath(`/hacks/${formData.hackathon_id}`);
    return { success: true, project: project[0] };
  } catch (error) {
    console.error("Error creating hack project:", error);
    return { success: false, error: "Failed to create hack project" };
  }
}

export async function getHackProjectsByHackathon(hackathonId: string) {
  try {
    const projects = await db.select().from(hack_projects).where(eq(hack_projects.hackathon_id, hackathonId));
    return { success: true, projects };
  } catch (error) {
    console.error("Error fetching hack projects:", error);
    return { success: false, error: "Failed to fetch hack projects" };
  }
}

export async function getHackProjectById(id: string) {
  try {
    const project = await db.select().from(hack_projects).where(eq(hack_projects.id, id));
    if (project.length === 0) {
      return { success: false, error: "Project not found" };
    }
    return { success: true, project: project[0] };
  } catch (error) {
    console.error("Error fetching hack project:", error);
    return { success: false, error: "Failed to fetch hack project" };
  }
}

// Voting Actions
export async function castVote(formData: {
  project_id: string;
  voter_id: string;
  vote_type: "contributor" | "maintainer";
}) {
  try {
    // Check if user already voted for this project
    const existingVote = await db.select()
      .from(project_votes)
      .where(and(
        eq(project_votes.project_id, formData.project_id),
        eq(project_votes.voter_id, formData.voter_id)
      ));

    if (existingVote.length > 0) {
      // Update existing vote
      await db.update(project_votes)
        .set({ vote_type: formData.vote_type })
        .where(and(
          eq(project_votes.project_id, formData.project_id),
          eq(project_votes.voter_id, formData.voter_id)
        ));
    } else {
      // Create new vote
      await db.insert(project_votes).values({
        id: uuidv4(),
        ...formData,
      });
    }

    revalidatePath(`/hacks/project/${formData.project_id}`);
    return { success: true };
  } catch (error) {
    console.error("Error casting vote:", error);
    return { success: false, error: "Failed to cast vote" };
  }
}

export async function getProjectVotes(projectId: string) {
  try {
    const votes = await db.select().from(project_votes).where(eq(project_votes.project_id, projectId));
    
    const contributorVotes = votes.filter(vote => vote.vote_type === "contributor").length;
    const maintainerVotes = votes.filter(vote => vote.vote_type === "maintainer").length;
    
    return { 
      success: true, 
      votes,
      contributorVotes,
      maintainerVotes,
      totalVotes: votes.length
    };
  } catch (error) {
    console.error("Error fetching project votes:", error);
    return { success: false, error: "Failed to fetch project votes" };
  }
}

export async function getUserVoteForProject(projectId: string, userId: string) {
  try {
    const vote = await db.select()
      .from(project_votes)
      .where(and(
        eq(project_votes.project_id, projectId),
        eq(project_votes.voter_id, userId)
      ));

    return { success: true, vote: vote[0] || null };
  } catch (error) {
    console.error("Error fetching user vote:", error);
    return { success: false, error: "Failed to fetch user vote" };
  }
}

// Split Payment Actions
export async function createSplitPayment(formData: {
  project_id: string;
  total_amount: string;
  contributor_share: string;
  maintainer_share: string;
  transaction_hash?: string;
}) {
  try {
    const payment = await db.insert(project_split_payments).values({
      id: uuidv4(),
      ...formData,
    }).returning();
    
    revalidatePath(`/hacks/project/${formData.project_id}`);
    return { success: true, payment: payment[0] };
  } catch (error) {
    console.error("Error creating split payment:", error);
    return { success: false, error: "Failed to create split payment" };
  }
}

export async function getProjectSplitPayments(projectId: string) {
  try {
    const payments = await db.select()
      .from(project_split_payments)
      .where(eq(project_split_payments.project_id, projectId));
    
    return { success: true, payments };
  } catch (error) {
    console.error("Error fetching split payments:", error);
    return { success: false, error: "Failed to fetch split payments" };
  }
}

export async function updateSplitPaymentStatus(paymentId: string, status: string, transactionHash?: string) {
  try {
    const updateData: any = { status };
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    await db.update(project_split_payments)
      .set(updateData)
      .where(eq(project_split_payments.id, paymentId));

    revalidatePath("/hacks");
    return { success: true };
  } catch (error) {
    console.error("Error updating split payment status:", error);
    return { success: false, error: "Failed to update split payment status" };
  }
}

// Dashboard Statistics
export async function getHacksDashboardStats() {
  try {
    const [hackathonCount] = await db.select({ count: sql<number>`count(*)` }).from(hackathons);
    const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(hack_projects);
    const [voteCount] = await db.select({ count: sql<number>`count(*)` }).from(project_votes);
    const [paymentCount] = await db.select({ count: sql<number>`count(*)` }).from(project_split_payments);

    return {
      success: true,
      stats: {
        totalHackathons: hackathonCount.count,
        totalProjects: projectCount.count,
        totalVotes: voteCount.count,
        totalPayments: paymentCount.count,
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}