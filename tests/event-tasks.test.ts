import { describe, expect, it } from "vitest";

import { buildDefaultEventTasks } from "@/lib/domain/event-tasks";

const startsAt = new Date("2026-10-20T10:00:00.000Z");
const endsAt = new Date("2026-10-20T16:00:00.000Z");

describe("event workflow task blueprints", () => {
  it("creates cross-functional preparation and certificate handoff tasks", () => {
    const tasks = buildDefaultEventTasks({
      eventId: "event-1",
      eventSlug: "react-workshop",
      type: "workshop",
      isInternal: false,
      startsAt,
      endsAt,
    });

    expect(tasks.map((task) => task.assigneeRole)).toEqual(expect.arrayContaining([
      "event_lead",
      "tech_lead",
      "marketing_lead",
      "content_lead",
    ]));

    const designTask = tasks.find((task) => task.title === "Prepare certificate template");
    expect(designTask).toMatchObject({
      assigneeRole: "content_lead",
      actionHref: "/lead/certificates?eventId=event-1",
      actionLabel: "Design certificate",
    });
    expect(designTask?.dueDate.toISOString()).toBe("2026-10-17T10:00:00.000Z");

    const deliveryTask = tasks.find((task) => task.title === "Issue attendee certificates");
    expect(deliveryTask).toMatchObject({
      assigneeRole: "event_lead",
      actionHref: "/events/react-workshop/manage?tab=certificates",
    });
    expect(deliveryTask?.dueDate.toISOString()).toBe("2026-10-22T16:00:00.000Z");
  });

  it("keeps internal meetings lightweight and skips certificate delivery", () => {
    const tasks = buildDefaultEventTasks({
      eventId: "event-2",
      eventSlug: "weekly-sync",
      type: "social",
      isInternal: true,
      startsAt,
      endsAt,
    });

    expect(tasks.map((task) => task.title)).toEqual(["Book meeting room", "Share meeting agenda"]);
    expect(tasks.every((task) => task.actionHref === undefined)).toBe(true);
  });

  it("uses the workshop preparation plan for an unknown event type", () => {
    const tasks = buildDefaultEventTasks({
      eventId: "event-3",
      eventSlug: "new-format",
      type: "future-format",
      isInternal: false,
      startsAt,
      endsAt,
    });

    expect(tasks.some((task) => task.title === "Prepare workshop material")).toBe(true);
    expect(tasks.some((task) => task.title === "Issue attendee certificates")).toBe(true);
  });
});
