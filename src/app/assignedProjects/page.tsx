import { auth } from "../../../auth";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import Sidebar from "../../assets/components/sidebar";
import Topbar from "../../assets/components/topbar";
import { Suspense } from "react";
import Link from "next/link";
import { getProjects } from "../../actions/addProjects";
import { getAllIssues } from "../../actions/show-issues";
import { getContributionsByUser } from "../../actions/contributions";
import AssignedProjectsClient from "./assigned-projects-client";
import { SidebarProvider } from "@/assets/components/SidebarContext";

interface Project {
  id: number | string;
  projectName: string;
  shortdes: string;
  project_repository: string;
  project_description: string;
  project_icon_url?: string;
  project_leads?: { name: string; avatar_url?: string }[];
  contributors_count?: number;
  available_issues_count?: number | string;
  languages?: string[] | Record<string, number>;
  status: string;
  requestDate: string;
  name: string;
  description: string;
  image_url: string;
  projectOwner: string;
  skills: string[];
  issue: string;
}

interface AssignedIssue {
  id: number | string;
  projectName: string;
  Contributor_id: string;
  issue: string;
  image_url: string;
  name: string;
  description: string;
  rewardAmount: string;
  status: string;
  issue_date: string;
  issue_name: string;
  issue_description: string;
  priority: string;
  Difficulty: string;
  project_repository: string;
  publisher: string;
}

interface UserIssue {
  id: string;
  issue_name: string;
  publisher: string;
  issue_description: string;
  issue_date: string;
  Difficulty: string;
  priority: string;
  project_repository: string;
  project_issues: string;
  rewardAmount: string;
}

export default async function Component() {
  const session = await auth();
  const currentUser = session?.user?.username;

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to view your assigned projects and issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/Login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {

    const projectsResult = await getProjects(currentUser);
    const projects = projectsResult.project || [];

    const userIssuesResult = await getAllIssues(projects[0].project_repository as string);
    const userIssues = userIssuesResult.data || [];
    console.log(userIssues,"userIssues");]
    const assignedIssuesResult = await getContributionsByUser(currentUser!);
    const assignedIssues = assignedIssuesResult.data || [];

    return (
      <Suspense>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1">
              <Topbar />
              <AssignedProjectsClient
                projects={projects}
                userIssues={userIssues}
                assignedIssues={assignedIssues}
              />
            </div>
          </div>
        </SidebarProvider>
      </Suspense>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was an error fetching data. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
}