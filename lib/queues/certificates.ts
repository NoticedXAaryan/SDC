import { Queue } from "bullmq";
import { env } from "@/lib/env";

const connection = env.REDIS_URL 
  ? { url: env.REDIS_URL }
  : { host: env.REDIS_HOST, port: parseInt(env.REDIS_PORT) };

export const certificateQueue = new Queue("certificate-generation", { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  }
});
