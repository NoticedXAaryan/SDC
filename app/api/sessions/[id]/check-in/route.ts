import { NextRequest, NextResponse } from "next/server";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { eventSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { markAttendance } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    
    
// Only leads and admins can perform check-ins
const authSession = await requireRole(["co_lead", "lead", "volunteer_lead", "admin", "owner"]);
await checkEmergencyFreeze(authSession.user.role as string);

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

const result = await markAttendance(authSession, session.eventId, sessionId, passCode);
return NextResponse.json(result);

});
