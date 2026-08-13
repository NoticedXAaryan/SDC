import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { events, registrations, tasks } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";
import { createEvent, approveEvent, archiveEvent, duplicateEvent, getEventById } from "@/lib/dal/events";
import { registerForEvent, deregisterEvent } from "@/lib/dal/events.registration";

describe("Event Lifecycle Integration Tests", () => {
  let adminId: string;
  let leadId: string;
  let memberId: string;
  let adminSession: any;
  let leadSession: any;
  let memberSession: any;
  let member2Id: string;
  let member2Session: any;
  let eventId: string;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    leadId = await createTestUser("lead");
    memberId = await createTestUser("member");
    member2Id = await createTestUser("member");
    
    adminSession = getMockSession(adminId, "admin");
    leadSession = getMockSession(leadId, "lead");
    memberSession = getMockSession(memberId, "member");
    member2Session = getMockSession(member2Id, "member");
  });

  afterAll(async () => {
    await db.delete(registrations);
    await db.delete(tasks);
    await db.delete(events).where(like(events.slug, "lifecycle-test%"));

    await cleanupTestUser(adminId);
    await cleanupTestUser(leadId);
    await cleanupTestUser(memberId);
    await cleanupTestUser(member2Id);
  });

  it("4.1 & 4.2 should create event and verify saved as draft", async () => {
    const payload = {
      title: "Lifecycle Test Event",
      slug: "lifecycle-test-event",
      type: "workshop",
      description: "A test event for lifecycle",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 1, // small capacity to test waitlist
      isPaid: false,
      price: 0,
      forms: [],
      visibility: "public"
    };

    // Note: Lead creates the event, so it defaults to "draft"
    const newEvent = await createEvent(leadSession, payload);
    expect(newEvent.success).toBe(true);
    eventId = newEvent.id as string;

    const savedEvent = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    expect(savedEvent?.status).toBe("draft");
  });

  it("4.3 should approve event at /manage/approvals", async () => {
    // Admin approves the event
    await approveEvent(adminSession, eventId);
    const savedEvent = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    expect(savedEvent?.status).toBe("published");
  });

  it("4.6 should register for event as member and generate passCode", async () => {
    const regRes = await registerForEvent(memberSession, eventId, { answers: {} });
    expect(regRes.success).toBe(true);

    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, memberId)
    });
    expect(reg?.status).toBe("confirmed");
    expect(reg?.passCode).toBeDefined();
  });

  it("4.7 should view pass code", async () => {
    // Pass token is returned in registerForEvent
    // Just verifying that passToken exists.
    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, memberId)
    });
    expect(reg?.passCode).toBeDefined();
  });

  it("4.8 should test capacity and waitlisting", async () => {
    // Capacity was set to 1. Member1 registered, so it's full.
    // Member2 should be waitlisted.
    const regRes = await registerForEvent(member2Session, eventId, { answers: {} });
    expect(regRes.success).toBe(true);

    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, member2Id)
    });
    expect(reg?.status).toBe("waitlist");
  });

  it("4.9 should test deregistration", async () => {
    await deregisterEvent(memberSession, eventId);
    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, memberId)
    });
    expect(reg?.status).toBe("cancelled");
  });

  it("4.13 should test event duplication", async () => {
    const duplicated = await duplicateEvent(adminSession, eventId);
    expect(duplicated).toBeDefined();
    expect(duplicated.status).toBe("draft");
    expect(duplicated.title).toContain("Copy of Lifecycle Test Event");
  });

  it("4.14 should archive event", async () => {
    await archiveEvent(adminSession, eventId);
    const savedEvent = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    expect(savedEvent?.status).toBe("cancelled"); // archive logic sets to cancelled in DAL
  });
});
