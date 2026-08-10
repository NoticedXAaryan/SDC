import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, user, events } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import crypto from "crypto";

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
});

const updateTaskSchema = z.object({
  id: z.string(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
  assigneeId: z.string().optional().nullable(),
});

export const GET = withApiHandler(async (req: Request) => {
  await requireRole(["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"]);
  
  const allTasks = await db.select({
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
  
  return NextResponse.json(allTasks);
});

export const POST = withApiHandler(async (req: Request) => {
  await requireRole(["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"]);
  
  const body = await req.json();
  const parsed = createTaskSchema.parse(body);
  
  const [newTask] = await db.insert(tasks).values({
    id: crypto.randomUUID(),
    title: parsed.title,
    description: parsed.description || null,
    eventId: parsed.eventId || null,
    assigneeId: parsed.assigneeId || null,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    status: "todo",
  }).returning();
  
  return NextResponse.json(newTask, { status: 201 });
});

export const PATCH = withApiHandler(async (req: Request) => {
  await requireRole(["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"]);
  
  const body = await req.json();
  const parsed = updateTaskSchema.parse(body);
  
  const [updatedTask] = await db.update(tasks).set({
    status: parsed.status,
    assigneeId: parsed.assigneeId === null ? null : parsed.assigneeId,
    updatedAt: new Date(),
  }).where(eq(tasks.id, parsed.id)).returning();
  
  if (!updatedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  
  return NextResponse.json(updatedTask);
});
