import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eventSessions, sessionAttendance, registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionAuth = await requireRole(["admin", "owner", "lead", "event_lead", "co_lead", "faculty_coordinator"]);
    await checkEmergencyFreeze(sessionAuth.user.role as string);

    const { passCode } = await req.json();
    const { id: sessionId } = await params;
    
    if (!passCode) {
      return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
    }

    // 1. Get session details to find eventId
    const [session] = await db.select().from(eventSessions).where(eq(eventSessions.id, sessionId)).limit(1);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2. Find registration for this event by passCode
    const [reg] = await db.select().from(registrations).where(
      and(
        eq(registrations.eventId, session.eventId),
        eq(registrations.passCode, passCode)
      )
    ).limit(1);

    if (!reg) {
      return NextResponse.json({ error: "Invalid QR code or no registration found for this event" }, { status: 400 });
    }

    // 3. Record attendance (upsert on conflict to prevent duplicates)
    try {
      await db.insert(sessionAttendance).values({
        sessionId: session.id,
        userId: reg.userId,
        checkedInAt: new Date()
      });
    } catch (e: any) {
      // Postgres unique constraint violation error code is 23505
      if (e.code === '23505') {
        return NextResponse.json({ success: true, message: "Already checked in for this session", alreadyCheckedIn: true });
      }
      throw e; // rethrow if it's something else
    }

    // Also update main registration to checked_in if not already
    if (reg.status === 'confirmed') {
      await db.update(registrations)
        .set({ status: 'checked_in', checkedInAt: new Date() })
        .where(eq(registrations.id, reg.id));
    }

    return NextResponse.json({ success: true, message: "Session check-in successful" });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Session Scan POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
