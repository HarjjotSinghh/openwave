import { Suspense } from "react";
import { Octokit } from "octokit";
import RepoPageClient from "./repo-page";
import { SessionProvider } from "next-auth/react";

interface User {
  username?: string;
  email?: string;
  name?: string;
  image?: string;
}

interface session {
  accessToken?: string;
  expires?: string;
  user?: {
    username?: string;
    email?: string;
    name?: string;
    image?: string;
  };
}

interface ProjectData {
  projectOwner: session;
  project_repository: string;
}

async function getRepoData(repoName: string, username: string) {
  try {
    // Fetch repo data and issues (private)
    const repoResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/specific-repo?project_repository=${repoName}&username=${username}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    
    if (!repoResponse.ok) {
      throw new Error(`HTTP error! status: ${repoResponse.status}`);
    }
    
    const repoJson = await repoResponse.json();
    const processedRepoData =
      repoJson.project && repoJson.project.length > 0
        ? repoJson.project[0]
        : repoJson.project || null;

    if (!processedRepoData) {
      return null;
    }

    // Fetch contributor applications
    const contribResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/contributor-applications?projectName=${repoName}&username=${username}`,
      { method: "GET" }
    );
    const contribData = await contribResponse.json();

    // Fetch likes
    const likesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/likes?userId=${username}&projectName=${repoName}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    const likesData = await likesResponse.json();

    // Fetch issues from DB for private repos
    let issues = [];
    if (processedRepoData?.type !== "public") {
      const issuesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/add-issues?project_repository=${repoName}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const issuesData = await issuesResponse.json();
      issues = issuesData.projects || [];
    }

    return {
      repoData: processedRepoData,
      contributorsData: contribData.applications || [],
      likesData: likesData.projects || [],
      issues,
      projectData: {
        projectOwner: { user: { username } } as session,
        project_repository: processedRepoData?.project_repository,
      }
    };
  } catch (error) {
    console.error("Error fetching repo data:", error);
    return null;
  }
}

async function getGitHubData(repoData: any, accessToken?: string) {
  if (!repoData || !accessToken) {
    return {
      contributors: [],
      languages: {},
      commitData: [],
      collabs: [],
      repoValue: [],
      issues: []
    };
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    
    // Verify authentication
    await octokit.request("GET /user");
    
    const headers = { "X-GitHub-Api-Version": "2022-11-28" };
    const repoOwner =
      repoData?.owner?.login ||
      repoData?.projectOwner ||
      repoData?.projectOwner?.user?.username;

    if (repoData?.type === "public") {
      const [
        contributorsResponse,
        languagesResponse,
        commitsResponse,
        readmeResponse,
        recentIssuesResponse,
        collaboratorsResponse,
      ] = await Promise.all([
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/contributors`,
          { owner: repoOwner, repo: repoData.project_repository, per_page: 100 }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/languages`,
          { owner: repoOwner, repo: repoData.project_repository }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/commits`,
          { owner: repoOwner, repo: repoData.project_repository, per_page: 10 }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/readme`,
          { owner: repoOwner, repo: repoData.project_repository, headers }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/issues`,
          {
            owner: repoOwner,
            repo: repoData.project_repository,
            state: "open",
            sort: "updated",
            direction: "desc",
            per_page: 50,
          }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/collaborators`,
          { owner: repoOwner, repo: repoData.project_repository, per_page: 100 }
        ),
      ]);

      // Transform issues
      const transformedIssues = recentIssuesResponse.data.map((issue: any) => ({
        id: issue.id,
        issue_name: issue.title,
        issue_description: issue.body || "",
        issue_url: issue.html_url,
        project_issues: issue.number.toString(),
        issue_date: issue.created_at,
        Difficulty:
          issue.labels.find((label: any) =>
            [
              "easy",
              "medium",
              "hard",
              "beginner",
              "intermediate",
              "advanced",
            ].includes(label.name.toLowerCase())
          )?.name || "medium",
        priority:
          issue.labels.find((label: any) =>
            ["low", "medium", "high", "critical"].includes(
              label.name.toLowerCase()
            )
          )?.name || "medium",
        project_repository: repoData.project_repository,
        rewardAmount:
          issue.labels
            .find((label: any) =>
              label.name.toLowerCase().includes("reward")
            )
            ?.name.match(/\d+/)?.[0] || "0",
        assignees: issue.assignees || [],
        labels: issue.labels || [],
        state: issue.state,
        updated_at: issue.updated_at,
        user: issue.user,
      }));

      const readmeContent = Buffer.from(
        readmeResponse.data.content,
        "base64"
      ).toString("utf-8");

      return {
        contributors: contributorsResponse.data,
        languages: languagesResponse.data,
        commitData: commitsResponse.data,
        collabs: collaboratorsResponse.data,
        repoValue: [{
          ...readmeResponse.data,
          content: readmeContent,
          __html: readmeContent,
        }],
        issues: transformedIssues
      };
    } else {
      // Private repo: only collabs, languages, commits, readme
      const [
        contributorsResponse,
        languagesResponse,
        commitsResponse,
        readmeResponse,
      ] = await Promise.all([
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/collaborators`,
          { owner: repoOwner, repo: repoData.project_repository }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/languages`,
          { owner: repoOwner, repo: repoData.project_repository }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/commits`,
          { owner: repoOwner, repo: repoData.project_repository }
        ),
        octokit.request(
          `GET /repos/${repoOwner}/${repoData.project_repository}/readme`,
          { owner: repoOwner, repo: repoData.project_repository, headers }
        ),
      ]);

      const readmeContent = Buffer.from(
        readmeResponse.data.content,
        "base64"
      ).toString("utf-8");

      return {
        contributors: contributorsResponse.data,
        languages: languagesResponse.data,
        commitData: commitsResponse.data,
        collabs: [],
        repoValue: [{
          ...readmeResponse.data,
          content: readmeContent,
          __html: readmeContent,
        }],
        issues: []
      };
    }
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return {
      contributors: [],
      languages: {},
      commitData: [],
      collabs: [],
      repoValue: [],
      issues: []
    };
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ Repo: string }> }) {
  const {Repo} = await params;
  const repoName = Repo;
  
  // For now, we'll need to get the username from somewhere
  // In a real app, this would come from the session or auth context
  const username = "default-user"; // This should be replaced with actual user logic
  
  const repoData = await getRepoData(repoName, username);
  
  if (!repoData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Project Not Found
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            The project you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // For now, we'll pass empty GitHub data since we don't have access to the user's access token
  // In a real implementation, you'd need to handle authentication differently for server components
  const githubData = {
    contributors: [],
    languages: {},
    commitData: [],
    collabs: [],
    repoValue: [],
    issues: repoData.issues
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionProvider>
      <RepoPageClient
        repoName={repoName}
        repoData={repoData.repoData}
        contributorsData={repoData.contributorsData}
        likesData={repoData.likesData}
        issues={githubData.issues}
        contributors={githubData.contributors}
        languages={githubData.languages}
        commitData={githubData.commitData}
        collabs={githubData.collabs}
        repoValue={githubData.repoValue}
        projectData={repoData.projectData}
      />
      </SessionProvider>
    </Suspense>
  );
}
