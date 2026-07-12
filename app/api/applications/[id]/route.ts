import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireLead } from "@/lib/dal/auth";
import { emailQueue } from "@/lib/queues/email";

import crypto from "crypto";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
          subject: "Invitation to Interview - STC OS",
          html: `<p>Hi ${applicant.name},</p><p>Congratulations! We have reviewed your application and would like to invite you to an interview.</p><p>Please check your student portal for scheduling details.</p>`,
        }, { jobId: crypto.createHash("sha256").update(`interview:${id}`).digest("hex") });
      }
    }

    return NextResponse.json({ success: true, data: updatedApp });
  } catch (error) {
    console.error("Failed to update application status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
