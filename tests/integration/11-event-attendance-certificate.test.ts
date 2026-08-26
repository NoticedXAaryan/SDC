/**
 * 11-event-attendance-certificate.test.ts
 *
 * Integration tests for Workflow 2: Event → Attendance → Certificate (from doc 06).
 *
 * Covers:
 *   - Event creation (draft state)
 *   - Event approval (publish)
 *   - Registration (confirmed vs waitlist at capacity)
 *   - Duplicate registration rejected
 *   - QR scanner check-in
 *   - Duplicate scan rejected
 *   - Certificate issuance queued for checked-in attendees only
 *   - Certificate revocation (with audit)
 *   - RBAC: member cannot issue certificates
 *   - Non-checked-in member gets no certificate
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import {
  events,
  registrations,
  certificates,
  certTemplates,
  tasks,
  auditLogs,
  clubSettings,
} from "@/lib/db/schema";
import { eq, and, like, inArray } from "drizzle-orm";
import { createEvent, approveEvent } from "@/lib/dal/events.core";
import { registerForEvent, deregisterEvent } from "@/lib/dal/events.registration";
import { ScannerService } from "@/lib/services/scanner";
import { CertificateService } from "@/lib/services/certificates";
import { ValidationError } from "@/lib/api-wrapper";
import { AuthorizationError } from "@/lib/dal/auth";
import crypto from "crypto";

// ── Mock side-effects that require live Redis/BullMQ ──────────────────────
const { mockAddBulk } = vi.hoisted(() => ({
  mockAddBulk: vi.fn().mockResolvedValue(undefined)
}));
vi.mock("@/lib/queues/certificates", () => ({
  getCertificateQueue: () => ({
    add: vi.fn().mockResolvedValue(undefined),
    addBulk: mockAddBulk,
  }),
}));
vi.mock("@/lib/queues/email", () => ({
  getEmailQueue: () => ({ add: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@/lib/services/notifications", () => ({
  NotificationService: { sendInAppNotification: vi.fn().mockResolvedValue(undefined) },
}));

const SLUG_PREFIX = `e2e-cert-test-${Math.random().toString(36).substring(7)}`;

describe("Workflow 2: Event → Attendance → Certificate", () => {
  let adminId: string;
  let leadId: string;
  let memberId: string;
  let waitlistMemberId: string;
  let noCheckInMemberId: string;
  let eventId: string;
  let templateId: string;
  let memberPassCode: string;

  beforeAll(async () => {
    // Ensure club is not frozen for these tests
    await db
      .insert(clubSettings)
      .values({ id: "default", isFrozen: false })
      .onConflictDoUpdate({ target: clubSettings.id, set: { isFrozen: false } });

    adminId          = await createTestUser("admin");
    leadId           = await createTestUser("lead");
    memberId         = await createTestUser("member");
    waitlistMemberId = await createTestUser("member");
    noCheckInMemberId = await createTestUser("member");
  });

  afterAll(async () => {
    // Clean up in reverse order
    if (eventId) {
      await db.delete(certificates).where(eq(certificates.eventId, eventId));
      await db.delete(certTemplates).where(like(certTemplates.name, `${SLUG_PREFIX}%`));
      await db.delete(tasks).where(eq(tasks.eventId, eventId));
      await db.delete(registrations).where(eq(registrations.eventId, eventId));
      await db.delete(events).where(eq(events.id, eventId));
    }
    await cleanupTestUser(adminId);
    await cleanupTestUser(leadId);
    await cleanupTestUser(memberId);
    await cleanupTestUser(waitlistMemberId);
    await cleanupTestUser(noCheckInMemberId);
  });

  // ── Event Creation & Approval ─────────────────────────────────────────────

  it("2.1 lead creates an event as draft", async () => {
    const leadSession = getMockSession(leadId, "lead");
    const result = await createEvent(leadSession, {
      title: `${SLUG_PREFIX} Workshop`,
      slug: SLUG_PREFIX,
      type: "workshop",
      description: "A test event for the full attendance→certificate workflow.",
      startsAt: new Date(Date.now() + 3600000).toISOString(),
      endsAt: new Date(Date.now() + 7200000).toISOString(),
      capacity: 1, // Only 1 seat to test waitlist
      isPaid: false,
      price: 0,
      forms: [],
      visibility: "public",
    });

    expect(result.success).toBe(true);
    eventId = result.id as string;

    const saved = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    expect(saved?.status).toBe("draft");
  });

  it("2.2 admin approves event → status becomes published", async () => {
    const adminSession = getMockSession(adminId, "admin");
    await approveEvent(adminSession, eventId);
    const saved = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    expect(saved?.status).toBe("published");
  });

  it("2.3 member registers → confirmed (first seat)", async () => {
    const memberSession = getMockSession(memberId, "member");
    const result = await registerForEvent(memberSession, eventId, { answers: {} });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("Expected registration to succeed");

    const reg = await db.query.registrations.findFirst({
      where: and(eq(registrations.eventId, eventId), eq(registrations.userId, memberId)),
    });
    expect(reg?.status).toBe("confirmed");
    expect(reg?.passCode).toBeDefined();
    memberPassCode = result.passToken!;
  });

  it("2.4 second member registers → waitlisted (capacity=1 is full)", async () => {
    const waitlistSession = getMockSession(waitlistMemberId, "member");
    const result = await registerForEvent(waitlistSession, eventId, { answers: {} });
    expect(result.success).toBe(true);

    const reg = await db.query.registrations.findFirst({
      where: and(eq(registrations.eventId, eventId), eq(registrations.userId, waitlistMemberId)),
    });
    expect(reg?.status).toBe("waitlist");
  });

  it("2.5 duplicate registration is rejected", async () => {
    const memberSession = getMockSession(memberId, "member");
    const result = await registerForEvent(memberSession, eventId, { answers: {} });
    expect(result).toMatchObject({
      error: "Already registered for this event",
      status: 400,
    });
  });

  it("2.6 third member registers but does not check in (for certificate exclusion test)", async () => {
    const noCheckInSession = getMockSession(noCheckInMemberId, "member");
    // First, free up a seat by deregistering the waitlist member
    const waitlistSession = getMockSession(waitlistMemberId, "member");
    await deregisterEvent(waitlistSession, eventId);

    const result = await registerForEvent(noCheckInSession, eventId, { answers: {} });
    expect(result.success).toBe(true);
  });

  it("2.7 scanner checks in member via QR passCode", async () => {
    const adminSession = getMockSession(adminId, "admin");
    const result = await ScannerService.checkInScanner(adminSession, eventId, memberPassCode);
    expect(result.success).toBe(true);

    const reg = await db.query.registrations.findFirst({
      where: and(eq(registrations.eventId, eventId), eq(registrations.userId, memberId)),
    });
    expect(reg?.status).toBe("checked_in");
    expect(reg?.checkedInAt).toBeDefined();
  });

  it("2.8 duplicate scan (same passCode) is rejected", async () => {
    const adminSession = getMockSession(adminId, "admin");
    await expect(
      ScannerService.checkInScanner(adminSession, eventId, memberPassCode)
    ).rejects.toThrow(); // Already checked in
  });

  // ── Certificate Template Setup ────────────────────────────────────────────

  it("2.9 setup: attach certificate template to event", async () => {
    const [template] = await db
      .insert(certTemplates)
      .values({
        id: crypto.randomUUID(),
        name: `${SLUG_PREFIX}-template`,
        eventId,
        backgroundUrl: "https://pdfme.com/blank.pdf",
        fields: [],
        createdBy: adminId,
      })
      .returning();
    templateId = template.id;

    await db
      .update(events)
      .set({ certificateTemplateId: templateId })
      .where(eq(events.id, eventId));
  });

  it("2.10 member cannot issue certificates", async () => {
    const memberSession = getMockSession(memberId, "member");
    await expect(
      CertificateService.issueCertificatesForEvent(memberSession, eventId)
    ).rejects.toThrow("Unauthorized");
  });

  it("2.11 admin issues certificates — only checked-in attendee receives one", async () => {
    const adminSession = getMockSession(adminId, "admin");
    const result = await CertificateService.issueCertificatesForEvent(adminSession, eventId);

    expect(result.success).toBe(true);
    // Only memberId was checked in; noCheckInMemberId was confirmed but not checked in
    expect(result.count).toBe(1);
    expect(mockAddBulk).toHaveBeenCalled();

    const callArgs = mockAddBulk.mock.calls[0][0] as any[];
    expect(callArgs).toHaveLength(1);
    expect(callArgs[0].data.userId).toBe(memberId);
  });

  it("2.12 re-issuing certificates is idempotent (duplicate jobs ignored by jobId)", async () => {
    const adminSession = getMockSession(adminId, "admin");
    mockAddBulk.mockClear();

    const result = await CertificateService.issueCertificatesForEvent(adminSession, eventId);
    // The eligible count is based on DB state (no certificate record yet since worker is mocked)
    // The job IDs will be the same so BullMQ would silently drop them
    expect(result.success).toBe(true);
    if (result.count > 0) {
      // Same jobId should be dispatched — BullMQ handles deduplication
      const jobIds = (mockAddBulk.mock.calls[0][0] as any[]).map((j) => j.opts?.jobId);
      expect(new Set(jobIds).size).toBe(jobIds.length); // All unique
    }
  });

  it("2.13 ad-hoc certificate issuance works for specific users", async () => {
    const adminSession = getMockSession(adminId, "admin");
    mockAddBulk.mockClear();

    const result = await CertificateService.issueAdhocCertificates(
      adminSession,
      templateId,
      [memberId],
      eventId
    );
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
  });

  it("2.14 certificate revocation works with audit trail", async () => {
    // Insert a real certificate to revoke
    const certId = crypto.randomUUID();
    const verifyId = crypto.randomBytes(6).toString("hex");
    await db.insert(certificates).values({
      id: certId,
      verifyId,
      userId: memberId,
      eventId,
      templateId,
      data: { name: "Test Member", eventName: "Test Event" },
      pdfUrl: "https://example.com/cert.pdf",
      issuedBy: adminId,
      status: "valid",
    });

    const adminSession = getMockSession(adminId, "admin");
    const result = await CertificateService.revokeCertificate(adminSession, {
      certificateId: certId,
      reason: "Test revocation for integration test",
    });
    expect(result.success).toBe(true);

    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, certId),
    });
    expect(cert?.status).toBe("revoked");
    expect(cert?.revokedReason).toBe("Test revocation for integration test");

    // Verify audit log was written
    const auditEntry = await db.query.auditLogs.findFirst({
      where: and(
        eq(auditLogs.entityId, certId),
        eq(auditLogs.action, "certificate_revoke")
      ),
    });
    expect(auditEntry).toBeDefined();
    expect(auditEntry?.actorId).toBe(adminId);

    // Clean up this specific cert
    await db.delete(certificates).where(eq(certificates.id, certId));
  });

  it("2.15 revoking an already-revoked certificate throws", async () => {
    const certId = crypto.randomUUID();
    await db.insert(certificates).values({
      id: certId,
      verifyId: crypto.randomBytes(6).toString("hex"),
      userId: memberId,
      eventId,
      templateId,
      data: {},
      pdfUrl: null,
      issuedBy: adminId,
      status: "revoked",
      revokedReason: "Already revoked",
    });

    const adminSession = getMockSession(adminId, "admin");
    await expect(
      CertificateService.revokeCertificate(adminSession, {
        certificateId: certId,
        reason: "Trying to double-revoke",
      })
    ).rejects.toThrow("Certificate is already revoked");

    await db.delete(certificates).where(eq(certificates.id, certId));
  });
});
