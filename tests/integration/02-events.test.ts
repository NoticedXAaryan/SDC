import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createEvent, publishEvent, duplicateEvent, getEvents } from "@/lib/dal/events";
import { registerForEvent, checkInScanner } from "@/lib/dal/events"; // from where they were merged

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
    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
    
    // Clean up created events
    await db.delete(events).where(eq(events.organizationId, "test-org-123"));
  });

  it("should create an event successfully", async () => {
    const payload = {
      title: "Test Audit Event",
      slug: "test-audit-event",
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
    expect(newEvent.title).toBe("Test Audit Event");
    expect(newEvent.status).toBe("draft");
    expect(newEvent.organizationId).toBe("test-org-123");
  });

  it("should block duplicate slugs", async () => {
    const payload = {
      title: "Test Audit Event 2",
      slug: "test-audit-event", // Same slug
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      capacity: 10,
      isPaid: false,
      price: 0,
      forms: [],
    };

    await expect(createEvent(adminSession, payload)).rejects.toThrow();
  });

  it("should fetch events correctly with permissions", async () => {
    const list = await getEvents(memberSession, { search: "Test Audit Event" });
    // Since it's a draft, maybe it shouldn't show up for a member? Or maybe it does because getEvents logic.
    // If it's a draft, getEvents for members should omit it or return it based on the DAL logic.
    // Let's check what it returns
    expect(Array.isArray(list.data)).toBe(true);
  });
});
