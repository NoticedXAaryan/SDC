import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
    console.error("Health check DB error:", error);
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  }, { 
    status: dbStatus === "connected" ? 200 : 503 
  });
}
