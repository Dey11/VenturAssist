import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const QUEUE_NAMES = {
  INGESTION: "ingestion-queue",
  // Future queues can be added here
  // COMPETITOR_SCRAPING: 'competitor-scraping-queue',
  // BENCHMARKING: 'benchmarking-queue',
} as const;

// Global queue instances (singletons)
declare global {
  var __bullmq_queues__: Record<string, Queue> | undefined;
  var __bullmq_workers__: Record<string, Worker> | undefined;
  var __bullmq_events__: Record<string, QueueEvents> | undefined;
}

// Helper to get or create a queue
export function getQueue(queueName: string): Queue {
  if (!global.__bullmq_queues__) {
    global.__bullmq_queues__ = {};
  }

  if (!global.__bullmq_queues__[queueName]) {
    global.__bullmq_queues__[queueName] = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });
  }

  return global.__bullmq_queues__[queueName];
}

// Helper to get or create a worker
export function getWorker(
  queueName: string,
  processor: (job: any) => Promise<any>,
  options?: { concurrency?: number },
): Worker {
  if (!global.__bullmq_workers__) {
    global.__bullmq_workers__ = {};
  }

  if (!global.__bullmq_workers__[queueName]) {
    global.__bullmq_workers__[queueName] = new Worker(queueName, processor, {
      connection,
      concurrency: options?.concurrency || 3,
    });
  }

  return global.__bullmq_workers__[queueName];
}

// Helper to get or create queue events
export function getQueueEvents(queueName: string): QueueEvents {
  if (!global.__bullmq_events__) {
    global.__bullmq_events__ = {};
  }

  if (!global.__bullmq_events__[queueName]) {
    global.__bullmq_events__[queueName] = new QueueEvents(queueName, {
      connection,
    });
  }

  return global.__bullmq_events__[queueName];
}

export async function closeAllConnections(): Promise<void> {
  const queues = global.__bullmq_queues__;
  const workers = global.__bullmq_workers__;
  const events = global.__bullmq_events__;

  if (queues) {
    await Promise.all(Object.values(queues).map((queue) => queue.close()));
  }

  if (workers) {
    await Promise.all(Object.values(workers).map((worker) => worker.close()));
  }

  if (events) {
    await Promise.all(Object.values(events).map((event) => event.close()));
  }

  await connection.quit();
}

export { connection };
