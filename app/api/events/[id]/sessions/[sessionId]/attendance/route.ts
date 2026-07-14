import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionAttendance, registrations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";

const attendanceSchema = z.object({
  passCode: z.string(),
});

export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) => {
    const resolvedParams = await params;
    await requireAdmin();
    const body = await req.json();
    const { passCode } = attendanceSchema.parse(body);

    // Find registration
    const [registration] = await db.select()
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, resolvedParams.id),
          eq(registrations.passCode, passCode),
          eq(registrations.status, "confirmed")
        )
      );

    if (!registration) {
      return NextResponse.json({ error: "Invalid or inactive pass code" }, { status: 404 });
    }

    // Check if already attended
    const [existing] = await db.select().from(sessionAttendance).where(
      and(
        eq(sessionAttendance.sessionId, resolvedParams.sessionId),
        eq(sessionAttendance.userId, registration.userId!)
      )
    );

    if (existing) {
      return NextResponse.json({ error: "Already checked in" }, { status: 400 });
    }

    // Mark attendance
    await db.insert(sessionAttendance).values({
      id: crypto.randomUUID(),
      sessionId: resolvedParams.sessionId,
      userId: registration.userId!,
      checkedInAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Checked in successfully" });
});
