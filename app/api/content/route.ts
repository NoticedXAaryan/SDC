import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contentItems, user } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const contentSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  platform: z.string().optional(),
  status: z.enum(["idea", "drafting", "review", "scheduled", "published"]).optional(),
  scheduledFor: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
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

const body = await req.json();
const parsed = contentSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { title, description, platform, status, scheduledFor, mediaUrls } = parsed.data;

const [newItem] = await db.insert(contentItems).values({
  id: nanoid(),
  title,
  description,
  platform,
  status: status || "idea",
  scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
  mediaUrls: mediaUrls || [],
  authorId: sessionAuth.user.id,
  createdAt: new Date(),
  updatedAt: new Date(),
}).returning();

return NextResponse.json(newItem, { status: 201 });

});
