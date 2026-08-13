import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { events, registrations, tasks } from "@/lib/db/schema";
import { eq, like, inArray } from "drizzle-orm";
import { createEvent, approveEvent } from "@/lib/dal/events";
import { registerForEvent } from "@/lib/dal/events.registration";
import { ScannerService } from "@/lib/services/scanner";
import { nanoid } from "nanoid";

describe("Scanner & Check-In Integration Tests", () => {
  let adminId: string;
  let memberId: string;
  let member2Id: string;
  let adminSession: any;
  let memberSession: any;
  let member2Session: any;
  
  let eventId: string;
  let member1PassToken: string;
  let member2PassToken: string;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    member2Id = await createTestUser("member");
    
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");
    member2Session = getMockSession(member2Id, "member");

    // Create and approve event
    const payload = {
      title: "Scanner Test Event",
      slug: "scanner-test-event",
      type: "workshop",
      description: "Test event for scanner",
      startsAt: new Date(Date.now() - 3600000).toISOString(), // Started 1h ago
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      capacity: 50,
      isPaid: false,
      price: 0,
      forms: [],
      visibility: "public"
    };

    const newEvent = await createEvent(adminSession, payload);
    eventId = newEvent.id as string;
    await approveEvent(adminSession, eventId);

    // Register members
    const reg1 = await registerForEvent(memberSession, eventId);
    member1PassToken = reg1.passToken as string;

    const reg2 = await registerForEvent(member2Session, eventId);
    member2PassToken = reg2.passToken as string;
  });

  afterAll(async () => {
    const testEvents = await db.select({ id: events.id }).from(events).where(like(events.slug, "scanner-test-event%"));
    if (testEvents.length > 0) {
      const eventIds = testEvents.map(e => e.id);
      await db.delete(tasks).where(inArray(tasks.eventId, eventIds));
      await db.delete(registrations).where(inArray(registrations.eventId, eventIds));
    }
    await db.delete(events).where(like(events.slug, "scanner-test-event%"));

    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
    await cleanupTestUser(member2Id);
  });

  it("5.2 should scan a valid QR code (check-in succeeds)", async () => {
    const result = await ScannerService.checkInScanner(adminSession, eventId, member1PassToken);
    expect(result.success).toBe(true);

    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, memberId)
    });
    expect(reg?.status).toBe("checked_in");
  });

  it("5.3 should fail to scan same code again (already checked in)", async () => {
    await expect(
      ScannerService.checkInScanner(adminSession, eventId, member1PassToken)
    ).rejects.toThrow("Already checked in");
  });

  it("5.4 should fail to scan invalid code", async () => {
    await expect(
      ScannerService.checkInScanner(adminSession, eventId, "invalid.token.here")
    ).rejects.toThrow("Invalid or forged pass token");
  });

  it("5.5 should process batch check-in", async () => {
    // member2 is not checked in yet
    const checkIns = [
      { id: nanoid(), eventId, token: member2PassToken },
      { id: nanoid(), eventId, token: "invalid.token" }
    ];

    const result = await ScannerService.batchCheckInScanner(adminSession, checkIns);
    expect(result.success).toBe(true);
    expect(result.checkedInCount).toBe(1);

    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, member2Id)
    });
    expect(reg?.status).toBe("checked_in");
  });
});
