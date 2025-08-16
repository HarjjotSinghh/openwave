import { NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { project } from '../../../db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

export async function GET(request:Request) {
    const url = new URL(request.url);
    const project_owner = url.searchParams.get('projectOwner');

    if (!project_owner) {
        return NextResponse.json({ error: 'projectOwner is required' }, { status: 400 });
    }

    try {
        // Get projects where user is either the owner OR in maintainerUserIds array
        const projectsData = await db.select().from(project).where(
            or(
                eq(project.projectOwner, project_owner),
                sql`${project.maintainerUserIds}::jsonb ? ${project_owner}`
            )
        );
        return NextResponse.json({ project: projectsData });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}