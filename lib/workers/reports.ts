import { Worker, Job, Queue } from "bullmq";
import { logger } from "@/lib/logger";
import { emailQueue } from "@/lib/queues/email";
import { getRedisConfig } from "@/lib/redis";

const connection = getRedisConfig();

export const reportsQueue = new Queue("reports-queue", { connection });

export const reportsWorker = new Worker("reports-queue", async (job: Job) => {
  const { type, recipientEmail } = job.data;
  
  if (type === "weekly_report") {
    logger.info("Generating weekly engagement report...");

    // TODO: Real implementation should:
    // 1. Fetch metrics from DB (similar to /api/engagement)
    // 2. Generate a PDF using Pdfme or an HTML string
    // 3. Upload PDF to storage
    const mockReportUrl = "https://example.com/mock-weekly-report.pdf";

    if (recipientEmail) {
      await emailQueue.add("report_delivery", {
        type: "report_delivery",
        payload: {
          email: recipientEmail,
          subject: "Your Weekly SDC Report is Ready",
          reportUrl: mockReportUrl,
        }
      });
    }

    logger.info({ reportUrl: mockReportUrl }, "Weekly report generated successfully");
  }
}, { connection });

// Schedule the weekly cron job (runs every Monday at 8:00 AM)
reportsQueue.add("weekly_report", { 
  type: "weekly_report", 
  recipientEmail: "lead@club.local"
}, {
  repeat: {
    pattern: "0 8 * * 1",
  },
  jobId: "weekly-report-job"
}).catch(err => logger.error({ err }, "Failed to schedule weekly report cron"));
