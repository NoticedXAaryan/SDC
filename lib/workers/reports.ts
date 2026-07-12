import { Worker, Job, Queue } from "bullmq";
import { logger } from "@/lib/logger";
import { emailQueue } from "@/lib/queues/email";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const reportsQueue = new Queue("reports-queue", { connection });

export const reportsWorker = new Worker("reports-queue", async (job: Job) => {
  const { type, recipientEmail } = job.data;
  
  if (type === "weekly_report") {
    logger.info("Generating weekly engagement report...");

    // In a real implementation:
    // 1. Fetch metrics from DB (similar to /api/engagement)
    // 2. Generate a PDF using Pdfme or an HTML string
    // 3. Upload PDF to S3/local storage

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
  recipientEmail: "lead@club.local" // Send to main lead by default
}, {
  repeat: {
    pattern: "0 8 * * 1", // Monday 8am
  },
  jobId: "weekly-report-job"
}).catch(err => logger.error({ err }, "Failed to schedule weekly report cron"));
