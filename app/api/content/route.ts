import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, contentItems, user } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { canTransitionContent } from "@/lib/workflows/content";

const contentSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional(),
  platform: z.string().trim().max(80).optional(),
  status: z.enum(["idea", "drafting"]).optional(),
  scheduledFor: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

const contentUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["idea", "drafting", "review", "scheduled", "published"]),
});

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireRole(["content_lead", "co_lead", "lead", "admin", "owner"]);

  const items = await db.select({
    id: contentItems.id,
    title: contentItems.title,
    description: contentItems.description,
    platform: contentItems.platform,
    status: contentItems.status,
    scheduledFor: contentItems.scheduledFor,
    mediaUrls: contentItems.mediaUrls,
    authorName: user.name,
  })
  .from(contentItems)
  .leftJoin(user, eq(user.id, contentItems.authorId))
  .orderBy(desc(contentItems.createdAt));

  return NextResponse.json(items);
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const sessionAuth = await requireRole(["content_lead", "co_lead", "lead", "admin", "owner"]);
await checkEmergencyFreeze(sessionAuth.user.role as string);

const body = await req.json();
const parsed = contentSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { title, description, platform, status, scheduledFor, mediaUrls } = parsed.data;

const newItem = await db.transaction(async (tx) => {
  const [item] = await tx.insert(contentItems).values({
    id: nanoid(),
    title,
    description,
    platform,
    status: status || (description ? "drafting" : "idea"),
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    mediaUrls: mediaUrls || [],
    authorId: sessionAuth.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  await tx.insert(auditLogs).values({
    id: nanoid(), actorId: sessionAuth.user.id, action: "content_created", entity: "content", entityId: item.id,
    details: JSON.stringify({ status: item.status }), timestamp: new Date(),
  });
  return item;
});

return NextResponse.json(newItem, { status: 201 });

});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const sessionAuth = await requireRole(["content_lead", "co_lead", "lead", "admin", "owner"]);
  await checkEmergencyFreeze(sessionAuth.user.role as string);
  const parsed = contentUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content update", details: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db.select().from(contentItems).where(eq(contentItems.id, parsed.data.id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Content item not found" }, { status: 404 });
  const currentStatus = existing.status || "idea";
  if (!canTransitionContent(currentStatus, parsed.data.status)) {
    return NextResponse.json({ error: `Cannot move content from ${currentStatus} to ${parsed.data.status}` }, { status: 400 });
  }
  if (parsed.data.status === "scheduled" && !existing.scheduledFor) {
    return NextResponse.json({ error: "Set a target date before scheduling content" }, { status: 400 });
  }

  const updated = await db.transaction(async (tx) => {
    const [item] = await tx.update(contentItems).set({
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? new Date() : existing.publishedAt,
      updatedAt: new Date(),
    }).where(eq(contentItems.id, parsed.data.id)).returning();
    await tx.insert(auditLogs).values({
      id: nanoid(), actorId: sessionAuth.user.id, action: "content_status_changed", entity: "content", entityId: parsed.data.id,
      details: JSON.stringify({ from: currentStatus, to: parsed.data.status }), timestamp: new Date(),
    });
    return item;
  });
  return NextResponse.json(updated);
});
