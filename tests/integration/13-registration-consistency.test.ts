import { afterAll, beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, events, registrations, tasks } from "@/lib/db/schema";
import { createEvent, approveEvent } from "@/lib/dal/events";
import { registerForEvent, deregisterEvent } from "@/lib/dal/events.registration";
import { createTestUser, cleanupTestUser, getMockSession } from "./test-utils";

describe("Registration consistency", () => {
  const userIds: string[] = [];
  const eventIds: string[] = [];
  beforeAll(async () => {
    for (const role of ["admin", "member", "member", "member"]) userIds.push(await createTestUser(role));
  });
  afterAll(async () => {
    if (eventIds.length) {
      await db.delete(tasks).where(inArray(tasks.eventId, eventIds));
      await db.delete(registrations).where(inArray(registrations.eventId, eventIds));
      await db.delete(events).where(inArray(events.id, eventIds));
    }
    for (const id of userIds) await cleanupTestUser(id);
  });
  async function makeEvent() {
    const admin = getMockSession(userIds[0], "admin");
    const result = await createEvent(admin, {
      title: "Registration consistency test", slug: `consistency-${crypto.randomUUID()}`, type: "workshop",
      description: "Local database regression fixture", startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 90000000).toISOString(), capacity: 1, isPaid: false, price: 0,
      forms: [], visibility: "public",
    });
    const id = result.id as string;
    eventIds.push(id);
    await approveEvent(admin, id);
    return id;
  }
  const session = (index: number) => getMockSession(userIds[index], "member");

  it("gives a cancelled seat to the existing waitlist during a concurrent signup", async () => {
    const id = await makeEvent();
    await registerForEvent(session(1), id, {});
    await registerForEvent(session(2), id, {});
    await Promise.all([deregisterEvent(session(1), id), registerForEvent(session(3), id, {})]);
    const saved = await db.select().from(registrations).where(eq(registrations.eventId, id));
    expect(saved.filter((row) => row.status === "confirmed")).toHaveLength(1);
    expect(saved.find((row) => row.userId === userIds[2])?.status).toBe("confirmed");
    expect(saved.find((row) => row.userId === userIds[3])?.status).toBe("waitlist");
    const promoted = saved.find((row) => row.userId === userIds[2])!;
    const history = await db.select().from(auditLogs).where(and(eq(auditLogs.entityId, promoted.id), eq(auditLogs.action, "waitlist_promotion")));
    expect(history).toHaveLength(1);
    expect(history[0].actorId).toBe(userIds[1]);
  });

  it("retries cancellation without promoting two attendees", async () => {
    const id = await makeEvent();
    await registerForEvent(session(1), id, {});
    await registerForEvent(session(2), id, {});
    await registerForEvent(session(3), id, {});
    const results = await Promise.all([deregisterEvent(session(1), id), deregisterEvent(session(1), id)]);
    expect(results.every((result) => result.success)).toBe(true);
    const saved = await db.select().from(registrations).where(eq(registrations.eventId, id));
    expect(saved.filter((row) => row.status === "confirmed")).toHaveLength(1);
    expect(saved.filter((row) => row.status === "waitlist")).toHaveLength(1);
  });

  it("counts checked-in attendees towards capacity and prevents cancelling attendance", async () => {
    const id = await makeEvent();
    await registerForEvent(session(1), id, {});
    await db.update(registrations).set({ status: "checked_in", checkedInAt: new Date() })
      .where(and(eq(registrations.eventId, id), eq(registrations.userId, userIds[1])));
    await expect(registerForEvent(session(2), id, {})).resolves.toMatchObject({ status: "waitlist" });
    await expect(deregisterEvent(session(1), id)).rejects.toThrow("already checked in");
  });

  it("requires verified email and keeps internal events restricted to members", async () => {
    const id = await makeEvent();
    const unverified = session(1);
    unverified.user.emailVerified = false;
    await expect(registerForEvent(unverified, id, {})).rejects.toThrow("Verify your email");
    await db.update(events).set({ isInternal: true }).where(eq(events.id, id));
    const outsider = getMockSession(userIds[2], "outsider");
    await expect(registerForEvent(outsider, id, {})).resolves.toMatchObject({ status: 403 });
    expect(await db.select().from(registrations).where(eq(registrations.eventId, id))).toHaveLength(0);
  });
});
