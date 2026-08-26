import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { procurementRequests, vendors, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { createProcurementRequest, updateProcurementStatus } from "@/lib/dal/procurement";

describe("Procurement DAL Integration Tests & Security Audit", () => {
  let adminId: string;
  let memberId: string;
  let financeLeadId: string;
  
  let adminSession: any;
  let memberSession: any;
  let financeLeadSession: any;
  
  let eventId: string;
  let vendorId: string;
  let procurementId: string;
  
  beforeAll(async () => {
    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    financeLeadId = await createTestUser("finance_lead");
    
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");
    financeLeadSession = getMockSession(financeLeadId, "finance_lead");

    eventId = "test-event-proc-" + Math.random().toString(36).substring(7);
    await db.insert(events).values({
      id: eventId,
      title: "Procurement Test Event",
      slug: "proc-test-event-" + Math.random().toString(36).substring(7),
      createdBy: adminId,
      startsAt: new Date(),
    });

    vendorId = crypto.randomUUID();
    await db.insert(vendors).values({
      id: vendorId,
      name: "Acme Corp",
      category: "electronics"
    });
  });

  afterAll(async () => {
    if (procurementId) {
      await db.delete(procurementRequests).where(eq(procurementRequests.id, procurementId));
    }
    await db.delete(vendors).where(eq(vendors.id, vendorId));
    await db.delete(events).where(eq(events.id, eventId));
    
    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
    await cleanupTestUser(financeLeadId);
  });

  it("should allow lead to create a procurement request", async () => {
    const data = await createProcurementRequest(financeLeadSession, {
      title: "Buy Monitors",
      description: "Need 2 new monitors for the event",
      eventId,
      estimatedCost: 500,
    });
    
    expect(data.id).toBeDefined();
    expect(data.status).toBe("draft");
    procurementId = data.id;
  });

  it("should block self-approval of procurement (IDOR)", async () => {
    await updateProcurementStatus(financeLeadSession, procurementId, {
      status: "pending_quotes",
    });
    await updateProcurementStatus(financeLeadSession, procurementId, {
      status: "approval",
    });

    await expect(
      updateProcurementStatus(financeLeadSession, procurementId, {
        status: "approved",
      })
    ).rejects.toThrow("You cannot approve your own procurement request.");
  });

  it("should allow another admin to approve it", async () => {
    const data = await updateProcurementStatus(adminSession, procurementId, {
      status: "approved",
      selectedVendorId: vendorId
    });
    
    expect(data.success).toBe(true);

    const check = await db.query.procurementRequests.findFirst({
      where: eq(procurementRequests.id, procurementId)
    });
    expect(check?.status).toBe("approved");
    expect(check?.selectedVendorId).toBe(vendorId);
  });
});
