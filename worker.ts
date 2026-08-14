import "./lib/env";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

import { certificateWorker } from "./lib/workers/certificates";
import { emailWorker } from "./lib/workers/email";
import { gradingWorker } from "./lib/workers/grading";
import { aiWorker } from "./lib/workers/ai";
import { remindersWorker } from "./lib/workers/reminders";
import { reportsWorker } from "./lib/workers/reports";
import { socialWorker } from "./lib/workers/social";

import { logger } from "./lib/logger";

import { createServer } from "http";

logger.info("🚀 Starting Background Workers...");

// Create a simple HTTP server for worker health checks
const healthServer = createServer(async (req, res) => {
  if (req.url === "/health" || req.url === "/") {
    try {
      // Gather health data across queues
      const queues = [
        certificateWorker, emailWorker, gradingWorker, aiWorker, 
        remindersWorker, reportsWorker, socialWorker
      ];
      
      const metrics = await Promise.all(queues.map(async (worker) => {
        // BullMQ worker doesn't directly expose getJobCounts cleanly in all versions, 
        // but we can just report the worker status
        return {
          name: worker.name,
          isRunning: worker.isRunning(),
          isPaused: worker.isPaused,
        };
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        uptime: process.uptime(),
        workers: metrics
      }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", error: err.message }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.WORKER_PORT || 8080;
healthServer.listen(PORT, () => {
  logger.info(`Worker health server listening on port ${PORT}`);
});

// Graceful shutdown — handles both Docker SIGTERM and dev Ctrl+C (SIGINT)
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down workers...");
  healthServer.close();
  await Promise.allSettled([
    certificateWorker.close(),
    emailWorker.close(),
    gradingWorker.close(),
    aiWorker.close(),
    remindersWorker.close(),
    reportsWorker.close(),
    socialWorker.close(),
  ]);
  logger.info("All workers shut down cleanly.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
