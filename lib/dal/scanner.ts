import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";

import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

export async function checkInScannerDb(session: AuthSession, eventId: string, token: string) {
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
    return { registrationId: registration.id, payload, alreadyCheckedIn: true };
  }

  const [updated] = await db.update(registrations).set({
    status: "checked_in",
    checkedInAt: new Date(),
    attendanceMethod: "qr",
  }).where(and(
    eq(registrations.id, registration.id),
    eq(registrations.status, "confirmed"),
  )).returning({ id: registrations.id });

  if (!updated) {
    const [latest] = await db.select({ status: registrations.status })
      .from(registrations)
      .where(eq(registrations.id, registration.id))
      .limit(1);
    if (latest?.status === "checked_in") {
      return { registrationId: registration.id, payload, alreadyCheckedIn: true };
    }
    throw new ValidationError("Registration is no longer eligible for check-in");
  }

  return { registrationId: registration.id, payload, alreadyCheckedIn: false };
}

export async function batchCheckInScannerDb(session: AuthSession, checkIns: any[]) {
  if (!Array.isArray(checkIns)) {
    throw new ValidationError("Invalid payload");
  }

  const results = [];
  const validator = new HMACPassValidator();

  const validCheckIns = [];
  const seenTokens = new Set<string>();
  for (const checkIn of checkIns) {
    try {
      if (seenTokens.has(checkIn.token)) {
        results.push({ id: checkIn.id, success: false, error: "Duplicate check-in in batch" });
        continue;
      }
      seenTokens.add(checkIn.token);
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
  const idsToUpdate: string[] = [];

  if (validCheckIns.length > 0) {
    const userIds = [...new Set(validCheckIns.map(c => c.payload.userId))];
    const eventIds = [...new Set(validCheckIns.map(c => c.payload.eventId))];
    
    const userRegs = await db.select().from(registrations).where(
      and(
        inArray(registrations.eventId, eventIds),
        inArray(registrations.userId, userIds)
      )
    );

    const regMap = new Map<string, typeof userRegs[number]>();
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
        if (!idsToUpdate.includes(reg.id)) {
          idsToUpdate.push(reg.id);
          results.push({ id: checkIn.id, success: true });
          checkedInCount++;
        } else {
          results.push({ id: checkIn.id, success: false, error: "Duplicate registration in batch" });
        }
      }
    }

    if (idsToUpdate.length > 0) {
      const updated = await db.update(registrations).set({
        status: "checked_in",
        checkedInAt: new Date(),
        attendanceMethod: "qr",
      }).where(and(
        inArray(registrations.id, idsToUpdate),
        eq(registrations.status, "confirmed"),
      )).returning({ id: registrations.id });

      const updatedIds = new Set(updated.map((row) => row.id));
      checkedInCount = updated.length;
      for (const result of results) {
        if (result.success) {
          const candidate = validCheckIns.find((item) => item.id === result.id);
          const reg = candidate && regMap.get(`${candidate.eventId}-${candidate.payload.userId}-${candidate.payload.passCode}`);
          if (!reg || !updatedIds.has(reg.id)) {
            result.success = false;
            result.error = "Registration was already processed or became ineligible";
          }
        }
      }
    }
  }

  return { results, checkedInCount, idsToUpdateLength: idsToUpdate.length };
}
