import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { env } from "@/lib/env";
import Redis from "ioredis";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  let redisStatus = "unknown";
  
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
    console.error("Health check DB error:", error);
  }

  try {
    const redis = env.REDIS_URL 
      ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 0, connectTimeout: 1000 })
      : new Redis({ host: env.REDIS_HOST, port: parseInt(env.REDIS_PORT), maxRetriesPerRequest: 0, connectTimeout: 1000 });
    
    await redis.ping();
    redisStatus = "connected";
    redis.disconnect();
  } catch (error) {
    redisStatus = "disconnected";
    console.error("Health check Redis error:", error);
  }

  const isHealthy = dbStatus === "connected" && redisStatus === "connected";

  return NextResponse.json({
    status: isHealthy ? "ok" : "degraded",
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  }, { 
    status: isHealthy ? 200 : 503 
  });
}
