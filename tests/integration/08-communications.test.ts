import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { events, communications, tasks, clubSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createEvent, approveEvent } from "@/lib/dal/events.core";
import { createEventCommunicationDb, getEventCommunications, notifyColleagues } from "@/lib/dal/communications";

describe("Communications Integration Tests", () => {
  let adminId: string;
  let adminSession: any;
  let eventId: string;

  beforeAll(async () => {
    await db.update(clubSettings).set({ isFrozen: false });
    adminId = await createTestUser("admin");
    adminSession = getMockSession(adminId, "admin");

    const payload = {
      title: "Comms Test Event",
      slug: "comms-test-event",
      type: "workshop",
      description: "Test event for comms",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 50,
      isPaid: false,
      price: 0,
      forms: [],
      visibility: "public"
    };

    const newEvent = await createEvent(adminSession, payload);
    eventId = newEvent.id as string;
    await approveEvent(adminSession, eventId);
  });

  afterAll(async () => {
    await db.delete(communications).where(eq(communications.eventId, eventId));
    await db.delete(tasks).where(eq(tasks.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));
    await cleanupTestUser(adminId);
  });

  it("12.1 should create event communication at /communications", async () => {
    const res = await createEventCommunicationDb(adminSession, eventId, {
      subject: "Test Broadcast",
      body: "Hello all registrants",
      targetAudience: "all"
    });
    
    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    
    const comms = await getEventCommunications(adminSession, eventId);
    expect(comms.length).toBe(1);
    expect(comms[0].subject).toBe("Test Broadcast");
  });

  it("12.6 should notify colleagues", async () => {
    const res = await notifyColleagues(adminSession, eventId, {
      subject: "Test Colleague Notif",
      message: "Please review the test event"
    });
    expect(res.success).toBe(true);
    expect(res.count).toBeGreaterThan(0);
  });
});
