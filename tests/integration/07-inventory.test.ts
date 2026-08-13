import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { inventory, inventoryLogs, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logInventoryActionDb } from "@/lib/dal/inventory";

describe("Inventory DAL Integration Tests & Security Audit", () => {
  let adminId: string;
  let memberId: string;
  let adminSession: any;
  let memberSession: any;
  let eventId: string;
  let itemId: string;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");

    eventId = "test-event-inventory-" + Math.random().toString(36).substring(7);
    await db.insert(events).values({
      id: eventId,
      title: "Inventory Test Event",
      slug: "inv-test-event-" + Math.random().toString(36).substring(7),
      createdBy: adminId,
      startsAt: new Date(),
    });

    itemId = "test-item-" + Math.random().toString(36).substring(7);
    await db.insert(inventory).values({
      id: itemId,
      name: "High-End DSLR Camera",
      qtyTotal: 5,
      qtyAvailable: 5,
    });
  });

  afterAll(async () => {
    await db.delete(inventoryLogs).where(eq(inventoryLogs.itemId, itemId));
    await db.delete(inventory).where(eq(inventory.id, itemId));
    await db.delete(events).where(eq(events.id, eventId));
    
    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
  });

  it("should block a member from checking out items (IDOR/RBAC check)", async () => {
    await expect(
      logInventoryActionDb(memberSession, eventId, { itemId, qty: 1, action: "check_out" })
    ).rejects.toThrow("Unauthorized");
  });

  it("should block negative quantities to prevent stock manipulation", async () => {
    // A negative check_out could be used to falsely increase available stock
    await expect(
      logInventoryActionDb(adminSession, eventId, { itemId, qty: -5, action: "check_out" })
    ).rejects.toThrow();

    // Verify stock didn't change
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, itemId) });
    expect(item?.qtyAvailable).toBe(5);
  });

  it("should block checking out more than available", async () => {
    await expect(
      logInventoryActionDb(adminSession, eventId, { itemId, qty: 10, action: "check_out" })
    ).rejects.toThrow();
  });

  it("should successfully check out valid quantity", async () => {
    await logInventoryActionDb(adminSession, eventId, { itemId, qty: 2, action: "check_out" });
    
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, itemId) });
    expect(item?.qtyAvailable).toBe(3);
  });

  it("should successfully check in items", async () => {
    await logInventoryActionDb(adminSession, eventId, { itemId, qty: 2, action: "check_in" });
    
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, itemId) });
    expect(item?.qtyAvailable).toBe(5);
  });

  it("should block checking in more than qtyTotal", async () => {
    // Let's assume we can't have 6 available if qtyTotal is 5
    await expect(
      logInventoryActionDb(adminSession, eventId, { itemId, qty: 1, action: "check_in" })
    ).rejects.toThrow();
  });
});
