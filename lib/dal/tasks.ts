import { db } from "@/lib/db";
import { tasks, user, events } from "@/lib/db/schema";
import { asc, desc, eq, or, and, isNull, sql } from "drizzle-orm";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

const TASK_ADMIN_ROLES = ["owner", "admin", "lead", "vice_lead", "co_lead"];
const TASK_CREATOR_ROLES = [
  ...TASK_ADMIN_ROLES,
  "tech_lead",
  "event_lead",
  "marketing_lead",
  "finance_lead",
  "content_lead",
];

export async function getTasks(sessionAuth: AuthSession) {
  const role = sessionAuth.user.role as string;
  const canViewAll = TASK_ADMIN_ROLES.includes(role);
  const query = db.select({
    id: tasks.id,
    title: tasks.title,
    description: tasks.description,
    status: sql<"todo" | "in_progress" | "done" | "blocked">`coalesce(${tasks.status}, 'todo')`,
    dueDate: tasks.dueDate,
    createdAt: tasks.createdAt,
    assigneeRole: tasks.assigneeRole,
    actionHref: tasks.actionHref,
    actionLabel: tasks.actionLabel,
    assigneeName: user.name,
    eventName: events.title,
    eventSlug: events.slug,
  })
  .from(tasks)
  .leftJoin(user, eq(tasks.assigneeId, user.id))
  .leftJoin(events, eq(tasks.eventId, events.id));

  if (!canViewAll) {
    query.where(or(
      eq(tasks.assigneeId, sessionAuth.user.id),
      and(isNull(tasks.assigneeId), eq(tasks.assigneeRole, role)),
    ));
  }

  return await query.orderBy(asc(tasks.dueDate), desc(tasks.createdAt));
}

export async function createTask(sessionAuth: AuthSession, data: any) {
  const role = sessionAuth.user.role as string;
  if (!TASK_CREATOR_ROLES.includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const [newTask] = await db.insert(tasks).values({
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description || null,
    eventId: data.eventId || null,
    assigneeId: data.assigneeId || null,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    status: "todo",
  }).returning();

  return newTask;
}

export async function updateTask(sessionAuth: AuthSession, data: any) {
  const role = sessionAuth.user.role as string;

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, data.id),
  });

  if (!task) {
    throw new ValidationError("Task not found");
  }

  const canManageAll = TASK_ADMIN_ROLES.includes(role);
  const isAssignee = task.assigneeId === sessionAuth.user.id;
  const isRoleAssignee = !task.assigneeId && task.assigneeRole === role;

  if (!canManageAll && !isAssignee && !isRoleAssignee) {
    throw new AuthorizationError("You can only update tasks assigned to you");
  }

  if (data.status === undefined && data.assigneeId === undefined) {
    throw new ValidationError("Provide a status or assignee update");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  // The first person to start work from a role queue owns it automatically.
  if (isRoleAssignee && data.status && data.status !== "todo") {
    updateData.assigneeId = sessionAuth.user.id;
  }

  if (canManageAll && data.assigneeId !== undefined) {
    updateData.assigneeId = data.assigneeId === null ? null : data.assigneeId;
  }

  const [updatedTask] = await db.update(tasks)
    .set(updateData)
    .where(eq(tasks.id, data.id))
    .returning();

  return updatedTask;
}
