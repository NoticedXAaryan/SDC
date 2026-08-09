import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: Request) => {
// Authenticate the scanner (must be at least a lead)
const session = await requireRole(["owner", "admin", "lead", "co_lead", "volunteer_lead"]);

const body = await req.json();
const { token, eventId, scannedFaceDescriptor } = body;

if (!token || !eventId) {
  return NextResponse.json({ success: false, error: "Missing token or eventId" }, { status: 400 });
}

// 1. Verify token cryptographically
const validator = new HMACPassValidator();
const payload = await validator.validate(token);

if (!payload.valid) {
  return NextResponse.json({ success: false, error: "Invalid or forged pass token" }, { status: 400 });
}

// 1b. Removed iat check as QR codes are currently static and do not rotate.

// 2. Ensure the token is for the correct event
if (payload.eventId !== eventId) {
  return NextResponse.json({ success: false, error: "Pass is for a different event" }, { status: 400 });
}

if (!payload.userId || !payload.passCode) {
  return NextResponse.json({ success: false, error: "Invalid token payload" }, { status: 400 });
}

// 3. Find the registration
const userRegs = await db.select().from(registrations).where(
  and(
    eq(registrations.eventId, eventId),
    eq(registrations.userId, payload.userId),
    eq(registrations.passCode, payload.passCode)
  )
).limit(1);

const registration = userRegs[0];

if (!registration) {
  return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
}

// 4. Check status
if (registration.status === "waitlist") {
  return NextResponse.json({ success: false, error: "User is on the waitlist" }, { status: 400 });
}

if (registration.status === "cancelled") {
  return NextResponse.json({ success: false, error: "Registration was cancelled" }, { status: 400 });
}

if (registration.status === "checked_in") {
  return NextResponse.json({ success: false, error: "Already checked in" }, { status: 400 });
}

// 4.5. Verify Face Descriptor if provided
if (scannedFaceDescriptor && Array.isArray(scannedFaceDescriptor)) {
  const [attendee] = await db.select({ faceDescriptor: user.faceDescriptor })
    .from(user).where(eq(user.id, payload.userId));
    
  if (!attendee?.faceDescriptor) {
    return NextResponse.json({ success: false, error: "User has no face enrolled. Please perform a manual check-in." }, { status: 400 });
  }
  
  const enrolledDescriptor = JSON.parse(attendee.faceDescriptor);
  if (!Array.isArray(enrolledDescriptor) || enrolledDescriptor.length !== 128) {
    return NextResponse.json({ success: false, error: "Invalid enrolled face data" }, { status: 500 });
  }
  
  // Calculate Euclidean distance
  let distance = 0;
  for (let i = 0; i < 128; i++) {
    distance += Math.pow(enrolledDescriptor[i] - scannedFaceDescriptor[i], 2);
  }
  distance = Math.sqrt(distance);
  
  // face-api.js default threshold is 0.6
  if (distance > 0.6) {
    return NextResponse.json({ success: false, error: "Face mismatch. Distance: " + distance.toFixed(2) }, { status: 400 });
  }
}

// 5. Check in the user
await db.update(registrations).set({
  status: "checked_in",
  checkedInAt: new Date(),
  attendanceMethod: scannedFaceDescriptor ? "qr+face" : "qr"
}).where(eq(registrations.id, registration.id));

return NextResponse.json({ 
  success: true, 
  message: "Successfully checked in!"
});

});
