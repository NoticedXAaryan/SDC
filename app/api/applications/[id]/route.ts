import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireLead } from "@/lib/dal/auth";
import { emailQueue } from "@/lib/queues/email";

import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { NotificationService } from "@/lib/services/notifications";

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireLead();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const { id } = await params;
const { status } = await req.json();

if (!status) {
  return NextResponse.json({ error: "Status is required" }, { status: 400 });
}

const [updatedApp] = await db
  .update(applications)
  .set({ status, updatedAt: new Date() })
  .where(eq(applications.id, id))
  .returning();

// If moving to interviewing, send an email invite automatically
if (status === "interviewing") {
  const [applicant] = await db.select({ email: user.email, name: user.name })
    .from(applications)
    .innerJoin(user, eq(applications.userId, user.id))
    .where(eq(applications.id, id));

  if (applicant) {
    await emailQueue.add("send-email", {
      to: applicant.email,
      subject: "Invitation to Interview - SDC OS",
      html: `<p>Hi ${applicant.name},</p><p>Congratulations! We have reviewed your application and would like to invite you to an interview.</p><p>Please check your student portal for scheduling details.</p>`,
    }, { jobId: crypto.createHash("sha256").update(`interview:${id}`).digest("hex") });
  }
}

// In-app notification for status changes
const statusMessages: Record<string, { title: string; message: string }> = {
  accepted: { title: "Application Accepted! 🎉", message: "Congratulations! Your application to join the club has been accepted." },
  rejected: { title: "Application Update", message: "We appreciate your interest but were unable to accept your application at this time." },
  interviewing: { title: "Interview Invitation", message: "You've been invited for an interview! Check your email for details." },
  ai_graded: { title: "Application Under Review", message: "Your application is being reviewed. We'll notify you soon." },
};

if (statusMessages[status] && updatedApp?.userId) {
  void NotificationService.sendInAppNotification({
    userId: updatedApp.userId,
    type: "system",
    title: statusMessages[status].title,
    message: statusMessages[status].message,
    link: "/recruitment/apply",
  });
}

return NextResponse.json({ success: true, data: updatedApp });
});
