import { NextRequest, NextResponse } from "next/server";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, projectImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { getStorageService } from "@/lib/services/storage";
import { z } from "zod";
import { PROJECT_DELETE_ROLES, PROJECT_REVIEW_ROLES } from "@/lib/domain/projects";
import { reviewProject } from "@/lib/services/projects";
import { reviewProjectSchema } from "@/lib/validators/projects";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireRole([...PROJECT_REVIEW_ROLES]);
  await checkEmergencyFreeze(session.user.role as string);
  const { id } = await params;
  const parsed = reviewProjectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review", details: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await reviewProject(session, id, parsed.data);
  return NextResponse.json({ success: true, project: updated });
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    
    
  const session = await requireRole([...PROJECT_DELETE_ROLES]);
  await checkEmergencyFreeze(session.user.role as string);
  
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
  const storage = getStorageService();
  for (const img of images) {
    await storage.deleteFile(img.url);
  }

  return NextResponse.json({ success: true, deleted: id });
});
