import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { buildDefaultEventTasks, type EventTaskContext } from "@/lib/domain/event-tasks";
import { nanoid } from "nanoid";

export async function createDefaultEventTasks(context: EventTaskContext) {
  const templates = buildDefaultEventTasks(context);

  const tasksToInsert = templates.map(t => ({
    id: nanoid(),
    eventId: context.eventId,
    title: t.title,
    description: t.description,
    assigneeRole: t.assigneeRole,
    dueDate: t.dueDate,
    actionHref: t.actionHref,
    actionLabel: t.actionLabel,
    status: "todo" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(tasks).values(tasksToInsert);
}
