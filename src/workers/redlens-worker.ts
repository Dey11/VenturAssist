#!/usr/bin/env node

import dotenv from "dotenv";
import { createRedLensWorker } from "@/server/bullmq/workers/redlens-worker";

// Load environment variables
dotenv.config();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down RedLens worker gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down RedLens worker gracefully...");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the worker
console.log("Starting RedLens risk assessment worker...");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Redis URL:", process.env.REDIS_URL || "redis://localhost:6379");

try {
  const worker = createRedLensWorker();
  console.log("RedLens worker is running and ready to process jobs");
} catch (error) {
  console.error("Failed to start RedLens worker:", error);
  process.exit(1);
}
