import { Job } from "bullmq";
import { JobStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { RedLensJobData, RedLensJobResult } from "../types";
import { performRedLensAssessment } from "../services/redlens-analyzer";
import { storeRedLensAssessment } from "../services/redlens-storage";

/**
 * Process a RedLens risk assessment job
 */
async function processRedLensJob(
  job: Job<RedLensJobData>,
): Promise<RedLensJobResult> {
  const { jobId, startupId, analysisData } = job.data;

  console.log(`Starting RedLens assessment for startup ${startupId}`);

  try {
    // Update job status to IN_PROGRESS
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    // Perform the RedLens risk assessment
    const assessmentResult = await performRedLensAssessment(analysisData);

    // Create the job result
    const result: RedLensJobResult = {
      overallScore: assessmentResult.overallScore,
      summary: assessmentResult.summary,
      recommendation: assessmentResult.recommendation,
      confidenceScore: assessmentResult.confidenceScore,
      moduleAssessments: assessmentResult.moduleAssessments,
      completedAt: new Date().toISOString(),
    };

    // Store the assessment results in the database
    await storeRedLensAssessment(startupId, result);

    // Update job status to COMPLETED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        result: result as any,
        completedAt: new Date(),
      },
    });

    console.log(
      `RedLens assessment completed for startup ${startupId}. Overall score: ${assessmentResult.overallScore.toFixed(2)}`,
    );

    return result;
  } catch (error) {
    const errorMessage = `RedLens assessment failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Error in RedLens job ${jobId}:`, error);

    // Update job status to FAILED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        logs: errorMessage,
        completedAt: new Date(),
      },
    });

    throw new Error(errorMessage);
  }
}

/**
 * Create and configure the RedLens worker
 */
export function createRedLensWorker() {
  const { getWorker, QUEUE_NAMES } = require("../config");

  const worker = getWorker(
    QUEUE_NAMES.REDLENS,
    async (job: Job<RedLensJobData>) => {
      console.log(
        `Processing RedLens job ${job.id} for startup ${job.data.startupId}`,
      );
      return await processRedLensJob(job);
    },
    { concurrency: 2 }, // Lower concurrency for AI-intensive tasks
  );

  // Add event listeners for monitoring
  worker.on("completed", (job: Job<RedLensJobData>) => {
    console.log(`RedLens job ${job.id} completed successfully`);
  });

  worker.on("failed", (job: Job<RedLensJobData> | undefined, err: Error) => {
    console.error(`RedLens job ${job?.id || "unknown"} failed:`, err.message);
  });

  worker.on("error", (err: Error) => {
    console.error("RedLens worker error:", err);
  });

  console.log("RedLens worker started and listening for jobs...");
  return worker;
}

// Export the processor function for direct use
export { processRedLensJob };
