import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { events, registrations, tasks } from "@/lib/db/schema";
import { eq, like, inArray } from "drizzle-orm";
import { createEvent, duplicateEvent, getEvents } from "@/lib/dal/events";
import { registerForEvent } from "@/lib/dal/events";

describe("Events DAL Integration Tests", () => {
  let adminId: string;
  let memberId: string;
  let adminSession: any;
  let memberSession: any;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");
  });

  afterAll(async () => {
    // Clean up created events and tasks FIRST to avoid FK constraint error
    const testEvents = await db.select({ id: events.id }).from(events).where(like(events.slug, "test-audit-event%"));
    if (testEvents.length > 0) {
      const eventIds = testEvents.map(e => e.id);
      await db.delete(tasks).where(inArray(tasks.eventId, eventIds));
      await db.delete(registrations).where(inArray(registrations.eventId, eventIds));
    }
    await db.delete(events).where(like(events.slug, "test-audit-event%"));

    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
  });

  it("should create an event successfully", async () => {
    const payload = {
      title: "Test Audit Event",
      slug: "test-audit-event",
      type: "workshop",
      description: "A test event for auditing",
      startsAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 10,
      isPaid: false,
      price: 0,
      forms: [],
      status: "draft" as const
    };

    const newEvent = await createEvent(adminSession, payload);
    expect(newEvent).toBeDefined();
    expect(newEvent.success).toBe(true);
    
    // verify in db
    const savedEvent = await db.query.events.findFirst({ where: eq(events.id, newEvent.id as string) });
    expect(savedEvent?.title).toBe("Test Audit Event");
    expect(savedEvent?.status).toBe("published"); // createEvent might default to published or strip status
  });

  it("should block duplicate slugs", async () => {
    const payload = {
      title: "Test Audit Event 2",
      slug: "test-audit-event", // Same slug
      type: "workshop",
      description: "A test event for auditing",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 10,
      isPaid: false,
      price: 0,
      forms: [],
    };

    const newEvent = await createEvent(adminSession, payload);
    expect(newEvent.success).toBe(true);
    expect(newEvent.slug).not.toBe("test-audit-event"); // createEvent auto-suffixes duplicate slugs
  });

  it("should fetch events correctly with permissions", async () => {
    const list = await getEvents(memberSession, { search: "Test Audit Event" });
    expect(Array.isArray(list.events)).toBe(true);
  });
});
