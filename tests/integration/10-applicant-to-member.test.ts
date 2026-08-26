/**
 * 10-applicant-to-member.test.ts
 *
 * Integration tests for the full applicant→member workflow (Workflow 1 from doc 06).
 *
 * Tests isolated via unique IDs per test run. All data cleaned up in afterAll.
 * Uses real DB (no Drizzle mocks).
 *
 * Covers:
 *   - Application submission (idempotent upsert)
 *   - Duplicate submission within cycle rejected gracefully
 *   - State machine: cannot skip interviewing state to get accepted
 *   - State machine: cannot accept from applied (must go through interviewing)
 *   - Atomic approval: user.role becomes "member" if and only if application is accepted
 *   - Interview scheduling
 *   - Review notes
 *   - RBAC: member cannot update application status
 *   - RBAC: co_lead cannot accept (final acceptance requires lead+)
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { applications, user, interviews, applicationReviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  submitApplication,
  updateApplicationStatus,
  scheduleInterview,
  addApplicationReview,
} from "@/lib/services/applications";
import { AuthorizationError } from "@/lib/dal/auth";

// Suppress queue side-effects during tests
vi.mock("@/lib/queues/email", () => ({
  getEmailQueue: () => ({ add: vi.fn().mockResolvedValue(undefined), addBulk: vi.fn() }),
}));
vi.mock("@/lib/queues/grading", () => ({
  getGradingQueue: () => ({ add: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@/lib/services/notifications", () => ({
  NotificationService: { sendInAppNotification: vi.fn().mockResolvedValue(undefined) },
}));

const TEST_CYCLE = `test-cycle-${Math.random().toString(36).substring(7)}`;

describe("Workflow 1: Applicant → Member", () => {
  let adminId: string;
  let leadId: string;
  let coLeadId: string;
  let memberId: string;
  let applicantId: string;
  let applicationId: string;

  beforeAll(async () => {
    adminId    = await createTestUser("admin");
    leadId     = await createTestUser("lead");
    coLeadId   = await createTestUser("co_lead");
    memberId   = await createTestUser("member");
    applicantId = await createTestUser("applicant");
  });

  afterAll(async () => {
    // Clean up in reverse dependency order
    await db.delete(applicationReviews).where(
      eq(applicationReviews.applicationId, applicationId ?? "nonexistent")
    );
    await db.delete(interviews).where(
      eq(interviews.applicantId, applicationId ?? "nonexistent")
    );
    await db
      .delete(applications)
      .where(and(
        eq(applications.applicationCycle, TEST_CYCLE),
        eq(applications.userId, applicantId)
      ));
    await cleanupTestUser(adminId);
    await cleanupTestUser(leadId);
    await cleanupTestUser(coLeadId);
    await cleanupTestUser(memberId);
    await cleanupTestUser(applicantId);
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it("1.1 applicant can submit an application", async () => {
    const session = getMockSession(applicantId, "applicant");
    const result = await submitApplication(session, {
      applicationCycle: TEST_CYCLE,
      answers: { why: "I love tech" },
      whyJoin: "I want to build cool things with the club community here.",
      skills: ["typescript", "react"],
      isDraft: false,
    });
    expect(result.success).toBe(true);
    expect(result.applicationId).toBeDefined();
    applicationId = result.applicationId;

    const saved = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });
    expect(saved?.status).toBe("applied");
    expect(saved?.userId).toBe(applicantId);
  });

  it("1.2 submitting again for same cycle is idempotent (upsert, not duplicate)", async () => {
    const session = getMockSession(applicantId, "applicant");
    const result = await submitApplication(session, {
      applicationCycle: TEST_CYCLE,
      answers: { why: "Updated answer" },
      whyJoin: "Updated reason with more than 20 characters for validation.",
      isDraft: false,
    });
    // Should return the same applicationId
    expect(result.applicationId).toBe(applicationId);

    // Only one record should exist for this user/cycle
    const allApps = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, applicantId),
          eq(applications.applicationCycle, TEST_CYCLE)
        )
      );
    expect(allApps).toHaveLength(1);
  });

  it("1.3 member cannot update application status", async () => {
    const memberSession = getMockSession(memberId, "member");
    await expect(
      updateApplicationStatus(memberSession, applicationId, {
        status: "ai_graded",
      })
    ).rejects.toThrow("Only leads and above may update application status");
  });

  it("1.4 cannot skip directly from applied to accepted (state machine guard)", async () => {
    const leadSession = getMockSession(leadId, "lead");
    await expect(
      updateApplicationStatus(leadSession, applicationId, {
        status: "accepted",
      })
    ).rejects.toThrow("Cannot transition application from 'applied' to 'accepted'");
  });

  it("1.5 lead can advance to ai_graded", async () => {
    const leadSession = getMockSession(leadId, "lead");
    const result = await updateApplicationStatus(leadSession, applicationId, {
      status: "ai_graded",
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("ai_graded");
  });

  it("1.6 lead can advance to interviewing", async () => {
    const leadSession = getMockSession(leadId, "lead");
    const result = await updateApplicationStatus(leadSession, applicationId, {
      status: "interviewing",
    });
    expect(result.success).toBe(true);
    const saved = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });
    expect(saved?.status).toBe("interviewing");
  });

  it("1.7 co_lead cannot accept an application (requires lead+)", async () => {
    const coLeadSession = getMockSession(coLeadId, "co_lead");
    await expect(
      updateApplicationStatus(coLeadSession, applicationId, {
        status: "accepted",
      })
    ).rejects.toThrow("Only leads and admins may accept applications");
  });

  it("1.8 lead can schedule an interview", async () => {
    const leadSession = getMockSession(leadId, "lead");
    const result = await scheduleInterview(leadSession, {
      applicationId,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      interviewerId: leadId,
      meetingLink: "https://meet.google.com/test-link",
    });
    expect(result.success).toBe(true);
    expect(result.interviewId).toBeDefined();

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.applicantId, applicationId),
    });
    expect(interview).toBeDefined();
    expect(interview?.interviewerId).toBe(leadId);
  });

  it("1.9 lead can add a review note", async () => {
    const leadSession = getMockSession(leadId, "lead");
    const result = await addApplicationReview(leadSession, applicationId, {
      action: "approved",
      reasonCode: "strong-candidate",
      reasonNote: "Excellent technical skills demonstrated in application.",
    });
    expect(result.success).toBe(true);
    expect(result.reviewId).toBeDefined();
  });

  it("1.10 ATOMIC APPROVAL: accepting application also sets user.role='member'", async () => {
    const adminSession = getMockSession(adminId, "admin");

    // Verify current role is applicant
    const [before] = await db.select({ role: user.role }).from(user).where(eq(user.id, applicantId));
    expect(before.role).toBe("applicant");

    const result = await updateApplicationStatus(adminSession, applicationId, {
      status: "accepted",
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("accepted");

    // Both application and user must be updated atomically
    const [appAfter] = await db.select({ status: applications.status }).from(applications).where(eq(applications.id, applicationId));
    const [userAfter] = await db.select({ role: user.role }).from(user).where(eq(user.id, applicantId));

    expect(appAfter.status).toBe("accepted");
    expect(userAfter.role).toBe("member"); // Role upgrade happened atomically
  });

  it("1.11 cannot modify an accepted application", async () => {
    const adminSession = getMockSession(adminId, "admin");
    await expect(
      submitApplication(getMockSession(applicantId, "member"), {
        applicationCycle: TEST_CYCLE,
        answers: { why: "Trying to re-submit after acceptance" },
        whyJoin: "Attempting to modify accepted application state.",
        isDraft: false,
      })
    ).rejects.toThrow("Cannot modify a accepted application");
  });
});
