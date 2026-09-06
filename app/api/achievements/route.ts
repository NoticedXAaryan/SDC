import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { achievementSubmissions, auditLogs, notifications, pointLogs, user } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const submitSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(3000),
  proofUrl: z.string().url().optional(),
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  pointsAwarded: z.number().int().min(0).max(1000).optional(),
  reasonCode: z.string().trim().max(100).optional(),
  reasonNote: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.status === "rejected" && !value.reasonCode) {
    context.addIssue({ code: "custom", path: ["reasonCode"], message: "A rejection reason is required" });
  }
  if (value.status === "approved" && (value.pointsAwarded ?? 10) < 1) {
    context.addIssue({ code: "custom", path: ["pointsAwarded"], message: "Approved achievements must award at least one point" });
  }
});

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const sessionAuth = await requireRole(["member", "alumni", "co_lead", "event_lead", "lead", "admin", "owner"]);
await checkEmergencyFreeze(sessionAuth.user.role as string);

const body = await req.json();
const parsed = submitSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const submissionId = nanoid();
const submission = await db.transaction(async (tx) => {
  const [created] = await tx.insert(achievementSubmissions).values({
    id: submissionId,
    userId: sessionAuth.user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    proofUrl: parsed.data.proofUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  await tx.insert(auditLogs).values({
    id: nanoid(), actorId: sessionAuth.user.id, action: "achievement_submitted", entity: "achievement", entityId: submissionId,
    details: JSON.stringify({ title: parsed.data.title, hasProof: Boolean(parsed.data.proofUrl) }), timestamp: new Date(),
  });
  return created;
});

return NextResponse.json(submission, { status: 201 });

});

export const PATCH = withApiHandler(async (req: NextRequest) => {
    
    
// Only leads and admins can review
const sessionAuth = await requireRole(["event_lead", "lead", "admin", "owner"]);
await checkEmergencyFreeze(sessionAuth.user.role as string);

const body = await req.json();
const { id, ...updateData } = body;

const parsed = reviewSchema.safeParse(updateData);
if (!parsed.success || !id) {
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

const [sub] = await db.select().from(achievementSubmissions).where(eq(achievementSubmissions.id, id)).limit(1);
if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
if (sub.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
if (sub.userId === sessionAuth.user.id) return NextResponse.json({ error: "You cannot review your own achievement" }, { status: 403 });

const points = parsed.data.status === "approved" ? (parsed.data.pointsAwarded ?? 10) : 0;

await db.transaction(async (tx) => {
  // 1. Update submission
  const [updated] = await tx.update(achievementSubmissions).set({
    status: parsed.data.status,
    pointsAwarded: points,
    reviewedBy: sessionAuth.user.id,
    updatedAt: new Date(),
  }).where(and(eq(achievementSubmissions.id, id), eq(achievementSubmissions.status, "pending"))).returning();
  if (!updated) throw new ValidationError("This achievement has already been reviewed");

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
  await tx.insert(auditLogs).values({
    id: nanoid(), actorId: sessionAuth.user.id, action: `achievement_${parsed.data.status}`, entity: "achievement", entityId: id,
    details: JSON.stringify({ points, reasonCode: parsed.data.reasonCode ?? null, reasonNote: parsed.data.reasonNote ?? null }), timestamp: new Date(),
  });
  await tx.insert(notifications).values({
    id: nanoid(),
    userId: sub.userId,
    type: "achievement",
    title: parsed.data.status === "approved" ? "Achievement approved" : "Achievement needs revision",
    message: parsed.data.status === "approved"
      ? `Your achievement “${sub.title}” was approved. You earned ${points} points.`
      : `Your achievement “${sub.title}” was not approved. ${parsed.data.reasonNote || parsed.data.reasonCode || "Review the proof and try again."}`,
    link: "/achievements",
  });
});

return NextResponse.json({ success: true, message: `Submission ${parsed.data.status}` });

});
