import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { budgets, expenses, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { allocateBudget, addExpense } from "@/lib/dal/finance";

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
      slug: "finance-test-event",
      description: "Test event for finance",
      status: "published",
      createdBy: adminId,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600000),
      organizationId: "test-org",
      metadata: {},
      isPublic: true,
      requiresApproval: false
    });
  });

  afterAll(async () => {
    // Clean up
    await db.delete(expenses).where(eq(expenses.createdBy, memberId));
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
});
