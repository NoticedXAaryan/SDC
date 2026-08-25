import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/ready - Readiness probe.
 * Only returns 200 OK if the application is fully ready to serve traffic.
 * Checks actual connectivity to critical dependencies (DB, Redis).
 */
export async function GET() {
  let databaseReady = false;
  let redisReady = false;
  
  try {
    await db.execute(sql`SELECT 1`);
    databaseReady = true;
  } catch (error: unknown) {
    console.error("Readiness database check failed", error);
  }

  try {
    const redis = getRedisClient();
    if ("isMock" in redis && redis.isMock) {
      redisReady = process.env.SKIP_REDIS === "1";
    } else {
      await redis.ping();
      redisReady = true;
    }
  } catch (error: unknown) {
    console.error("Readiness Redis check failed", error);
  }

  const authReady = Boolean(
    process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL,
  );
  
  const isReady = databaseReady && redisReady && authReady;

  return NextResponse.json({
    status: isReady ? "ready" : "not_ready",
    checks: {
      database: databaseReady ? "ready" : "unavailable",
      auth: authReady ? "ready" : "unavailable",
      redis: redisReady ? "ready" : "unavailable",
    },
    timestamp: new Date().toISOString()
  }, {
    status: isReady ? 200 : 503
  });
}
