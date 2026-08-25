import Redis from "ioredis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let _sharedClient: any = null;
let _connectionFailed = false;

/**
 * No-op mock Redis client for environments where Redis is unavailable.
 * All operations resolve immediately with safe defaults so the app
 * never blocks on a missing Redis instance.
 */
function createMockClient() {
  return {
    ping: async () => 'PONG',
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 0,
    on: () => {},
    once: () => {},
    quit: async () => {},
    disconnect: () => {},
    status: 'close',
    isMock: true,
  };
}

export function getRedisClient(): Redis {
  // Don't connect during Next.js build or when explicitly skipped
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.SKIP_REDIS === '1'
  ) {
    if (!_sharedClient) {
      _sharedClient = createMockClient();
    }
    return _sharedClient as any;
  }

  // Development stays usable without Redis. Production must remain unhealthy
  // instead of silently disabling queues, rate limits, and idempotency.
  if (_connectionFailed) {
    if (process.env.NODE_ENV === "production") {
      if (_sharedClient && !_sharedClient.isMock) return _sharedClient;
      _connectionFailed = false;
    } else {
      if (!_sharedClient || !_sharedClient.isMock) {
        _sharedClient = createMockClient();
      }
      return _sharedClient as any;
    }
  }

  if (_sharedClient) return _sharedClient;

  const url = env.REDIS_URL || `redis://${env.REDIS_HOST || "localhost"}:${env.REDIS_PORT || "6379"}`;

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: null, // REQUIRED for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000, // Fail fast: 3s max to establish connection
      retryStrategy: (times) => {
        // In development, give up immediately so pages don't hang
        if (process.env.NODE_ENV !== 'production' && times >= 1) {
          logger.warn("Redis unavailable in dev — falling back to mock client");
          _connectionFailed = true;
          return null;
        }
        if (times > 5) {
          logger.error("Redis retry exhausted, giving up");
          _connectionFailed = true;
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err) => {
        logger.error({ err }, "Redis reconnect error");
        return true;
      },
    });

    client.on("connect", () => {
      _connectionFailed = false;
      logger.info("Redis connected");
    });
    client.on("error", (e: Error) => {
      // Log but don't crash
      logger.warn({ err: e.message }, "Redis connection error (suppressed)");
    });

    _sharedClient = client;
    return _sharedClient;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error({ error }, "Redis client creation failed");
      throw error;
    }
    logger.warn("Redis client creation failed — using development mock");
    _connectionFailed = true;
    _sharedClient = createMockClient();
    return _sharedClient as any;
  }
}

export const getWorkerConfig = () => ({
  connection: getRedisClient() as any,
  concurrency: 5,
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400, count: 1000 },
});
