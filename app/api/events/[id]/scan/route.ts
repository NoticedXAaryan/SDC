import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
const session = await requireRole(["admin", "owner", "lead", "event_lead", "co_lead", "faculty_coordinator"]);
const { passCode } = await req.json();
const { id: eventId } = await params;

if (!passCode) {
  return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
}

const res = await db.update(registrations)
  .set({ status: 'checked_in', checkedInAt: new Date() })
  .where(
    and(
      eq(registrations.eventId, eventId), 
      eq(registrations.passCode, passCode), 
      eq(registrations.status, 'confirmed')
    )
  )
  .returning();
  
if (res.length === 0) {
  // Check if they are already checked in
  const existing = await db.select().from(registrations).where(
    and(
      eq(registrations.eventId, eventId),
      eq(registrations.passCode, passCode)
    )
  ).limit(1);

  if (existing.length > 0 && existing[0].status === 'checked_in') {
    return NextResponse.json({ success: true, message: "Already checked in", alreadyCheckedIn: true });
  }

  return NextResponse.json({ error: "Invalid QR code or registration not confirmed" }, { status: 400 });
}

return NextResponse.json({ success: true, message: "Check-in successful" });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Scan POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
