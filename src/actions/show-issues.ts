"use server";

import { db } from '@/db';
import { issues } from '@/db/schema';
import { eq } from 'drizzle-orm';
export async function getAllIssues(projectRepository: string) {
  try {
    const issuesData = await db.select().from(issues).orderBy(issues.priority).where(eq(issues.project_repository, projectRepository));
    return { success: true, data: issuesData };
  } catch (error) {
    console.error('Error fetching issues:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}