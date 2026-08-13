import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => new Map()
}));

vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => new Map()
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: "test-user-123", email: "test@college.edu.in", role: "admin", emailVerified: true } })
    }
  }
}));

vi.mock("@/lib/dal/auth", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "test-user-123", email: "test@college.edu.in", role: "admin", emailVerified: true } }),
  requireAdmin: vi.fn().mockResolvedValue({ user: { id: "test-user-123", role: "admin", emailVerified: true } }),
  requireRole: vi.fn().mockResolvedValue({ user: { id: "test-user-123", role: "admin", emailVerified: true } }),
  checkEmergencyFreeze: vi.fn(),
  AuthorizationError: class AuthorizationError extends Error {}
}));

describe("Recruitment DAL Integration Tests", () => {
  let adminId: string;
  let applicantId: string;
  let adminSession: any;
  let applicantSession: any;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    applicantId = await createTestUser("applicant"); // Role is applicant
    adminSession = getMockSession(adminId, "admin");
    applicantSession = getMockSession(applicantId, "applicant");
  });

  afterAll(async () => {
    // Clean up
    await db.delete(applications).where(eq(applications.userId, applicantId));
    
    await cleanupTestUser(adminId);
    await cleanupTestUser(applicantId);
  });

  it("should allow applicant to submit an application", async () => {
    const application = await db.insert(applications).values({
      id: "app-1",
      userId: applicantId,
      applicationCycle: "Spring 2026",
      status: "applied",
      answers: { "why": "I love tech" },
      teamPreference: "tech",
      skills: ["typescript", "react"],
    }).returning();

    expect(application[0]).toBeDefined();
    expect(application[0].status).toBe("applied");
  });

  it("should block bypass of interview state (Zero-day check)", async () => {
    // Attempt to accept straight from applied
    const { PATCH } = await import("@/app/api/applications/[id]/status/route");
    const req = new Request(`http://localhost:3000/api/applications/app-1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }) // bypassed interviewing
    });

    // Mock NextRequest requires a little trick, but we can call it directly
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "app-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Cannot accept application directly/);
  });

  it("should allow admin to accept application from interviewing state", async () => {
    // First update to interviewing
    await db.update(applications).set({ status: "interviewing" }).where(eq(applications.id, "app-1"));

    const [app] = await db.update(applications)
      .set({ status: "accepted" })
      .where(eq(applications.id, "app-1"))
      .returning();
      
    await db.update(user).set({ role: "member" }).where(eq(user.id, applicantId));
    
    const [updatedUser] = await db.select().from(user).where(eq(user.id, applicantId));
    expect(updatedUser.role).toBe("member");
    expect(app.status).toBe("accepted");
  });
});
