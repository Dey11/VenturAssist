import { Job } from "bullmq";
import { getWorker, QUEUE_NAMES } from "../config";
import {
  CompetitorAnalysisJobData,
  CompetitorAnalysisJobResult,
} from "../types";
import { performCompetitorAnalysis } from "../services/competitor-analyzer";
import { storeCompetitorAnalysisResult } from "../services/competitor-storage";
import prisma from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma/client";

/**
 * Process a competitor analysis job
 */
async function processCompetitorJob(
  job: Job<CompetitorAnalysisJobData, CompetitorAnalysisJobResult>,
): Promise<CompetitorAnalysisJobResult> {
  const { jobId, startupId, startupData } = job.data;

  console.log(
    `Processing competitor analysis job ${jobId} for startup ${startupId}`,
  );

  try {
    // Update job status to IN_PROGRESS
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        startedAt: new Date(),
        logs: "Starting competitor analysis...",
      },
    });

    // Perform the competitor analysis
    const analysisResult = await performCompetitorAnalysis(job.data);

    // Store the results in the database
    await storeCompetitorAnalysisResult(startupId, analysisResult);

    // Update job status to COMPLETED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        result: analysisResult as any,
        logs: "Competitor analysis completed successfully",
      },
    });

    console.log(`Competitor analysis job ${jobId} completed successfully`);
    return analysisResult;
  } catch (error) {
    console.error(`Competitor analysis job ${jobId} failed:`, error);

    // Update job status to FAILED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
        logs: `Competitor analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    });

    throw error;
  }
}

/**
 * Create the competitor analysis worker
 */
export function createCompetitorWorker() {
  const worker = getWorker(QUEUE_NAMES.COMPETITOR, processCompetitorJob, {
    concurrency: 2, // Process up to 2 competitor analysis jobs concurrently
  });

  worker.on("completed", (job) => {
    console.log(`Competitor analysis job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Competitor analysis job ${job?.id} failed:`, err);
  });

  worker.on("error", (err) => {
    console.error("Competitor analysis worker error:", err);
  });

  console.log("Competitor analysis worker is ready and listening for jobs");
  return worker;
}
