import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: Request) => {
const session = await requireRole(["owner", "admin", "lead", "co_lead", "volunteer_lead"]);

const body = await req.json();
const { checkIns } = body; // Array of { id, eventId, token }

if (!Array.isArray(checkIns)) {
  return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
}

const results = [];
const validator = new HMACPassValidator();

// 1. Validate all tokens
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

if (validCheckIns.length > 0) {
  // 2. Fetch potential registrations in bulk
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

  const idsToUpdate = [];
  for (const checkIn of validCheckIns) {
    const key = `${checkIn.eventId}-${checkIn.payload.userId}-${checkIn.payload.passCode}`;
    const reg = regMap.get(key);

    if (!reg || reg.status !== "confirmed") {
      results.push({ id: checkIn.id, success: false, error: "Invalid status" });
    } else {
      idsToUpdate.push(reg.id);
      results.push({ id: checkIn.id, success: true });
    }
  }

  // 3. Batch Update
  if (idsToUpdate.length > 0) {
    await db.update(registrations).set({
      status: "checked_in",
      checkedInAt: new Date()
    }).where(inArray(registrations.id, idsToUpdate));
  }
}

return NextResponse.json({ success: true, results });

});
