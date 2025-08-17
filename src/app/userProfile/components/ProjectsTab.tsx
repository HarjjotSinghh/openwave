"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProjectCard } from "@/app/hacks/[id]/components/ProjectCard";
import { Button } from "@/components/ui/button";

export default function ProjectsTab({ userIdProp }: { userIdProp?: string }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});

  const userId = userIdProp || (session?.user?.username as string) || session?.user?.email;

  useEffect(() => {
    if (!userId) return;
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user-projects?userId=${userId}`);
      const json = await res.json();
      if (json.success) setProjects(json.projects || []);
      else setProjects([]);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (projectId: string) => {
    setResults((s) => ({ ...s, [projectId]: { loading: true } }));
    try {
      const res = await fetch(`/api/hacks/project/${projectId}/generate-certificate`, { method: "POST" });
      const json = await res.json();
      setResults((s) => ({ ...s, [projectId]: json }));
    } catch (err) {
      console.error(err);
      setResults((s) => ({ ...s, [projectId]: { success: false, error: "Network error" } }));
    }
  };

  if (loading) return <div className="h-40 flex items-center justify-center">Loading projects...</div>;

  if (!projects || projects.length === 0) return <div className="text-neutral-500">No projects found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((row: any) => (
        <div key={row.project.id} className="space-y-2">
          <ProjectCard project={row.project} />
          <div className="flex items-center gap-2">
            <Button onClick={() => handleGenerate(row.project.id)}>Generate Certificate</Button>
            {results[row.project.id] && (
              <div className="text-sm text-neutral-600">
                {results[row.project.id].success ? (
                  <a href={results[row.project.id].url} target="_blank" rel="noreferrer" className="text-blue-600">View on IPFS</a>
                ) : (
                  <span className="text-red-500">{results[row.project.id].error || 'Failed'}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
