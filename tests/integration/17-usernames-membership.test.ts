import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { createTestUser, cleanupTestUser, getMockSession } from "./test-utils";
const { activeSession } = vi.hoisted(() => ({ activeSession: { current: null as any } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => activeSession.current } } }));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "127.0.0.1", checkRateLimit: async () => ({ success: true }) }));
describe("Username and membership boundaries", () => {
  const ids: string[] = [];
  const handle = "privacy_" + Math.random().toString(36).slice(2, 9);
  beforeAll(async () => { for (const role of ["member", "outsider", "outsider", "admin"]) ids.push(await createTestUser(role)); });
  afterAll(async () => { for (const id of ids) await cleanupTestUser(id); });
  it("allows anonymous availability checks without exposing identities", async () => {
    activeSession.current = null;
    const { GET } = await import("@/app/api/username/check/route");
    const response = await GET(new NextRequest(`http://localhost/api/username/check?u=${handle}`), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ available: true, message: expect.any(String) });
  });
  it("atomically claims one normalized handle even when two accounts race", async () => {
    const { saveUsername } = await import("@/lib/services/usernames");
    const results = await Promise.allSettled([saveUsername(ids[0], handle.toUpperCase()), saveUsername(ids[1], handle)]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const [owner] = await db.select().from(user).where(eq(user.username, handle));
    expect(owner.usernameLower).toBe(handle);
    await db.update(user).set({ role: "member" }).where(eq(user.id, owner.id));
  });
  it("rejects malformed input and direct edit attempts during the cooldown", async () => {
    const [owner] = await db.select().from(user).where(eq(user.username, handle));
    const { saveUsername } = await import("@/lib/services/usernames");
    await expect(saveUsername(owner.id, { username: "object" })).rejects.toThrow("3–20");
    await expect(saveUsername(owner.id, handle + "x")).rejects.toThrow("30 days");
  });
  it("includes usernames only for approved member viewers, using the current database role", async () => {
    const { GET } = await import("@/app/api/members/directory/route");
    // A stale member cookie must not grant username access to a participant.
    activeSession.current = getMockSession(ids[2], "member");
    let response = await GET(new NextRequest("http://localhost/api/members/directory?limit=100"), {});
    let body = await response.json();
    expect(body.members.length).toBeGreaterThan(0);
    expect(body.members.every((member: object) => !("username" in member))).toBe(true);
    await db.update(user).set({ role: "member" }).where(eq(user.id, ids[2]));
    response = await GET(new NextRequest("http://localhost/api/members/directory?limit=100"), {});
    body = await response.json();
    expect(body.members.some((member: { username?: string }) => member.username === handle)).toBe(true);
  });
  it("persists welcome dismissal and denies it to a participant", async () => {
    const { POST } = await import("@/app/api/users/me/membership-welcome/route");
    activeSession.current = getMockSession(ids[2], "member");
    const request = () => new NextRequest("http://localhost/api/users/me/membership-welcome", { method: "POST" });
    expect((await POST(request(), {})).status).toBe(200);
    const [account] = await db.select().from(user).where(eq(user.id, ids[2]));
    expect(account.membershipWelcomeSeen).toBe(true);
    await db.update(user).set({ role: "outsider" }).where(eq(user.id, ids[2]));
    expect((await POST(request(), {})).status).toBe(403);
  });
  it("permits direct admin approval and resets the welcome for a newly approved account", async () => {
    const { POST } = await import("@/app/api/onboarding/approve/route");
    const request = () => new NextRequest("http://localhost/api/onboarding/approve", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: ids[2], approve: true }),
    });
    activeSession.current = getMockSession(ids[2], "outsider");
    expect((await POST(request(), {})).status).toBe(403);
    activeSession.current = getMockSession(ids[3], "admin");
    expect((await POST(request(), {})).status).toBe(200);
    const [account] = await db.select().from(user).where(eq(user.id, ids[2]));
    expect(account.role).toBe("member");
    expect(account.membershipWelcomeSeen).toBe(false);
  });
});
