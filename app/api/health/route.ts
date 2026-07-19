import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — Public health check endpoint.
 * Returns database and Redis connection status.
 * Intentionally unauthenticated — used by Docker healthchecks and monitoring.
 */
export async function GET() {
  let dbStatus = "unknown";
  let redisStatus = "unknown";
  
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = `fail: ${error.message}`;
  }

  try {
    const redis = getRedisClient();
    if ((redis as any).isMock) {
      redisStatus = "mock (build)";
    } else {
      await redis.ping();
      redisStatus = "connected";
    }
  } catch (error: any) {
    redisStatus = `degraded: ${error.message}`;
  }

  // Next.js can still serve web pages (dashboard, etc.) even if background queues (Redis) are down.
  // We only return 503 if the DB is completely down.
  const isHealthy = dbStatus === "connected";

  return NextResponse.json({
    status: isHealthy ? "ok" : "degraded",
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, { 
    status: isHealthy ? 200 : 503 
  });
}
