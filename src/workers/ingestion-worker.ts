#!/usr/bin/env node

// Entry point for the ingestion worker
// This file should be run as a separate process to handle background jobs

import "dotenv/config";
import { createIngestionWorker } from "../server/bullmq/workers/ingestion-worker";

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
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
console.log("Starting ingestion worker...");
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  REDIS_URL: process.env.REDIS_URL ? "Set" : "Not set",
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY ? "Set" : "Not set",
  DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not set",
});

try {
  const worker = createIngestionWorker();
  console.log("Ingestion worker started successfully");
} catch (error) {
  console.error("Failed to start ingestion worker:", error);
  process.exit(1);
}
