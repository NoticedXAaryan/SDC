import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, user, applicationReviews } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";

const statusSchema = z.object({
  status: z.enum(["draft", "applied", "ai_graded", "needs_manual_review", "interviewing", "accepted", "rejected"]),
  domain: z.string().optional(),
  reasonCode: z.string().optional(),
  reasonNote: z.string().optional()
});

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    const session = await requireAdmin();
    const body = await req.json();
    const { status, domain, reasonCode, reasonNote } = statusSchema.parse(body);

    if (status === "rejected" && !reasonCode) {
      return NextResponse.json({ error: "A reason code is required when rejecting an application." }, { status: 400 });
    }

    const [app] = await db.select().from(applications).where(eq(applications.id, resolvedParams.id));
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const [updated] = await db.update(applications)
      .set({ status })
      .where(eq(applications.id, resolvedParams.id))
      .returning();

    // Log the review
    if (status === "rejected" || status === "accepted") {
      await db.insert(applicationReviews).values({
        applicationId: app.id,
        reviewerId: session.user.id,
        action: status === "rejected" ? "rejected" : "approved",
        reasonCode: reasonCode || null,
        reasonNote: reasonNote || null,
      });
    }

    // If accepted, update the user role to member and allot domain
    if (status === "accepted") {
      await db.update(user)
        .set({ role: "member" })
        .where(eq(user.id, app.userId));
    }

    return NextResponse.json(updated);
});
