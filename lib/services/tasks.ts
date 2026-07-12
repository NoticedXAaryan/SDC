import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { nanoid } from "nanoid";

const EVENT_TEMPLATES: Record<string, Array<{ title: string, description: string }>> = {
  workshop: [
    { title: "Book venue", description: "Secure the lab/hall for the workshop" },
    { title: "Prepare slides", description: "Create and review the presentation deck" },
    { title: "Setup registration form", description: "Open public applications" },
    { title: "Market event", description: "Post on social media and college groups" },
  ],
  hackathon: [
    { title: "Book venue", description: "Secure a large hall for 24-48 hours" },
    { title: "Arrange sponsors", description: "Contact potential sponsors for prizes and food" },
    { title: "Setup Devfolio/Registration", description: "Open team registrations" },
    { title: "Arrange judges", description: "Invite alumni or faculty for judging" },
    { title: "Order food/snacks", description: "Arrange midnight snacks and meals" },
  ],
  internal_meetup: [
    { title: "Book small room", description: "Find a quiet place for the internal sync" },
    { title: "Set agenda", description: "Draft the meeting agenda and share with members" },
  ]
};

export async function createDefaultEventTasks(eventId: string, type: string, isInternal: boolean) {
  const templateKey = isInternal ? "internal_meetup" : (EVENT_TEMPLATES[type] ? type : "workshop");
  const templates = EVENT_TEMPLATES[templateKey];

  if (!templates || templates.length === 0) return;

  const tasksToInsert = templates.map(t => ({
    id: nanoid(),
    eventId,
    title: t.title,
    description: t.description,
    status: "todo" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(tasks).values(tasksToInsert);
}
