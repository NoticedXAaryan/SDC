import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";

import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

export async function checkInScannerDb(session: AuthSession, eventId: string, token: string, scannedFaceDescriptor?: number[]) {
  const validator = new HMACPassValidator();
  const payload = await validator.validate(token);

  if (!payload.valid) {
    throw new ValidationError("Invalid or forged pass token");
  }

  if (payload.eventId !== eventId) {
    throw new ValidationError("Pass is for a different event");
  }

  if (!payload.userId || !payload.passCode) {
    throw new ValidationError("Invalid token payload");
  }

  const userRegs = await db.select().from(registrations).where(
    and(
      eq(registrations.eventId, eventId),
      eq(registrations.userId, payload.userId),
      eq(registrations.passCode, payload.passCode)
    )
  ).limit(1);

  const registration = userRegs[0];

  if (!registration) {
    throw new ValidationError("Registration not found");
  }

  if (registration.status === "waitlist") {
    throw new ValidationError("User is on the waitlist");
  }

  if (registration.status === "cancelled") {
    throw new ValidationError("Registration was cancelled");
  }

  if (registration.status === "checked_in") {
    throw new ValidationError("Already checked in");
  }

  if (scannedFaceDescriptor && Array.isArray(scannedFaceDescriptor)) {
    const [attendee] = await db.select({ faceDescriptor: user.faceDescriptor })
      .from(user).where(eq(user.id, payload.userId));
      
    if (!attendee?.faceDescriptor) {
      throw new ValidationError("User has no face enrolled. Please perform a manual check-in.");
    }
    
    const enrolledDescriptor = JSON.parse(attendee.faceDescriptor);
    if (!Array.isArray(enrolledDescriptor) || enrolledDescriptor.length !== 128) {
      throw new ValidationError("Invalid enrolled face data");
    }
    
    let distance = 0;
    for (let i = 0; i < 128; i++) {
      distance += Math.pow(enrolledDescriptor[i] - scannedFaceDescriptor[i], 2);
    }
    distance = Math.sqrt(distance);
    
    if (distance > 0.6) {
      throw new ValidationError("Face mismatch. Distance: " + distance.toFixed(2));
    }
  }

  await db.update(registrations).set({
    status: "checked_in",
    checkedInAt: new Date(),
    attendanceMethod: scannedFaceDescriptor ? "qr+face" : "qr"
  }).where(eq(registrations.id, registration.id));

  return { registrationId: registration.id, payload };
}

export async function batchCheckInScannerDb(session: AuthSession, checkIns: any[]) {
  if (!Array.isArray(checkIns)) {
    throw new ValidationError("Invalid payload");
  }

  const results = [];
  const validator = new HMACPassValidator();

  const validCheckIns = [];
  for (const checkIn of checkIns) {
    try {
      const payload = await validator.validate(checkIn.token);
      
      if (!payload.valid || payload.eventId !== checkIn.eventId) {
        results.push({ id: checkIn.id, success: false, error: "Invalid token" });
        continue;
      }

      if (!payload.userId || !payload.passCode) {
        results.push({ id: checkIn.id, success: false, error: "Invalid token payload" });
        continue;
      }
      
      validCheckIns.push({ ...checkIn, payload });
    } catch (e: any) {
      results.push({ id: checkIn.id, success: false, error: "Server error" });
    }
  }

  let checkedInCount = 0;
  const idsToUpdate = [];

  if (validCheckIns.length > 0) {
    const userIds = validCheckIns.map(c => c.payload.userId);
    const eventIds = [...new Set(validCheckIns.map(c => c.payload.eventId))];
    
    const userRegs = await db.select().from(registrations).where(
      and(
        inArray(registrations.eventId, eventIds),
        inArray(registrations.userId, userIds)
      )
    );

    const regMap = new Map();
    for (const r of userRegs) {
      regMap.set(`${r.eventId}-${r.userId}-${r.passCode}`, r);
    }

    for (const checkIn of validCheckIns) {
      const key = `${checkIn.eventId}-${checkIn.payload.userId}-${checkIn.payload.passCode}`;
      const reg = regMap.get(key);

      if (!reg) {
        results.push({ id: checkIn.id, success: false, error: "Registration not found" });
      } else if (reg.status !== "confirmed") {
        results.push({ id: checkIn.id, success: false, error: "Invalid status" });
      } else {
        idsToUpdate.push(reg.id);
        results.push({ id: checkIn.id, success: true });
        checkedInCount++;
      }
    }

    if (idsToUpdate.length > 0) {
      await db.update(registrations).set({
        status: "checked_in",
        checkedInAt: new Date()
      }).where(inArray(registrations.id, idsToUpdate));
    }
  }

  return { results, checkedInCount, idsToUpdateLength: idsToUpdate.length };
}
