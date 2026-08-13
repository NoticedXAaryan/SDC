import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { budgets, expenses, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { allocateBudget, addExpense, updateExpenseStatus } from "@/lib/dal/finance";

describe("Finance DAL Integration Tests", () => {
  let adminId: string;
  let memberId: string;
  let adminSession: any;
  let memberSession: any;
  let eventId: string;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");

    eventId = "test-event-finance-" + Math.random().toString(36).substring(7);
    await db.insert(events).values({
      id: eventId,
      title: "Finance Test Event",
      slug: "finance-test-event-" + Math.random().toString(36).substring(7),
      description: "Test event for finance",
      status: "published",
      createdBy: adminId,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600000),
      metadata: {},
      visibility: "public",
      isInternal: false
    });
  });

  afterAll(async () => {
    // Clean up
    await db.delete(expenses);
    await db.delete(budgets).where(eq(budgets.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));
    
    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
  });

  it("should create a budget successfully", async () => {
    const newBudget = await allocateBudget(adminSession, eventId, 1000);
    expect(newBudget).toBeDefined();
    expect(newBudget.budgetId).toBeDefined();

    const budgetRecord = await db.query.budgets.findFirst({
      where: eq(budgets.id, newBudget.budgetId)
    });
    expect(budgetRecord?.allocated).toBe("1000");
  });

  it("should submit an expense successfully", async () => {
    const payload = {
      amount: 200,
      category: "marketing",
      receiptUrl: "https://example.com/receipt.jpg"
    };

    // Lead or admin needed to submit expense? Let's check roles.
    // addExpense allows lead, co_lead, admin, owner.
    // Let's use adminSession to submit it.
    const expense = await addExpense(adminSession, eventId, payload);
    expect(expense).toBeDefined();
    expect(expense.expenseId).toBeDefined();

    const expenseRecord = await db.query.expenses.findFirst({
      where: eq(expenses.id, expense.expenseId)
    });
    expect(expenseRecord?.status).toBe("pending");
    expect(expenseRecord?.amount).toBe("200");
  });

  it("should prevent self-approval of expenses (IDOR)", async () => {
    const expense = await addExpense(adminSession, eventId, {
      amount: 100,
      category: "marketing"
    });

    await expect(
      updateExpenseStatus(adminSession, expense.expenseId, "approved")
    ).rejects.toThrow("You cannot approve your own expense.");
  });

  it("should prevent approving expenses that overdraw the budget", async () => {
    // Budget is 1000.
    // Create an expense of 900. Another admin approves it.
    const leadId = await createTestUser("finance_lead");
    const leadSession = getMockSession(leadId, "finance_lead");
    
    const expense = await addExpense(adminSession, eventId, {
      amount: 900,
      category: "equipment"
    });

    await updateExpenseStatus(leadSession, expense.expenseId, "approved");

    // Try to approve an expense of 200 created by admin
    const expense2 = await addExpense(adminSession, eventId, {
      amount: 200,
      category: "equipment"
    });

    await expect(
      updateExpenseStatus(leadSession, expense2.expenseId, "approved")
    ).rejects.toThrow("Approving this expense would overdraw the budget.");

    // Delete the expenses created in this test so the user can be deleted
    await db.delete(expenses).where(eq(expenses.id, expense.expenseId));
    await db.delete(expenses).where(eq(expenses.id, expense2.expenseId));
    
    await cleanupTestUser(leadId);
  });
});
