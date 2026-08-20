import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/redis";

let _queue: Queue | null = null;

export function getCertificateQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("certificate-generation", {
      connection: getRedisClient() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
      },
    });
  }
  return _queue;
}

