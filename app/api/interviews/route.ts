import { NextResponse, NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-wrapper";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { RECRUITMENT_REVIEWER_ROLES, scheduleInterview } from "@/lib/services/applications";

const scheduleSchema = z.object({
  applicantId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  meetingLink: z.string().url().optional().or(z.literal("")),
});

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
  const session = await requireRole(RECRUITMENT_REVIEWER_ROLES);
  
  const body = await req.json();
  const parsed = scheduleSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
  }

  const { applicantId, scheduledAt, meetingLink } = parsed.data;
  const result = await scheduleInterview(session, {
    applicationId: applicantId,
    interviewerId: session.user.id,
    scheduledAt,
    meetingLink: meetingLink || null,
  });

  return NextResponse.json(result);
});
