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

import { logger } from "./lib/logger";

logger.info("🚀 Starting Background Workers...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down workers...");
  await certificateWorker.close();
  await emailWorker.close();
  await gradingWorker.close();
  await aiWorker.close();
  process.exit(0);
});
