import Redis from "ioredis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let _sharedClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (_sharedClient) return _sharedClient;

  const url = env.REDIS_URL || `redis://${env.REDIS_HOST || "localhost"}:${env.REDIS_PORT || "6379"}`;
  
  _sharedClient = new Redis(url, {
    maxRetriesPerRequest: null, // REQUIRED for BullMQ
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect on creation, connect on first command
    retryStrategy: (times) => {
      if (times > 5) {
        logger.error("Redis retry exhausted, giving up");
        return null; // stop retrying, don't crash app
      }
      return Math.min(times * 200, 2000);
    },
    reconnectOnError: (err) => {
      logger.error({ err }, "Redis reconnect error");
      return true;
    }
  });

  _sharedClient.on("connect", () => logger.info("Redis connected"));
  _sharedClient.on("error", (e) => {
    // Log but don't crash
    logger.warn({ err: e.message }, "Redis connection error (suppressed to prevent crash)");
  });

  return _sharedClient;
}

export const getWorkerConfig = () => ({
  connection: getRedisClient(),
  concurrency: 5,
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400, count: 1000 },
});

