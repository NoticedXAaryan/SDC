import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { events, registrations, tasks, certificates, certTemplates, clubSettings } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";
import { createEvent, approveEvent } from "@/lib/dal/events.core";
import { registerForEvent } from "@/lib/dal/events.registration";
import { ScannerService } from "@/lib/services/scanner";
import { CertificateService } from "@/lib/services/certificates";

describe("Certificates Integration Tests", () => {
  let adminId: string;
  let memberId: string;
  let adminSession: any;
  let memberSession: any;
  let eventId: string;
  let templateId: string;
  let memberPassToken: string;

  beforeAll(async () => {
    // Unfreeze club just in case
    await db.update(clubSettings).set({ isFrozen: false });

    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");

    // Create event
    const payload = {
      title: "Certificate Test Event",
      slug: "cert-test-event",
      type: "workshop",
      description: "Test event for certs",
      startsAt: new Date(Date.now() - 3600000).toISOString(),
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

    // Create template
    const [template] = await db.insert(certTemplates).values({
      name: "Test Template",
      eventId: eventId,
      backgroundUrl: "https://pdfme.com/blank.pdf",
      fields: [],
      createdBy: adminId
    }).returning();
    templateId = template.id;

    // Link template to event
    await db.update(events).set({ certificateTemplateId: templateId }).where(eq(events.id, eventId));

    // Register and check-in member
    const regRes = await registerForEvent(memberSession, eventId, { answers: {} });
    memberPassToken = regRes.passToken as string;
    await ScannerService.checkInScanner(adminSession, eventId, memberPassToken);
  });

  afterAll(async () => {
    await db.delete(tasks).where(eq(tasks.eventId, eventId));
    await db.delete(certificates).where(eq(certificates.eventId, eventId));
    await db.delete(certTemplates).where(eq(certTemplates.id, templateId));
    await db.delete(registrations).where(eq(registrations.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));

    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
  });

  it("6.4 should queue certificates for all checked-in attendees", async () => {
    const res = await CertificateService.issueCertificatesForEvent(adminSession, eventId);
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
  });

  it("6.4b should queue adhoc certificates", async () => {
    const res = await CertificateService.issueAdhocCertificates(adminSession, templateId, [memberId], eventId);
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
  });
});
