import { certificateWorker } from "./lib/workers/certificates";
import { emailWorker } from "./lib/workers/email";

console.log("🚀 Starting Background Workers...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await certificateWorker.close();
  await emailWorker.close();
  process.exit(0);
});
