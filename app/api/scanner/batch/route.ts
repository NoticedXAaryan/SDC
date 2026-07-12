import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userRole = session.user.role || "member";
    if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { checkIns } = body; // Array of { id, eventId, token }

    if (!Array.isArray(checkIns)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const results = [];
    const validator = new HMACPassValidator();

    for (const checkIn of checkIns) {
      try {
        const payload = await validator.validate(checkIn.token);
        
        if (!payload.valid || payload.eventId !== checkIn.eventId) {
          results.push({ id: checkIn.id, success: false, error: "Invalid token" });
          continue;
        }

        // 3. Find registration
        const userRegs = await db.select().from(registrations).where(
          and(
            eq(registrations.eventId, checkIn.eventId),
            eq(registrations.userId, payload.userId as string),
            eq(registrations.passCode, payload.passCode as string)
          )
        ).limit(1);

        const registration = userRegs[0];
        
        if (!registration || registration.status !== "confirmed") {
          results.push({ id: checkIn.id, success: false, error: "Invalid status" });
          continue;
        }

        // Check in
        await db.update(registrations).set({
          status: "checked_in",
          checkedInAt: new Date()
        }).where(eq(registrations.id, registration.id));

        results.push({ id: checkIn.id, success: true });
      } catch (err) {
        results.push({ id: checkIn.id, success: false, error: "Server error" });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
