import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
// Only tech leads and admins can approve projects
await requireRole(["tech_lead", "admin", "owner"]);

const { id: projectId } = await params;
const reqBody = await req.json().catch(() => ({}));
const newStatus = reqBody.status; // "approved" or "rejected"

if (!["approved", "rejected"].includes(newStatus)) {
  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}

const [updated] = await db.update(projects)
  .set({ status: newStatus as "approved" | "rejected" | "pending" })
  .where(eq(projects.id, projectId))
  .returning();

if (!updated) {
  return NextResponse.json({ error: "Project not found" }, { status: 404 });
}

// Optionally notify the submitter? We don't track the submitter ID in `projects` right now.
// If we add `userId` to projects in the future, we would insert a notification here.

// If approved, broadcast a global announcement about the new project
if (newStatus === "approved") {
  // Find all members
  const { user } = await import("@/lib/db/schema");
  const { ne } = await import("drizzle-orm");
  
  const allMembers = await db.select({ id: user.id })
    .from(user)
    .where(ne(user.role, "outsider"));
    
  const notifsToInsert = allMembers.map(m => ({
    id: crypto.randomUUID(),
    userId: m.id,
    type: "project_published",
    title: "New Tech Project Published!",
    message: `Check out the newly published project: ${updated.title}`,
    link: updated.liveUrl || updated.githubUrl || `/projects/${updated.id}`
  }));

  // Batch insert notifications
  if (notifsToInsert.length > 0) {
    // Splitting into chunks of 100 to avoid query size limits
    const chunkSize = 100;
    for (let i = 0; i < notifsToInsert.length; i += chunkSize) {
      const chunk = notifsToInsert.slice(i, i + chunkSize);
      await db.insert(notifications).values(chunk);
    }
  }
}

return NextResponse.json({ success: true, project: updated });

});
