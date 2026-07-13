import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, user, registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
const { id: eventId } = await params;
const body = await req.json().catch(() => ({}));
const { name, email } = body;

if (!name || !email) {
  return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
}

const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

if (event.visibility === "private") {
  return NextResponse.json({ error: "Cannot register for a private event" }, { status: 403 });
}

// Find or create guest user
let guestUser = await db.query.user.findFirst({
  where: eq(user.email, email),
});

if (!guestUser) {
  const userId = crypto.randomUUID();
  const [newUser] = await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: false,
    role: "outsider",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  guestUser = newUser;
}

// Check if already registered
const existingReg = await db.query.registrations.findFirst({
  where: and(
    eq(registrations.eventId, eventId),
    eq(registrations.userId, guestUser.id)
  )
});

if (existingReg) {
  return NextResponse.json({ error: "Already registered for this event" }, { status: 400 });
}

// Generate passcode
const passCode = crypto.randomBytes(4).toString("hex").toUpperCase();
const regId = crypto.randomUUID();

await db.insert(registrations).values({
  id: regId,
  eventId,
  userId: guestUser.id,
  status: "confirmed",
  passCode,
});

return NextResponse.json({ success: true, passCode, regId }, { status: 201 });
} catch (error: any) {
console.error("[Event Guest Register POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
