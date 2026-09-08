import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { applications, applicationReviews, user } from "@/lib/db/schema";
import { createTestUser, cleanupTestUser, getMockSession } from "./test-utils";

const { activeSession } = vi.hoisted(() => ({ activeSession: { current: null as any } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => activeSession.current } } }));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "127.0.0.1", checkRateLimit: async () => ({ success: true }) }));

describe("Recruitment status API", () => {
  let adminId: string;
  let applicantId: string;
  const applicationId = crypto.randomUUID();

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    applicantId = await createTestUser("applicant");
    activeSession.current = getMockSession(adminId, "admin");
    // Only the starting fixture is inserted directly; all transitions use the API.
    await db.insert(applications).values({
      id: applicationId, userId: applicantId, applicationCycle: "recruitment-api-test",
      status: "applied", answers: { why: "I love tech" }, teamPreference: "tech", skills: ["typescript"],
    });
  });
  afterAll(async () => {
    await db.delete(applicationReviews).where(eq(applicationReviews.applicationId, applicationId));
    await db.delete(applications).where(eq(applications.id, applicationId));
    await cleanupTestUser(adminId);
    await cleanupTestUser(applicantId);
  });
  async function changeStatus(status: string) {
    const { PATCH } = await import("@/app/api/applications/[id]/status/route");
    return PATCH(new NextRequest(`http://localhost:3000/api/applications/${applicationId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    }), { params: Promise.resolve({ id: applicationId }) });
  }
  it("explains an invalid transition and leaves the applicant unchanged", async () => {
    const response = await changeStatus("accepted");
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Cannot transition");
    expect((await db.query.applications.findFirst({ where: eq(applications.id, applicationId) }))?.status).toBe("applied");
    expect((await db.query.user.findFirst({ where: eq(user.id, applicantId) }))?.role).toBe("applicant");
  });
  it("accepts through the real review flow and saves membership and review together", async () => {
    // A human reviewer can take the application through manual review.
    expect((await changeStatus("needs_manual_review")).status).toBe(200);
    expect((await changeStatus("interviewing")).status).toBe(200);
    expect((await changeStatus("accepted")).status).toBe(200);
    expect((await db.query.applications.findFirst({ where: eq(applications.id, applicationId) }))?.status).toBe("accepted");
    expect((await db.query.user.findFirst({ where: eq(user.id, applicantId) }))?.role).toBe("member");
    expect(await db.select().from(applicationReviews).where(eq(applicationReviews.applicationId, applicationId))).toHaveLength(1);
  });
  it("rejects applicant access at the API boundary", async () => {
    activeSession.current = getMockSession(applicantId, "applicant");
    expect((await changeStatus("interviewing")).status).toBe(403);
  });
});
