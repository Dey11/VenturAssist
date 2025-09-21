"use client";

import { StartupCard } from "@/components/ui/startup-card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { JobStatus } from "@/generated/prisma/client";

interface Startup {
  id: string;
  name: string;
  description: string | null;
  overallStatus: JobStatus;
  updatedAt: string;
  teamMembers: any[];
  risks: any[];
  keyMetrics: any[];
}

export default function StartupsPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    fetchStartups();
  }, [session, router]);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/startup");

      if (!response.ok) {
        throw new Error(`Failed to fetch startups: ${response.statusText}`);
      }

      const data = await response.json();
      setStartups(data);
    } catch (err) {
      console.error("Error fetching startups:", err);
      setError(err instanceof Error ? err.message : "Failed to load startups");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (id: string) => {
    router.push(`/startup/${id}/analysis`);
  };

  const handleUploadPitchDeck = () => {
    router.push("/add-startup");
  };

  const getRiskLevel = (risks: any[]): "Low" | "Medium" | "High" => {
    if (!risks || risks.length === 0) return "Low";

    const hasHighRisk = risks.some(
      (risk) => risk.severity === "HIGH" || risk.severity === "CRITICAL",
    );
    const hasMediumRisk = risks.some((risk) => risk.severity === "MEDIUM");

    if (hasHighRisk) return "High";
    if (hasMediumRisk) return "Medium";
    return "Low";
  };

  const getTeamSize = (teamMembers: any[]): number => {
    return teamMembers?.length || 0;
  };

  const getARR = (keyMetrics: any[]): string => {
    const arrMetric = keyMetrics?.find(
      (metric) =>
        metric.name?.toLowerCase().includes("arr") ||
        metric.name?.toLowerCase().includes("annual recurring revenue"),
    );
    return arrMetric?.value || "N/A";
  };

  if (loading) {
    return (
      <div className="min-h-screen p-5">
        <div className="mx-auto rounded-lg bg-white px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Loading startups...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-5">
        <div className="mx-auto rounded-lg bg-white px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Error Loading Startups
              </h3>
              <p className="mb-4 text-gray-600">{error}</p>
              <Button onClick={fetchStartups} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5">
      <div className="mx-auto rounded-lg bg-white px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-dmsans mb-2 text-2xl font-bold text-gray-900">
              Your Startup Analyses
            </h1>
            <p className="font-dmsans max-w-2xl text-xl text-gray-600">
              Browse, compare, and revisit all the startups you've analyzed with
              DealScope.
            </p>
          </div>
          <Button
            variant="default"
            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
            onClick={handleUploadPitchDeck}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Startup
          </Button>
        </div>

        {startups.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No startups yet
            </h3>
            <p className="mb-6 text-gray-600">
              Get started by analyzing your first startup
            </p>
            <Button
              variant="default"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              onClick={handleUploadPitchDeck}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Startup
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => (
              <StartupCard
                key={startup.id}
                id={startup.id}
                name={startup.name}
                tagline={startup.description || "No description available"}
                teamSize={getTeamSize(startup.teamMembers)}
                arr={getARR(startup.keyMetrics)}
                riskLevel={getRiskLevel(startup.risks)}
                onViewAnalysis={handleViewAnalysis}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
