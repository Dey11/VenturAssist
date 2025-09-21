import { getQueue, QUEUE_NAMES } from "../config";
import { IngestionJobData, QueueJobOptions } from "../types";

export function getIngestionQueue() {
  return getQueue(QUEUE_NAMES.INGESTION);
}

export async function addIngestionJob(
  jobData: IngestionJobData,
  options?: QueueJobOptions,
) {
  const queue = getIngestionQueue();

  const job = await queue.add("process-ingestion", jobData, {
    priority: options?.priority || 0,
    delay: options?.delay || 0,
    attempts: options?.attempts || 3,
    backoff: options?.backoff || {
      type: "exponential",
      delay: 2000,
    },
    jobId: jobData.jobId, // Use the database job ID as the queue job ID
  });

  return job;
}

export async function getIngestionJobStatus(jobId: string) {
  const queue = getIngestionQueue();
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
    timestamp: job.timestamp,
    attemptsMade: job.attemptsMade,
    opts: job.opts,
  };
}

export async function removeIngestionJob(jobId: string) {
  const queue = getIngestionQueue();
  const job = await queue.getJob(jobId);

  if (job) {
    await job.remove();
    return true;
  }

  return false;
}

export async function getIngestionQueueStats() {
  const queue = getIngestionQueue();

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
