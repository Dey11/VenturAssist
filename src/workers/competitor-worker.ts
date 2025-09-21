import "dotenv/config";
import { createCompetitorWorker } from "@/server/bullmq/workers/competitor-worker";

// Create the competitor analysis worker
const worker = createCompetitorWorker();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log(
    "Received SIGINT, shutting down competitor analysis worker gracefully...",
  );
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(
    "Received SIGTERM, shutting down competitor analysis worker gracefully...",
  );
  await worker.close();
  process.exit(0);
});

// Keep the process alive
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception in competitor analysis worker:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection in competitor analysis worker:", reason);
  process.exit(1);
});
