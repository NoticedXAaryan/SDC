import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eventSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { markAttendance } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

const result = await markAttendance(sessionAuth, session.eventId, sessionId, passCode);
return NextResponse.json(result);

});
