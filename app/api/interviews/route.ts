import { requireLead } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { interviews, applications } from "@/lib/db/schema";
import { NextResponse, NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";

const scheduleSchema = z.object({
  applicantId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  meetingLink: z.string().url().optional().or(z.literal("")),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireRole(["admin", "lead", "co_lead"]);
  
  const body = await req.json();
  const parsed = scheduleSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
  }

    const { applicantId, scheduledAt, meetingLink } = parsed.data;

    // Verify applicant exists and is in interviewing status
    const [app] = await db.select().from(applications).where(eq(applications.id, applicantId)).limit(1);
    
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (app.status !== "interviewing") {
      return NextResponse.json({ error: "Applicant is not in interviewing stage" }, { status: 400 });
    }

    const [interview] = await db.insert(interviews).values({
      applicantId,
      interviewerId: session.user.id,
      scheduledAt: new Date(scheduledAt),
      meetingLink: meetingLink || undefined,
    }).returning();

  return NextResponse.json({ success: true, application: interview });
});
