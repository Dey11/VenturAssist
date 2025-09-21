"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { JobStatus } from "@/generated/prisma/client";
import { FileText, AlertTriangle } from "lucide-react";

interface JobData {
  id: string;
  type: string;
  status: JobStatus;
  payload: any;
  result: any;
  logs: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StartupData {
  id: string;
  name: string;
  overallStatus: JobStatus;
}

interface DataSource {
  id: string;
  type: string;
  fileName: string | null;
  status: JobStatus;
  createdAt: string;
}

interface ProgressData {
  percentage: number;
  completed: number;
  failed: number;
  inProgress: number;
  total: number;
}

interface JobResponse {
  job: JobData;
  startup: StartupData;
  dataSources: DataSource[];
  progress: ProgressData;
  queueStatus: any;
}

interface StartupJobsResponse {
  jobs: JobData[];
  overallProgress: number;
  overallStatus: JobStatus;
  currentStep: string;
  hasIngestionJob: boolean;
  hasRedLensJob: boolean;
  ingestionJobStatus: JobStatus | null;
  redLensJobStatus: JobStatus | null;
}

export default function ProcessingPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const params = useParams();
  const startupId = params.startupId as string;

  const [jobData, setJobData] = useState<JobResponse | null>(null);
  const [startupJobs, setStartupJobs] = useState<StartupJobsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchJobData = useCallback(async () => {
    try {
      setError(null);

      // Get all jobs for this startup
      const jobsResponse = await fetch(`/api/startup/${startupId}/jobs`);
      if (!jobsResponse.ok) {
        if (jobsResponse.status === 404) {
          throw new Error("Startup not found");
        }
        throw new Error(
          `Failed to fetch startup jobs: ${jobsResponse.statusText}`,
        );
      }

      const jobsData = await jobsResponse.json();
      setStartupJobs(jobsData);

      if (!jobsData.jobs || jobsData.jobs.length === 0) {
        throw new Error(
          "No jobs found for this startup. The analysis may not have been started yet.",
        );
      }

      // Get the ingestion job for detailed data (data sources are associated with ingestion job)
      const ingestionJob = jobsData.jobs.find(
        (job: any) => job.type === "EXTRACT_DATA_FROM_SOURCE",
      );
      const jobToFetch = ingestionJob || jobsData.jobs[0]; // Fallback to most recent job

      const jobResponse = await fetch(`/api/jobs/${jobToFetch.id}`);
      if (!jobResponse.ok) {
        if (jobResponse.status === 404) {
          throw new Error("Job not found. The analysis may have been deleted.");
        }
        throw new Error(`Failed to fetch job data: ${jobResponse.statusText}`);
      }

      const jobData = await jobResponse.json();
      setJobData(jobData);
      setError(null);
      setLoading(false); // Set loading to false on successful fetch
      setLastUpdated(new Date()); // Update last updated timestamp

      // Debug logging
      console.log("Job status update:", {
        overallStatus: jobsData.overallStatus,
        overallProgress: jobsData.overallProgress,
        currentStep: jobsData.currentStep,
        hasIngestionJob: jobsData.hasIngestionJob,
        hasRedLensJob: jobsData.hasRedLensJob,
        ingestionJobStatus: jobsData.ingestionJobStatus,
        redLensJobStatus: jobsData.redLensJobStatus,
      });
    } catch (err) {
      console.error("Error fetching job data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch job data");
      setLoading(false);
    }
  }, [startupId]);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    // Find the most recent job for this startup
    fetchJobData();
  }, [session, router, startupId, fetchJobData]);

  useEffect(() => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Start polling if overall analysis is still in progress
    if (startupJobs && !isJobComplete(startupJobs.overallStatus)) {
      console.log(
        "Starting polling for job status:",
        startupJobs.overallStatus,
      );
      const interval = setInterval(() => {
        console.log("Polling for job updates...");
        fetchJobData();
      }, 3000); // Poll every 3 seconds
      setPollingInterval(interval);
    }

    // Redirect to analysis page when overall analysis is completed successfully
    if (startupJobs && startupJobs.overallStatus === JobStatus.COMPLETED) {
      console.log("Analysis completed, redirecting in 2 seconds...", {
        overallStatus: startupJobs.overallStatus,
        overallProgress: startupJobs.overallProgress,
        hasIngestionJob: startupJobs.hasIngestionJob,
        hasRedLensJob: startupJobs.hasRedLensJob,
        ingestionJobStatus: startupJobs.ingestionJobStatus,
        redLensJobStatus: startupJobs.redLensJobStatus,
      });
      setTimeout(() => {
        router.push(`/startup/${startupId}/analysis`);
      }, 2000); // Wait 2 seconds to show completion status
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [startupJobs, router, startupId, fetchJobData]);

  const isJobComplete = (status: JobStatus) => {
    return status === JobStatus.COMPLETED || status === JobStatus.FAILED;
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED:
        return "text-green-600 bg-green-100";
      case JobStatus.FAILED:
        return "text-red-600 bg-red-100";
      case JobStatus.IN_PROGRESS:
        return "text-blue-600 bg-blue-100";
      case JobStatus.PENDING:
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED:
        return "Completed";
      case JobStatus.FAILED:
        return "Failed";
      case JobStatus.IN_PROGRESS:
        return "In Progress";
      case JobStatus.PENDING:
        return "Pending";
      default:
        return "Pending ";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading job status...</p>
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error</h2>
          <p className="mb-4 text-gray-600">
            {error || "Failed to load job data"}
          </p>
          <button
            onClick={() => router.push(`/startup/${startupId}`)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Startup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 pt-16 md:pt-4 md:pl-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Analyzing {jobData.startup.name}
            </h1>
            <p className="text-gray-600">
              Our AI is processing your startup data and generating insights.
            </p>
            {lastUpdated && (
              <div className="mt-2 text-sm text-gray-500">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                {startupJobs && !isJobComplete(startupJobs.overallStatus) && (
                  <span className="ml-2 inline-flex items-center">
                    <div className="mr-1 h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                    Live updates
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Overall Analysis Status Card */}
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Analysis Status
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(startupJobs?.overallStatus || JobStatus.NOT_STARTED)}`}
              >
                {getStatusText(
                  startupJobs?.overallStatus || JobStatus.NOT_STARTED,
                )}
              </span>
            </div>

            {/* Current Step */}
            {startupJobs && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {startupJobs.currentStep}
                </p>
              </div>
            )}

            {/* Overall Progress Bar */}
            <div className="mb-4">
              <div className="mb-2 text-sm text-gray-600">
                <span>Overall Progress</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${startupJobs?.overallProgress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Individual Job Statuses */}
          {startupJobs && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Processing Steps
              </h2>
              <div className="space-y-4">
                {/* Ingestion Job */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Data Processing
                      </h3>
                      <p className="text-sm text-gray-600">
                        Extracting insights from uploaded files
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(startupJobs.ingestionJobStatus || JobStatus.NOT_STARTED)}`}
                    >
                      {getStatusText(
                        startupJobs.ingestionJobStatus || JobStatus.NOT_STARTED,
                      )}
                    </span>
                  </div>
                </div>

                {/* RedLens Job */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Risk Assessment
                      </h3>
                      <p className="text-sm text-gray-600">
                        Running specialized risk analysis modules
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(startupJobs.redLensJobStatus || JobStatus.NOT_STARTED)}`}
                    >
                      {getStatusText(
                        startupJobs.redLensJobStatus || JobStatus.NOT_STARTED,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Details */}
          {jobData && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Job Details
              </h2>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-700">Job ID:</span>
                  <span className="ml-2 font-mono text-gray-600">
                    {jobData.job.id}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Started:</span>
                  <span className="ml-2 text-gray-600">
                    {jobData.job.startedAt
                      ? new Date(jobData.job.startedAt).toLocaleString()
                      : "Not started"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Completed:</span>
                  <span className="ml-2 text-gray-600">
                    {jobData.job.completedAt
                      ? new Date(jobData.job.completedAt).toLocaleString()
                      : "Not completed"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(jobData.job.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {jobData.job.logs && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700">Logs:</span>
                  <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-3 text-xs text-gray-600">
                    {jobData.job.logs}
                  </pre>
                </div>
              )}
            </div>
          )}
          {/* 
          Action Buttons */}
          {/* {jobData && (
            <div className="mt-6 flex space-x-4">
              {isJobComplete(jobData.job.status) ? (
                <button
                  onClick={() => router.push(`/startup/${startupId}`)}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  View Results
                </button>
              ) : (
                <button
                  onClick={fetchJobData}
                  className="rounded-md bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
                >
                  Refresh Status
                </button>
              )}
              <button
                onClick={() => router.push("/startups")}
                className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
              >
                Back to Startups
              </button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
