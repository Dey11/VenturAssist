import { Job } from "bullmq";
import { getQueue, QUEUE_NAMES } from "../config";
import {
  CompetitorAnalysisJobData,
  CompetitorAnalysisJobResult,
  QueueJobOptions,
} from "../types";

/**
 * Get the competitor analysis queue instance
 */
export function getCompetitorQueue() {
  return getQueue(QUEUE_NAMES.COMPETITOR);
}

/**
 * Add a competitor analysis job to the queue
 */
export async function addCompetitorJob(
  jobData: CompetitorAnalysisJobData,
  options?: QueueJobOptions,
): Promise<Job<CompetitorAnalysisJobData, CompetitorAnalysisJobResult>> {
  const queue = getCompetitorQueue();

  const job = await queue.add("competitor-analysis", jobData, {
    delay: options?.delay || 0,
    priority: options?.priority || 0,
    attempts: options?.attempts || 3,
    backoff: options?.backoff || {
      type: "exponential",
      delay: 2000,
    },
  });

  console.log(
    `Competitor analysis job ${job.id} added to queue for startup ${jobData.startupId}`,
  );
  return job;
}

/**
 * Get the status of a competitor analysis job
 */
export async function getCompetitorJobStatus(jobId: string) {
  const queue = getCompetitorQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    state: await job.getState(),
  };
}

/**
 * Get all competitor analysis jobs for a startup
 */
export async function getCompetitorJobsForStartup(startupId: string) {
  const queue = getCompetitorQueue();
  const jobs = await queue.getJobs([
    "waiting",
    "active",
    "completed",
    "failed",
  ]);

  return jobs.filter((job) => job.data.startupId === startupId);
}

/**
 * Clean up old completed competitor analysis jobs
 */
export async function cleanCompetitorQueue() {
  const queue = getCompetitorQueue();

  // Remove completed jobs older than 7 days
  await queue.clean(7 * 24 * 60 * 60 * 1000, 100, "completed");

  // Remove failed jobs older than 3 days
  await queue.clean(3 * 24 * 60 * 60 * 1000, 50, "failed");

  console.log("Competitor queue cleanup completed");
}
