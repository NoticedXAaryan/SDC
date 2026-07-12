import { Queue } from "bullmq";
import { env } from "@/lib/env";

const connection = env.REDIS_URL 
  ? { url: env.REDIS_URL }
  : { host: env.REDIS_HOST, port: parseInt(env.REDIS_PORT) };

export const aiQueue = new Queue("ai-queue", { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
  }
});
