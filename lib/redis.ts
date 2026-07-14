import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Shared Redis connection configuration.
 * Single source of truth for all Redis consumers (queues, workers, rate limiter).
 * 
 * Uses REDIS_URL if available (docker-compose sets this), falls back to host/port.
 */
export function getRedisConfig(): { host: string; port: number } | { url: string } {
  if (env.REDIS_URL) {
    return { url: env.REDIS_URL };
  }
  return {
    host: env.REDIS_HOST || "localhost",
    port: parseInt(env.REDIS_PORT || "6379"),
  };
}

/**
 * Create a shared Redis client for direct use (rate limiting, health checks).
 * Callers should NOT create new Redis instances — reuse this.
 */
let _sharedClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (_sharedClient) return _sharedClient;

  const config = getRedisConfig();
  _sharedClient = "url" in config
    ? new Redis(config.url, { enableOfflineQueue: false, lazyConnect: true, maxRetriesPerRequest: null })
    : new Redis({ ...config, enableOfflineQueue: false, lazyConnect: true, maxRetriesPerRequest: null });

  _sharedClient.on("error", (err) => {
    // Suppress connection errors during build/startup — they'll be caught by health checks
  });

  return _sharedClient;
}
