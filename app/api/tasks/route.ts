import { NextRequest, NextResponse } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { getTasks, createTask, updateTask } from "@/lib/dal/tasks";

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

export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const allTasks = await getTasks(session);
  return NextResponse.json(allTasks);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  await checkEmergencyFreeze(session.user.role as string);
  
  const body = await req.json();
  const parsed = createTaskSchema.parse(body);
  
  const newTask = await createTask(session, parsed);
  return NextResponse.json(newTask, { status: 201 });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  await checkEmergencyFreeze(session.user.role as string);
  
  const body = await req.json();
  const parsed = updateTaskSchema.parse(body);
  
  const updatedTask = await updateTask(session, parsed);
  return NextResponse.json(updatedTask);
});
