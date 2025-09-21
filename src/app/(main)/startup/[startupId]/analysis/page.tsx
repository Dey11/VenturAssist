"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  FileText,
  Globe,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface KeyMetric {
  id: string;
  name: string;
  value: string;
  unit?: string;
  reportedDate?: string;
  insight?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  linkedInUrl?: string;
  bioSummary?: string;
}

interface MarketInfo {
  id: string;
  tam?: string;
  sam?: string;
  som?: string;
  analysis?: string;
}

interface RiskIndicator {
  id: string;
  riskTitle: string;
  explanation: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface Benchmark {
  id: string;
  metricName: string;
  startupValue: string;
  competitorAverage: string;
  insight: string;
}

interface Startup {
  id: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  overallStatus: string;
  finalSummary?: string;
  recommendation?: string;
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
  keyMetrics: KeyMetric[];
  teamMembers: TeamMember[];
  marketInfo?: MarketInfo;
  risks: RiskIndicator[];
  benchmarks: Benchmark[];
}

export default function AnalysisPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const params = useParams();
  const startupId = params.startupId as string;

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (startupId) {
      fetchStartupData();
    }
  }, [session, router, startupId]);

  const fetchStartupData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/startup/${startupId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Startup not found");
        }
        throw new Error(`Failed to fetch startup data: ${response.statusText}`);
      }

      const data = await response.json();
      setStartup(data);
    } catch (err) {
      console.error("Error fetching startup data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load startup data",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50";
      case "FAILED":
        return "text-red-600 bg-red-50";
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-600 bg-red-50 border-red-200";
      case "HIGH":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Loading analysis...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Error Loading Analysis
              </h3>
              <p className="mb-4 text-gray-600">{error}</p>
              <div className="space-x-4">
                <Button onClick={fetchStartupData} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push("/startups")}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Startups
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen p-5">
        <div className="mx-auto max-w-7xl">
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Startup not found
            </h3>
            <Button onClick={() => router.push("/startups")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Startups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/startups")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {startup.name}
                </h1>
                <div className="mt-2 flex items-center space-x-2">
                  {getStatusIcon(startup.overallStatus)}
                  <span
                    className={`rounded-full px-2 py-1 text-sm font-medium ${getStatusColor(startup.overallStatus)}`}
                  >
                    {startup.overallStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>
                Last updated: {new Date(startup.updatedAt).toLocaleDateString()}
              </p>
              {startup.websiteUrl && (
                <a
                  href={startup.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Globe className="mr-1 inline h-4 w-4" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {startup.description && (
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <FileText className="mr-2 h-5 w-5" />
              Summary
            </h2>
            <p className="leading-relaxed text-gray-700">
              {startup.description}
            </p>
          </div>
        )}

        {/* Final Summary */}
        {startup.finalSummary && (
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <Target className="mr-2 h-5 w-5" />
              AI Analysis Summary
            </h2>
            <p className="leading-relaxed text-gray-700">
              {startup.finalSummary}
            </p>
            {startup.recommendation && (
              <div className="mt-4 rounded-lg border bg-white p-4">
                <h3 className="mb-2 font-medium text-gray-900">
                  Recommendation
                </h3>
                <p className="text-gray-700">{startup.recommendation}</p>
                {startup.confidenceScore && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">
                      Confidence: {Math.round(startup.confidenceScore * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Key Metrics */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <TrendingUp className="mr-2 h-5 w-5" />
              Key Metrics
            </h2>
            {startup.keyMetrics.length > 0 ? (
              <div className="space-y-4">
                {startup.keyMetrics.map((metric) => (
                  <div key={metric.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {metric.name}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {metric.value}{" "}
                          {metric.unit && (
                            <span className="text-sm text-gray-500">
                              {metric.unit}
                            </span>
                          )}
                        </p>
                        {metric.reportedDate && (
                          <p className="mt-1 flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(metric.reportedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {metric.insight && (
                      <p className="mt-2 text-sm text-gray-600">
                        {metric.insight}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                No key metrics available
              </p>
            )}
          </div>

          {/* Team Members */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <Users className="mr-2 h-5 w-5" />
              Team Members
            </h2>
            {startup.teamMembers.length > 0 ? (
              <div className="space-y-4">
                {startup.teamMembers.map((member) => (
                  <div key={member.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {member.name}
                        </h3>
                        {member.role && (
                          <p className="text-sm text-gray-600">{member.role}</p>
                        )}
                        {member.bioSummary && (
                          <p className="mt-2 text-sm text-gray-500">
                            {member.bioSummary}
                          </p>
                        )}
                      </div>
                      {member.linkedInUrl && (
                        <a
                          href={member.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                No team members found
              </p>
            )}
          </div>

          {/* Market Information */}
          {startup.marketInfo && (
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                <BarChart3 className="mr-2 h-5 w-5" />
                Market Information
              </h2>
              <div className="space-y-4">
                {startup.marketInfo.tam && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-gray-900">
                      Total Addressable Market (TAM)
                    </h3>
                    <p className="text-lg text-blue-600">
                      {startup.marketInfo.tam}
                    </p>
                  </div>
                )}
                {startup.marketInfo.sam && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-gray-900">
                      Serviceable Available Market (SAM)
                    </h3>
                    <p className="text-lg text-blue-600">
                      {startup.marketInfo.sam}
                    </p>
                  </div>
                )}
                {startup.marketInfo.som && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-gray-900">
                      Serviceable Obtainable Market (SOM)
                    </h3>
                    <p className="text-lg text-blue-600">
                      {startup.marketInfo.som}
                    </p>
                  </div>
                )}
                {startup.marketInfo.analysis && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-gray-900">
                      Market Analysis
                    </h3>
                    <p className="text-gray-700">
                      {startup.marketInfo.analysis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Indicators */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Risk Indicators
            </h2>
            {startup.risks.length > 0 ? (
              <div className="space-y-4">
                {startup.risks.map((risk) => (
                  <div
                    key={risk.id}
                    className={`rounded-lg border p-4 ${getRiskColor(risk.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{risk.riskTitle}</h3>
                        <p className="mt-1 text-sm">{risk.explanation}</p>
                      </div>
                      <span className="rounded-full px-2 py-1 text-xs font-medium">
                        {risk.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                No risk indicators identified
              </p>
            )}
          </div>
        </div>

        {/* Benchmarks */}
        {startup.benchmarks.length > 0 && (
          <div className="mt-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <BarChart3 className="mr-2 h-5 w-5" />
              Benchmarking Results
            </h2>
            <div className="space-y-4">
              {startup.benchmarks.map((benchmark) => (
                <div key={benchmark.id} className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium text-gray-900">
                    {benchmark.metricName}
                  </h3>
                  <div className="mb-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Startup Value</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {benchmark.startupValue}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Competitor Average
                      </p>
                      <p className="text-lg font-semibold text-gray-600">
                        {benchmark.competitorAverage}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{benchmark.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
