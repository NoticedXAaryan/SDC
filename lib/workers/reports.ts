import { Worker, Job, Queue } from "bullmq";
import { logger } from "@/lib/logger";
import { getWorkerConfig } from "@/lib/redis";

export const reportsQueue = new Queue("reports-queue", getWorkerConfig());

export const reportsWorker = new Worker("reports-queue", async (job: Job) => {
  const { type, recipientEmail } = job.data;
  
  if (type === "weekly_report") {
    logger.info("Generating weekly engagement report...");

    // Report generation is not yet implemented.
    // When ready, this worker should:
    // 1. Fetch metrics from DB (member growth, event attendance, etc.)
    // 2. Generate a PDF or HTML email summary
    // 3. Send it via the email queue
    logger.warn("Weekly report generation is not yet implemented — skipping.");
  }
}, getWorkerConfig());

// NOTE: Auto-scheduling is disabled until report generation is implemented.
// To enable, uncomment the block below and replace the recipient email.
//
// reportsQueue.add("weekly_report", { 
//   type: "weekly_report", 
//   recipientEmail: "lead@example.com"
// }, {
//   repeat: { pattern: "0 8 * * 1" },
//   jobId: "weekly-report-job"
// }).catch(err => logger.error({ err }, "Failed to schedule weekly report cron"));
