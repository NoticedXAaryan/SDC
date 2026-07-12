import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { clubSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin", "owner", "faculty_coordinator"]);
    
    const [settings] = await db.select().from(clubSettings).where(eq(clubSettings.id, "default")).limit(1);
    
    return NextResponse.json({ isFrozen: settings?.isFrozen || false });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Faculty Settings GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
