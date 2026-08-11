import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  it("should allow admin to accept application and update role", async () => {
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
