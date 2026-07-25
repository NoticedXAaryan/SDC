import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAdmin();

  const { id: eventId } = await params;
  
  await db.update(events)
    .set({ status: "published" })
    .where(eq(events.id, eventId));

  return NextResponse.json({ success: true });
});
