import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { achievementSubmissions, pointLogs, user } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { NotificationService } from "@/lib/services/notifications";

const submitSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  proofUrl: z.string().url().optional(),
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  pointsAwarded: z.number().int().min(0).optional(),
});

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
const sessionAuth = await requireRole(["member", "alumni", "co_lead", "event_lead", "lead", "admin", "owner"]);

const body = await req.json();
const parsed = submitSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const [submission] = await db.insert(achievementSubmissions).values({
  id: nanoid(),
  userId: sessionAuth.user.id,
  title: parsed.data.title,
  description: parsed.data.description,
  proofUrl: parsed.data.proofUrl,
  createdAt: new Date(),
  updatedAt: new Date(),
}).returning();

return NextResponse.json(submission, { status: 201 });

});

export const PATCH = withApiHandler(async (req: NextRequest) => {
// Only leads and admins can review
const sessionAuth = await requireRole(["event_lead", "lead", "admin", "owner"]);

const body = await req.json();
const { id, ...updateData } = body;

const parsed = reviewSchema.safeParse(updateData);
if (!parsed.success || !id) {
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

const [sub] = await db.select().from(achievementSubmissions).where(eq(achievementSubmissions.id, id)).limit(1);
if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
if (sub.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

const points = parsed.data.status === "approved" ? (parsed.data.pointsAwarded || 10) : 0;

await db.transaction(async (tx) => {
  // 1. Update submission
  await tx.update(achievementSubmissions).set({
    status: parsed.data.status,
    pointsAwarded: points,
    reviewedBy: sessionAuth.user.id,
    updatedAt: new Date(),
  }).where(eq(achievementSubmissions.id, id));

  if (parsed.data.status === "approved" && points > 0) {
    // 2. Add point log
    await tx.insert(pointLogs).values({
      id: nanoid(),
      userId: sub.userId,
      points,
      reason: `Achievement Approved: ${sub.title}`,
    });

    // 3. Increment user points
    await tx.update(user)
      .set({ points: sql`${user.points} + ${points}` })
      .where(eq(user.id, sub.userId));
  }
});

// Notify the user about the review result
void NotificationService.sendInAppNotification({
  userId: sub.userId,
  type: "achievement",
  title: parsed.data.status === "approved" ? "Achievement Approved! 🎉" : "Achievement Not Approved",
  message: parsed.data.status === "approved"
    ? `Your achievement "${sub.title}" was approved! You earned ${points} points.`
    : `Your achievement "${sub.title}" was not approved.`,
  link: "/achievements",
});

return NextResponse.json({ success: true, message: `Submission ${parsed.data.status}` });

});
