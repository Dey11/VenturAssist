import { Job } from "bullmq";
import { getQueue, QUEUE_NAMES } from "../config";
import { RedLensJobData, RedLensJobResult, QueueJobOptions } from "../types";

/**
 * Get the RedLens risk assessment queue instance
 */
export function getRedLensQueue() {
  return getQueue(QUEUE_NAMES.REDLENS);
}

/**
 * Add a RedLens risk assessment job to the queue
 */
export async function addRedLensJob(
  jobData: RedLensJobData,
  options?: QueueJobOptions,
): Promise<Job<RedLensJobData, RedLensJobResult>> {
  const queue = getRedLensQueue();

  const job = await queue.add("redlens-assessment", jobData, {
    delay: options?.delay || 0,
    priority: options?.priority || 0,
    attempts: options?.attempts || 3,
    backoff: options?.backoff || {
      type: "exponential",
      delay: 2000,
    },
  });

  console.log(
    `RedLens job ${job.id} added to queue for startup ${jobData.startupId}`,
  );
  return job;
}

/**
 * Get the status of a RedLens job
 */
export async function getRedLensJobStatus(jobId: string) {
  const queue = getRedLensQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

/**
 * Remove a RedLens job from the queue
 */
export async function removeRedLensJob(jobId: string): Promise<boolean> {
  const queue = getRedLensQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return false;
  }

  await job.remove();
  console.log(`RedLens job ${jobId} removed from queue`);
  return true;
}

/**
 * Get RedLens queue statistics
 */
export async function getRedLensQueueStats() {
  const queue = getRedLensQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}
