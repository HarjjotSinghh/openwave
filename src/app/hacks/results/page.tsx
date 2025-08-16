"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/assets/components/sidebar";
import Topbar from "@/assets/components/topbar";
import { useSidebarContext } from "@/assets/components/SidebarContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Trophy, 
  Medal,
  Award,
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  BarChart,
  Calendar,
  Check,
  X
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getAllHackathons } from "@/actions/hacks";

interface Hackathon {
  id: string;
  name: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  image_url: string | null;
  status: string | null;
  created_at: Date | null;
  created_by: string | null;
}

interface ProjectResult {
  id: string;
  project_name: string;
  description: string | null;
  owner_id: string;
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  approval_percentage: number;
  voting_status: "approved" | "rejected" | "pending";
  total_split_amount: number;
  contributors_percentage: number;
  maintainers_percentage: number;
  hackathon_name: string;
  hackathon_id: string;
}

export default function ResultsPage() {
  const { data: session } = useSession();
  const { isShrunk } = useSidebarContext();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [projectResults, setProjectResults] = useState<ProjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHackathon, setSelectedHackathon] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const hackathonsResult = await getAllHackathons();
      
      if (hackathonsResult.success && hackathonsResult.hackathons) {
        setHackathons(hackathonsResult.hackathons);
        
        // Fetch voting results for all projects
        const allResults: ProjectResult[] = [];
        
        for (const hackathon of hackathonsResult.hackathons) {
          try {
            // Fetch projects and their voting results
            const projectsResponse = await fetch(`/api/hacks/${hackathon.id}/projects`);
            if (projectsResponse.ok) {
              const projects = await projectsResponse.json();
              
              for (const project of projects) {
                try {
                  const votesResponse = await fetch(`/api/projects/${project.id}/votes`);
                  const splitsResponse = await fetch(`/api/projects/${project.id}/splits`);
                  
                  let votes = [];
                  let splits = [];
                  
                  if (votesResponse.ok) {
                    votes = await votesResponse.json();
                  }
                  
                  if (splitsResponse.ok) {
                    splits = await splitsResponse.json();
                  }
                  
                  const yesVotes = votes.filter((v: any) => v.vote === "yes").length;
                  const noVotes = votes.filter((v: any) => v.vote === "no").length;
                  const totalVotes = votes.length;
                  const approvalPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
                  
                  const totalSplitAmount = splits.reduce((sum: number, split: any) => 
                    sum + parseFloat(split.amount || "0"), 0
                  );
                  
                  const contributorsSplits = splits.filter((s: any) => s.recipient_type === "contributor");
                  const maintainersSplits = splits.filter((s: any) => s.recipient_type === "maintainer");
                  
                  const contributorsAmount = contributorsSplits.reduce((sum: number, split: any) => 
                    sum + parseFloat(split.amount || "0"), 0
                  );
                  const maintainersAmount = maintainersSplits.reduce((sum: number, split: any) => 
                    sum + parseFloat(split.amount || "0"), 0
                  );
                  
                  const contributorsPercentage = totalSplitAmount > 0 ? 
                    (contributorsAmount / totalSplitAmount) * 100 : 0;
                  const maintainersPercentage = totalSplitAmount > 0 ? 
                    (maintainersAmount / totalSplitAmount) * 100 : 0;
                  
                  let votingStatus: "approved" | "rejected" | "pending" = "pending";
                  if (totalVotes >= 5) { // Quorum threshold
                    votingStatus = approvalPercentage >= 60 ? "approved" : "rejected";
                  }
                  
                  allResults.push({
                    id: project.id,
                    project_name: project.project_name,
                    description: project.description,
                    owner_id: project.owner_id,
                    total_votes: totalVotes,
                    yes_votes: yesVotes,
                    no_votes: noVotes,
                    approval_percentage: approvalPercentage,
                    voting_status: votingStatus,
                    total_split_amount: totalSplitAmount,
                    contributors_percentage: contributorsPercentage,
                    maintainers_percentage: maintainersPercentage,
                    hackathon_name: hackathon.name,
                    hackathon_id: hackathon.id
                  });
                } catch (error) {
                  console.error(`Error processing project ${project.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching data for hackathon ${hackathon.id}:`, error);
          }
        }
        
        setProjectResults(allResults);
      }
    } catch (error) {
      console.error("Error fetching results data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = selectedHackathon === "all" 
    ? projectResults 
    : projectResults.filter(result => result.hackathon_id === selectedHackathon);

  const topProjects = filteredResults
    .filter(result => result.voting_status === "approved")
    .sort((a, b) => b.approval_percentage - a.approval_percentage)
    .slice(0, 10);

  const totalFunding = filteredResults.reduce((sum, result) => sum + result.total_split_amount, 0);
  const approvedProjects = filteredResults.filter(result => result.voting_status === "approved");
  const avgApprovalRate = filteredResults.length > 0 
    ? filteredResults.reduce((sum, result) => sum + result.approval_percentage, 0) / filteredResults.length
    : 0;

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isShrunk ? "ml-16" : "ml-64"}`}>
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button variant="ghost" asChild>
                    <Link href="/hacks">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Hacks
                    </Link>
                  </Button>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  Hackathon Results & Analytics
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  View voting outcomes, funding distributions, and performance metrics
                </p>
              </div>
              
              <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select hackathon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hackathons</SelectItem>
                  {hackathons.map(hackathon => (
                    <SelectItem key={hackathon.id} value={hackathon.id}>
                      {hackathon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        Total Projects
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {filteredResults.length}
                      </p>
                    </div>
                    <BarChart className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        Approved Projects
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {approvedProjects.length}
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        Total Funding
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {formatAmount(totalFunding)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        Avg Approval Rate
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {avgApprovalRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="leaderboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="leaderboard">🏆 Leaderboard</TabsTrigger>
                <TabsTrigger value="voting">📊 Voting Results</TabsTrigger>
                <TabsTrigger value="funding">💰 Funding Splits</TabsTrigger>
                <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Top Approved Projects
                    </CardTitle>
                    <CardDescription>
                      Projects ranked by approval percentage and vote count
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topProjects.length > 0 ? (
                        topProjects.map((project, index) => {
                          const rankIcons = [Trophy, Medal, Award];
                          const RankIcon = index < 3 ? rankIcons[index] : Award;
                          const rankColors = ["text-yellow-500", "text-gray-400", "text-orange-500"];
                          const rankColor = index < 3 ? rankColors[index] : "text-neutral-400";
                          
                          return (
                            <div key={project.id} className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                  <RankIcon className={`w-4 h-4 ${rankColor}`} />
                                </div>
                                <div className="text-lg font-bold text-neutral-500 dark:text-neutral-400">
                                  #{index + 1}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-semibold text-neutral-900 dark:text-white">
                                  {project.project_name}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  by @{project.owner_id} • {project.hackathon_name}
                                </p>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {project.approval_percentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-neutral-500">
                                  {project.total_votes} votes
                                </div>
                              </div>
                              
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/hacks/project/${project.id}`}>
                                  View Project
                                </Link>
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                          No approved projects yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voting" className="space-y-6">
                <div className="grid gap-4">
                  {filteredResults.map((project) => (
                    <Card key={project.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{project.project_name}</CardTitle>
                            <CardDescription>
                              by @{project.owner_id} • {project.hackathon_name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              project.voting_status === "approved" ? "default" :
                              project.voting_status === "rejected" ? "destructive" : "secondary"
                            }>
                              {project.voting_status === "approved" && <Check className="w-3 h-3 mr-1" />}
                              {project.voting_status === "rejected" && <X className="w-3 h-3 mr-1" />}
                              {project.voting_status.charAt(0).toUpperCase() + project.voting_status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                              Approval Rate
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                              {project.approval_percentage.toFixed(1)}%
                            </div>
                            <Progress value={project.approval_percentage} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                              Vote Breakdown
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="font-medium">{project.yes_votes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <X className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{project.no_votes}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                              Funding Amount
                            </div>
                            <div className="text-lg font-bold text-neutral-900 dark:text-white">
                              {formatAmount(project.total_split_amount)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="funding" className="space-y-6">
                <div className="grid gap-4">
                  {filteredResults
                    .filter(project => project.total_split_amount > 0)
                    .map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{project.project_name}</CardTitle>
                        <CardDescription>
                          Total Funding: {formatAmount(project.total_split_amount)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                              Contributors Share
                            </div>
                            <div className="text-xl font-bold text-blue-600 mb-2">
                              {project.contributors_percentage.toFixed(1)}%
                            </div>
                            <Progress value={project.contributors_percentage} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                              Maintainers Share
                            </div>
                            <div className="text-xl font-bold text-green-600 mb-2">
                              {project.maintainers_percentage.toFixed(1)}%
                            </div>
                            <Progress value={project.maintainers_percentage} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Approved</span>
                          <span className="font-medium">{filteredResults.filter(p => p.voting_status === "approved").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Rejected</span>
                          <span className="font-medium">{filteredResults.filter(p => p.voting_status === "rejected").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Pending</span>
                          <span className="font-medium">{filteredResults.filter(p => p.voting_status === "pending").length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Funding Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Distributed</span>
                          <span className="font-medium">{formatAmount(totalFunding)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Avg per Project</span>
                          <span className="font-medium">
                            {filteredResults.length > 0 ? formatAmount(totalFunding / filteredResults.length) : "$0"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Funded Projects</span>
                          <span className="font-medium">
                            {filteredResults.filter(p => p.total_split_amount > 0).length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
