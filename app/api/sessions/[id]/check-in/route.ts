import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { eventSessions, registrations, sessionAttendance } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only leads and admins can perform check-ins
    await requireRole(["co_lead", "lead", "volunteer_lead", "admin", "owner"]);
    
    const { id: sessionId } = await params;
    const reqBody = await req.json().catch(() => ({}));
    const passCode = reqBody.passCode;

    if (!passCode) {
      return NextResponse.json({ error: "passCode is required" }, { status: 400 });
    }

    // Find the session and its parent event
    const session = await db.query.eventSessions.findFirst({
      where: eq(eventSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the registration using the passCode and eventId
    const registration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.passCode, passCode),
        eq(registrations.eventId, session.eventId)
      )
    });

    if (!registration) {
      return NextResponse.json({ error: "Invalid QR code for this event" }, { status: 400 });
    }

    // Check if they are already checked into this session
    const existingCheckIn = await db.query.sessionAttendance.findFirst({
      where: and(
        eq(sessionAttendance.sessionId, sessionId),
        eq(sessionAttendance.userId, registration.userId)
      )
    });

    if (existingCheckIn) {
      return NextResponse.json({ error: "User already checked into this session" }, { status: 400 });
    }

    // Insert session attendance
    await db.insert(sessionAttendance).values({
      sessionId,
      userId: registration.userId,
      checkedInAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Successfully checked into session" });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Session Check-in POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
