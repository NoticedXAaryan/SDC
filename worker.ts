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

logger.info("🚀 Starting Background Workers...");

// Graceful shutdown — handles both Docker SIGTERM and dev Ctrl+C (SIGINT)
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down workers...");
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
