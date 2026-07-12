import { certificateWorker } from "./lib/workers/certificates";
import { emailWorker } from "./lib/workers/email";
import { gradingWorker } from "./lib/workers/grading";

console.log("🚀 Starting Background Workers...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await certificateWorker.close();
  await emailWorker.close();
  await gradingWorker.close();
  process.exit(0);
});
