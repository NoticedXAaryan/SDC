import { db } from "@/lib/db";
import { tasks, user, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

export async function getTasks(sessionAuth: AuthSession) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  return await db.select({
    id: tasks.id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    dueDate: tasks.dueDate,
    createdAt: tasks.createdAt,
    assigneeName: user.name,
    eventName: events.title
  })
  .from(tasks)
  .leftJoin(user, eq(tasks.assigneeId, user.id))
  .leftJoin(events, eq(tasks.eventId, events.id))
  .orderBy(desc(tasks.createdAt));
}

export async function createTask(sessionAuth: AuthSession, data: any) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"].includes(role)) {
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
  
  // A regular member shouldn't update tasks unless they are assigned to it? 
  // Wait, the API previously only allowed leads. Let's keep it that way for leads, 
  // but if we want members to move their own tasks we should add that here!
  // The Prompt requires state transitions.
  
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, data.id),
  });

  if (!task) {
    throw new ValidationError("Task not found");
  }

  const isLead = ["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"].includes(role);
  const isAssignee = task.assigneeId === sessionAuth.user.id;

  if (!isLead && !isAssignee) {
    throw new AuthorizationError("You can only update tasks assigned to you");
  }

  // Members can only update status, leads can update assignee
  let updateData: any = {
    status: data.status,
    updatedAt: new Date(),
  };

  if (isLead && data.assigneeId !== undefined) {
    updateData.assigneeId = data.assigneeId === null ? null : data.assigneeId;
  }

  const [updatedTask] = await db.update(tasks)
    .set(updateData)
    .where(eq(tasks.id, data.id))
    .returning();

  return updatedTask;
}
