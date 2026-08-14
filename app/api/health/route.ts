import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — Public liveness endpoint.
 * Returns 200 immediately if the app is able to receive requests.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "dev"
  }, { 
    status: 200 
  });
}

