import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, projectImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
});

import { LocalMockStorageService } from "@/lib/services/storage";
const storage = new LocalMockStorageService();

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole(["admin", "owner", "tech_lead", "co_lead"]);
  
  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
  }

  const [updated] = await db.update(projects)
    .set({ status: parsed.data.status })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, project: updated });
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole(["admin", "owner"]);
  
  const { id } = await params;

  // Find images to delete
  const images = await db.select().from(projectImages).where(eq(projectImages.projectId, id));
  
  const [deleted] = await db.delete(projects)
    .where(eq(projects.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Delete orphaned images from disk
  for (const img of images) {
    await storage.deleteFile(img.url);
  }

  return NextResponse.json({ success: true, deleted: id });
});
