import { afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationDocuments, collegeIdentities, user } from "@/lib/db/schema";
import { createTestUser, cleanupTestUser, getMockSession } from "./test-utils";

const { activeSession } = vi.hoisted(() => ({ activeSession: { current: null as any } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => activeSession.current } } }));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "127.0.0.1", checkRateLimit: async () => ({ success: true }) }));
vi.mock("@/lib/services/storage", () => ({ getStorageService: () => ({ deleteFile: async () => {} }) }));

describe("Enrollment data deletion", () => {
  let id: string;
  afterAll(async () => { if (id) await cleanupTestUser(id); });
  it("erases college identity and unsubmitted CVs and allows an approved username to be anonymized", async () => {
    id = await createTestUser("member");
    const handle = `erase_${crypto.randomUUID().slice(0, 8)}`;
    await db.update(user).set({ username: handle, usernameLower: handle, requestedUsername: "old_request" }).where(eq(user.id, id));
    await db.insert(collegeIdentities).values({ userId: id, collegeEmail: `${id}@goa.paruluniversity.ac.in`, verifiedAt: new Date(), enrollmentNumber: "TEST-1234", collegeName: "Test college" });
    const pdf = Buffer.from("%PDF-1.4\n%%EOF");
    await db.insert(applicationDocuments).values({ userId: id, cycle: "deletion-test", name: "resume.pdf", size: pdf.length, content: pdf.toString("base64") });
    activeSession.current = getMockSession(id, "member");
    const { DELETE } = await import("@/app/api/compliance/delete/route");
    const response = await DELETE(new NextRequest("http://localhost/api/compliance/delete", { method: "DELETE" }), {});
    expect(response.status, await response.text()).toBe(200);
    expect(await db.select().from(collegeIdentities).where(eq(collegeIdentities.userId, id))).toHaveLength(0);
    expect(await db.select().from(applicationDocuments).where(eq(applicationDocuments.userId, id))).toHaveLength(0);
    const [account] = await db.select().from(user).where(eq(user.id, id));
    expect(account).toMatchObject({ username: null, usernameLower: null, requestedUsername: null, banned: true });
    expect(account.deletedAt).not.toBeNull();
  });
});
