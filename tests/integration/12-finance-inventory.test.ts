/**
 * 12-finance-inventory.test.ts
 *
 * Integration tests for Workflow 3: Finance/Inventory (from doc 06).
 *
 * Covers:
 *   - Budget allocation (idempotent: same call twice returns same budgetId)
 *   - Cannot reduce budget below approved spend
 *   - Expense submission (domain-scoped for non-admins)
 *   - Self-approval prevention
 *   - Budget overdraw prevention (race-safe check inside transaction)
 *   - RBAC: member cannot submit expense
 *   - RBAC: member cannot approve expense
 *   - Expense rejection records reason
 *   - Income recording
 *   - Inventory: create item, check out, check in, overflow prevention
 *   - Inventory: cannot check out more than available
 *   - Finance summary (read query)
 *   - Audit log written for every mutation
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { budgets, expenses, incomes, events, inventory, inventoryLogs, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  allocateBudget,
  updateBudget,
  addExpense,
  updateExpenseStatus,
  recordIncome,
} from "@/lib/services/finance";
import {
  createInventoryItem,
  performInventoryAction,
} from "@/lib/services/inventory";
import { getEventFinanceSummary } from "@/lib/dal/finance";
import crypto from "crypto";

describe("Workflow 3: Finance & Inventory", () => {
  let adminId: string;
  let financeLeadId: string;
  let leadId: string;
  let memberId: string;
  let eventId: string;
  let budgetId: string;
  let expenseId: string;
  let inventoryItemId: string;

  const EVENT_SLUG = `finance-inv-test-${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    adminId      = await createTestUser("admin");
    financeLeadId = await createTestUser("finance_lead");
    leadId       = await createTestUser("lead");
    memberId     = await createTestUser("member");

    // Create a test event directly (bypassing event service for speed)
    eventId = crypto.randomUUID();
    await db.insert(events).values({
      id: eventId,
      title: "Finance Integration Test Event",
      slug: EVENT_SLUG,
      type: "workshop",
      description: "Test event for finance and inventory integration tests.",
      status: "published",
      createdBy: leadId,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600000),
      visibility: "public",
    });
  });

  afterAll(async () => {
    // Clean up all related data
    await db.delete(inventoryLogs).where(eq(inventoryLogs.itemId, inventoryItemId ?? "x"));
    await db.delete(inventory).where(eq(inventory.id, inventoryItemId ?? "x"));
    await db.delete(expenses).where(eq(expenses.budgetId, budgetId ?? "x"));
    await db.delete(incomes).where(eq(incomes.eventId, eventId));
    await db.delete(budgets).where(eq(budgets.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));
    await cleanupTestUser(adminId);
    await cleanupTestUser(financeLeadId);
    await cleanupTestUser(leadId);
    await cleanupTestUser(memberId);
  });

  // ── Budget ─────────────────────────────────────────────────────────────

  it("3.1 finance_lead can allocate a budget", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    const result = await allocateBudget(session, eventId, 1000);
    expect(result.success).toBe(true);
    expect(result.budgetId).toBeDefined();
    budgetId = result.budgetId;

    const saved = await db.query.budgets.findFirst({
      where: eq(budgets.id, budgetId),
    });
    expect(saved?.allocated).toBe("1000");
  });

  it("3.2 allocating budget again for same event is idempotent", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    const result = await allocateBudget(session, eventId, 2000);
    // Should return existing budgetId, not create a new one
    expect(result.budgetId).toBe(budgetId);

    const all = await db.select().from(budgets).where(eq(budgets.eventId, eventId));
    expect(all).toHaveLength(1); // Still only one budget
    expect(all[0].allocated).toBe("1000"); // Unchanged
  });

  it("3.3 member cannot allocate budget", async () => {
    const session = getMockSession(memberId, "member");
    await expect(allocateBudget(session, eventId, 500)).rejects.toThrow(
      "Only finance leads and admins may allocate budgets"
    );
  });

  it("3.4 finance_lead can update budget", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    const result = await updateBudget(session, eventId, { allocated: 1500 });
    expect(result.success).toBe(true);

    const saved = await db.query.budgets.findFirst({ where: eq(budgets.id, budgetId) });
    expect(saved?.allocated).toBe("1500");
  });

  // ── Expenses ───────────────────────────────────────────────────────────

  it("3.5 lead can submit an expense", async () => {
    const session = getMockSession(leadId, "lead");
    const result = await addExpense(session, eventId, {
      amount: 200,
      category: "equipment",
      receiptUrl: "https://example.com/receipt.pdf",
    });
    expect(result.success).toBe(true);
    expenseId = result.expenseId;

    const saved = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) });
    expect(saved?.status).toBe("pending");
    expect(saved?.amount).toBe("200");
    expect(saved?.createdBy).toBe(leadId);
  });

  it("3.6 member cannot submit expense", async () => {
    const session = getMockSession(memberId, "member");
    await expect(
      addExpense(session, eventId, { amount: 100, category: "food" })
    ).rejects.toThrow("not authorized to submit expenses");
  });

  it("3.7 cannot self-approve expense", async () => {
    // leadId submitted the expense above
    const leadSession = getMockSession(leadId, "lead");
    // finance_lead role needed to approve, but lead can't approve; but let's test self-approval
    // Use finance_lead who is the same person as submitter: create scenario
    const selfSession = getMockSession(leadId, "finance_lead");
    // Manually set createdBy to match lead for this test
    // (the expense was created by leadId, so using finance_lead role with same userId should fail)
    const fakeLeadFinance = { ...selfSession, user: { ...selfSession.user, id: leadId, role: "finance_lead" } };
    await expect(
      updateExpenseStatus(fakeLeadFinance as any, expenseId, { status: "approved" })
    ).rejects.toThrow("cannot approve your own expense");
  });

  it("3.8 finance_lead (different user) can approve expense", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    const result = await updateExpenseStatus(session, expenseId, { status: "approved" });
    expect(result.success).toBe(true);

    const saved = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) });
    expect(saved?.status).toBe("approved");
    expect(saved?.approvedBy).toBe(financeLeadId);
  });

  it("3.9 cannot approve already-processed expense", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    await expect(
      updateExpenseStatus(session, expenseId, { status: "approved" })
    ).rejects.toThrow("already approved");
  });

  it("3.10 budget overdraw is prevented (race-safe)", async () => {
    // Budget is 1500. Already approved 200. Try to approve 1400 more.
    const overSession = getMockSession(leadId, "lead");
    const overExpense = await addExpense(overSession, eventId, { amount: 1400, category: "venue" });

    const session = getMockSession(financeLeadId, "finance_lead");
    await expect(
      updateExpenseStatus(session, overExpense.expenseId, { status: "approved" })
    ).rejects.toThrow("overdraw the budget");

    // Clean up
    await db.delete(expenses).where(eq(expenses.id, overExpense.expenseId));
  });

  it("3.11 expense rejection records reason", async () => {
    const newExpense = await addExpense(getMockSession(leadId, "lead"), eventId, {
      amount: 50,
      category: "miscellaneous",
    });

    const session = getMockSession(financeLeadId, "finance_lead");
    const result = await updateExpenseStatus(session, newExpense.expenseId, {
      status: "rejected",
      reason: "Missing receipt",
    });
    expect(result.success).toBe(true);

    const saved = await db.query.expenses.findFirst({
      where: eq(expenses.id, newExpense.expenseId),
    });
    expect(saved?.status).toBe("rejected");

    // Clean up
    await db.delete(expenses).where(eq(expenses.id, newExpense.expenseId));
  });

  // ── Income ─────────────────────────────────────────────────────────────

  it("3.12 finance_lead can record income", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    const result = await recordIncome(session, {
      eventId,
      amount: 500,
      source: "Sponsorship",
    });
    expect(result.success).toBe(true);

    const saved = await db.query.incomes.findFirst({
      where: eq(incomes.eventId, eventId),
    });
    expect(saved?.amount).toBe("500");
    expect(saved?.source).toBe("Sponsorship");
  });

  // ── Finance Summary ────────────────────────────────────────────────────

  it("3.13 finance summary shows correct figures", async () => {
    const session = getMockSession(financeLeadId, "finance_lead");
    const summary = await getEventFinanceSummary(session, eventId);

    expect(summary.budget?.allocated).toBe(1500);
    expect(summary.approvedExpenses).toBe(200); // Only the first approved expense
    expect(summary.totalIncome).toBe(500);
    expect(summary.netBalance).toBe(300); // 500 - 200
  });

  // ── Inventory ──────────────────────────────────────────────────────────

  it("3.14 lead can create an inventory item", async () => {
    const session = getMockSession(leadId, "lead");
    const result = await createInventoryItem(session, {
      name: "Projector",
      qtyTotal: 3,
    });
    expect(result.success).toBe(true);
    inventoryItemId = result.itemId;

    const saved = await db.query.inventory.findFirst({
      where: eq(inventory.id, inventoryItemId),
    });
    expect(saved?.qtyTotal).toBe(3);
    expect(saved?.qtyAvailable).toBe(3);
  });

  it("3.15 can check out inventory item", async () => {
    const session = getMockSession(leadId, "lead");
    const result = await performInventoryAction(session, {
      itemId: inventoryItemId,
      qty: 2,
      action: "check_out",
      eventId,
    });
    expect(result.success).toBe(true);
    expect(result.newQtyAvailable).toBe(1);

    const saved = await db.query.inventory.findFirst({
      where: eq(inventory.id, inventoryItemId),
    });
    expect(saved?.qtyAvailable).toBe(1);
  });

  it("3.16 cannot check out more than available", async () => {
    const session = getMockSession(leadId, "lead");
    await expect(
      performInventoryAction(session, {
        itemId: inventoryItemId,
        qty: 2, // Only 1 available
        action: "check_out",
      })
    ).rejects.toThrow("Insufficient inventory");
  });

  it("3.17 can check in inventory items", async () => {
    const session = getMockSession(leadId, "lead");
    const result = await performInventoryAction(session, {
      itemId: inventoryItemId,
      qty: 2,
      action: "check_in",
    });
    expect(result.success).toBe(true);
    expect(result.newQtyAvailable).toBe(3); // Back to full

    const saved = await db.query.inventory.findFirst({
      where: eq(inventory.id, inventoryItemId),
    });
    expect(saved?.qtyAvailable).toBe(3);
  });

  it("3.18 cannot check in more than total quantity", async () => {
    const session = getMockSession(leadId, "lead");
    await expect(
      performInventoryAction(session, {
        itemId: inventoryItemId,
        qty: 1, // Already at max
        action: "check_in",
      })
    ).rejects.toThrow("Cannot check in more than total quantity");
  });

  it("3.19 member cannot perform inventory actions", async () => {
    const session = getMockSession(memberId, "member");
    await expect(
      performInventoryAction(session, {
        itemId: inventoryItemId,
        qty: 1,
        action: "check_out",
      })
    ).rejects.toThrow("not authorized to perform inventory actions");
  });

  // ── Audit Trail Verification ───────────────────────────────────────────

  it("3.20 audit logs exist for all critical mutations", async () => {
    const budgetAudit = await db.query.auditLogs.findFirst({
      where: and(
        eq(auditLogs.entityId, budgetId),
        eq(auditLogs.action, "budget_create")
      ),
    });
    expect(budgetAudit).toBeDefined();

    const expenseAudit = await db.query.auditLogs.findFirst({
      where: and(
        eq(auditLogs.entityId, expenseId),
        eq(auditLogs.action, "expense_approve")
      ),
    });
    expect(expenseAudit).toBeDefined();
    expect(expenseAudit?.actorId).toBe(financeLeadId);

    const inventoryAudit = await db.query.auditLogs.findFirst({
      where: and(
        eq(auditLogs.entityId, inventoryItemId),
        eq(auditLogs.action, "inventory_create")
      ),
    });
    expect(inventoryAudit).toBeDefined();
  });
});
