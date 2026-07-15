import { withApiHandler } from "@/lib/api-wrapper";
import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { clubSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
    await requireRole(["admin", "owner", "faculty_coordinator"]);
    
    const [settings] = await db.select().from(clubSettings).where(eq(clubSettings.id, "default")).limit(1);
    
    return NextResponse.json({ isFrozen: settings?.isFrozen || false });
  });
