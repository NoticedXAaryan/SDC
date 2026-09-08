import crypto from "crypto";
import { and, eq, ne } from "drizzle-orm";

import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, notifications, projects, user } from "@/lib/db/schema";
import { PROJECT_REVIEW_ROLES } from "@/lib/domain/projects";
import type { reviewProjectSchema } from "@/lib/validators/projects";
import type { z } from "zod";

type ReviewProjectInput = z.infer<typeof reviewProjectSchema>;

export async function reviewProject(session: AuthSession, projectId: string, input: ReviewProjectInput) {
  const role = session.user.role as string;
  if (!(PROJECT_REVIEW_ROLES as readonly string[]).includes(role)) {
    throw new AuthorizationError("You cannot review project submissions.");
  }

  const [existing] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!existing) throw new ValidationError("Project not found");
  if (existing.status !== "pending") throw new ValidationError("This project has already been reviewed.");
  if (existing.submittedBy === session.user.id) {
    throw new AuthorizationError("You cannot review your own project submission.");
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx.update(projects)
      .set({ status: input.status })
      .where(and(eq(projects.id, projectId), eq(projects.status, "pending")))
      .returning();
    if (!updated) throw new ValidationError("This project has already been reviewed.");

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: `project_${input.status}`,
      entity: "project",
      entityId: projectId,
      details: JSON.stringify({ reasonCode: input.reasonCode ?? null, reasonNote: input.reasonNote ?? null }),
      timestamp: new Date(),
    });

    const notificationRows: Array<typeof notifications.$inferInsert> = [];
    if (existing.submittedBy) {
      notificationRows.push({
        id: crypto.randomUUID(),
        userId: existing.submittedBy,
        type: "project_reviewed",
        title: input.status === "approved" ? "Project approved" : "Project needs revision",
        message: input.status === "approved"
          ? `Your project “${existing.title}” is now published.`
          : `Your project “${existing.title}” was not approved. ${input.reasonNote || input.reasonCode || "Review the submission and try again."}`,
        link: "/internal-projects",
      });
    }

    if (input.status === "approved") {
      const members = await tx.select({ id: user.id }).from(user).where(ne(user.role, "outsider"));
      for (const member of members) {
        if (member.id === existing.submittedBy) continue;
        notificationRows.push({
          id: crypto.randomUUID(),
          userId: member.id,
          type: "project_published",
          title: "New project published",
          message: `Explore “${existing.title}” in the club project gallery.`,
          link: "/internal-projects",
        });
      }
    }

    for (let index = 0; index < notificationRows.length; index += 100) {
      await tx.insert(notifications).values(notificationRows.slice(index, index + 100));
    }

    return updated;
  });
}
