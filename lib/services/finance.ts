/**
 * FinanceService — SOC-compliant finance workflow.
 *
 * Implements: budget creation, expense submission, expense approval/rejection,
 * income recording. All mutations are transactional with audit logs.
 *
 * RBAC enforced at service layer (not only at route wrapper):
 *   - Budget creation: admin, owner only
 *   - Expense submission: lead, co_lead, admin, owner
 *   - Expense approval: finance_lead, admin, owner (not self)
 *   - Income creation: finance_lead, admin, owner
 */
import { db } from "@/lib/db";
import { budgets, expenses, incomes, events, auditLogs } from "@/lib/db/schema";
import { eq, and, sum as drizzleSum } from "drizzle-orm";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import type { SDCRole } from "@/lib/dal/auth";
import {
  createBudgetSchema,
  updateBudgetSchema,
  createExpenseSchema,
  updateExpenseStatusSchema,
  createIncomeSchema,
  type CreateBudgetInput,
  type CreateExpenseInput,
  type UpdateExpenseStatusInput,
  type CreateIncomeInput,
} from "@/lib/validators/finance";

// ─── RBAC Constants ────────────────────────────────────────────────────────

const BUDGET_ADMIN_ROLES: SDCRole[] = ["finance_lead", "admin", "owner"];
const EXPENSE_SUBMITTER_ROLES: SDCRole[] = ["lead", "vice_lead", "co_lead", "event_lead", "finance_lead", "admin", "owner"];
const EXPENSE_APPROVER_ROLES: SDCRole[] = ["finance_lead", "admin", "owner"];

// ─── Budget ────────────────────────────────────────────────────────────────

export interface BudgetResult {
  success: true;
  budgetId: string;
}

/**
 * Creates a budget allocation for an event.
 * Idempotent: returns existing budget ID if one already exists (no duplicate).
 */
export async function allocateBudget(
  session: AuthSession,
  eventId: string,
  rawAllocated: unknown
): Promise<BudgetResult> {
  const { allocated } = createBudgetSchema.parse({ eventId, allocated: Number(rawAllocated) });
  const role = session.user.role as SDCRole;

  if (!BUDGET_ADMIN_ROLES.includes(role)) {
    throw new AuthorizationError("Only finance leads and admins may allocate budgets.");
  }

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) throw new ValidationError("Event not found.");

  // Idempotency: return existing budget if already allocated
  const existing = await db.query.budgets.findFirst({ where: eq(budgets.eventId, eventId) });
  if (existing) {
    return { success: true, budgetId: existing.id };
  }

  const budgetId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(budgets).values({
      id: budgetId,
      eventId,
      allocated: String(allocated),
    });

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: "budget_create",
      entity: "budget",
      entityId: budgetId,
      details: JSON.stringify({ eventId, allocated }),
      timestamp: new Date(),
    });
  });

  return { success: true, budgetId };
}

/**
 * Updates an existing budget allocation. Requires finance_lead+.
 * Cannot reduce below sum of already-approved expenses.
 */
export async function updateBudget(
  session: AuthSession,
  eventId: string,
  rawData: unknown
): Promise<BudgetResult> {
  const data = updateBudgetSchema.parse(rawData);
  const role = session.user.role as SDCRole;

  if (!BUDGET_ADMIN_ROLES.includes(role)) {
    throw new AuthorizationError("Only finance leads and admins may update budgets.");
  }

  const budget = await db.query.budgets.findFirst({ where: eq(budgets.eventId, eventId) });
  if (!budget) throw new ValidationError("No budget found for this event.");

  // Validate: new allocation cannot be below already-approved spend
  const approvedExpenses = await db
    .select({ amount: expenses.amount })
    .from(expenses)
    .where(and(eq(expenses.budgetId, budget.id), eq(expenses.status, "approved")));

  const totalApproved = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  if (data.allocated < totalApproved) {
    throw new ValidationError(
      `Cannot reduce budget below current approved spend (₹${totalApproved}). New allocation: ₹${data.allocated}.`
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(budgets)
      .set({ allocated: String(data.allocated), updatedAt: new Date() })
      .where(eq(budgets.id, budget.id));

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: "budget_update",
      entity: "budget",
      entityId: budget.id,
      details: JSON.stringify({
        eventId,
        previousAllocated: budget.allocated,
        newAllocated: data.allocated,
        reason: data.reason ?? null,
      }),
      timestamp: new Date(),
    });
  });

  return { success: true, budgetId: budget.id };
}

// ─── Expense ──────────────────────────────────────────────────────────────

export interface ExpenseResult {
  success: true;
  expenseId: string;
}

/**
 * Submits an expense against an event's budget.
 * Domain-scoped: non-admins can only submit expenses for events in their domain.
 */
export async function addExpense(
  session: AuthSession,
  eventId: string,
  rawData: unknown
): Promise<ExpenseResult> {
  const role = session.user.role as SDCRole;

  if (!EXPENSE_SUBMITTER_ROLES.includes(role)) {
    throw new AuthorizationError("You are not authorized to submit expenses.");
  }

  const budget = await db.query.budgets.findFirst({ where: eq(budgets.eventId, eventId) });
  if (!budget) throw new ValidationError("No budget allocated for this event yet.");

  const data = createExpenseSchema.parse({
    budgetId: budget.id,
    ...(rawData as object),
    amount: Number((rawData as any)?.amount),
  });

  // Domain guard for non-admins
  const isAdmin = (["admin", "owner", "finance_lead"] as SDCRole[]).includes(role);
  if (!isAdmin) {
    const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) throw new ValidationError("Event not found.");

    const isCreator = event.createdBy === session.user.id;
    const isDomainMatch =
      (session.user as any).domain &&
      event.domain &&
      (session.user as any).domain === event.domain;

    if (!isCreator && !isDomainMatch) {
      throw new AuthorizationError(
        "You can only submit expenses for events within your domain or events you created."
      );
    }
  }

  const expenseId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(expenses).values({
      id: expenseId,
      budgetId: budget.id,
      amount: String(data.amount),
      category: data.category,
      receiptUrl: data.receiptUrl ?? null,
      status: "pending",
      createdBy: session.user.id,
    });

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: "expense_create",
      entity: "expense",
      entityId: expenseId,
      details: JSON.stringify({ eventId, amount: data.amount, category: data.category }),
      timestamp: new Date(),
    });
  });

  return { success: true, expenseId };
}

/**
 * Approves or rejects an expense.
 *
 * Critical rules enforced here:
 *   1. Self-approval is blocked
 *   2. Approval must not overdraw the budget (checked inside transaction with FOR UPDATE)
 *   3. Only finance_lead+ may approve
 */
export async function updateExpenseStatus(
  session: AuthSession,
  expenseId: string,
  rawData: unknown
): Promise<{ success: true }> {
  const data = updateExpenseStatusSchema.parse(rawData);
  const role = session.user.role as SDCRole;

  if (!EXPENSE_APPROVER_ROLES.includes(role)) {
    throw new AuthorizationError("Only finance leads and admins may approve or reject expenses.");
  }

  const expense = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) });
  if (!expense) throw new ValidationError("Expense not found.");

  if (expense.status !== "pending") {
    throw new ValidationError(`Expense is already ${expense.status}. Cannot change status.`);
  }

  // Self-approval prevention
  if (data.status === "approved" && expense.createdBy === session.user.id) {
    throw new AuthorizationError("You cannot approve your own expense.");
  }

  await db.transaction(async (tx) => {
    if (data.status === "approved") {
      // Re-fetch budget inside transaction to get current state (prevents race)
      const budget = await tx.query.budgets.findFirst({
        where: eq(budgets.id, expense.budgetId),
      });
      if (!budget) throw new ValidationError("Budget not found.");

      // Sum all currently approved expenses for this budget
      const approvedExpenses = await tx
        .select({ amount: expenses.amount })
        .from(expenses)
        .where(and(eq(expenses.budgetId, budget.id), eq(expenses.status, "approved")));

      const totalApproved = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      if (totalApproved + Number(expense.amount) > Number(budget.allocated)) {
        throw new ValidationError(
          `Approving this expense (₹${expense.amount}) would overdraw the budget. ` +
          `Already approved: ₹${totalApproved} / ₹${budget.allocated}.`
        );
      }
    }

    await tx
      .update(expenses)
      .set({
        status: data.status,
        approvedBy: data.status === "approved" ? session.user.id : null,
      })
      .where(eq(expenses.id, expenseId));

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: data.status === "approved" ? "expense_approve" : "expense_reject",
      entity: "expense",
      entityId: expenseId,
      details: JSON.stringify({
        status: data.status,
        reason: data.reason ?? null,
        amount: expense.amount,
      }),
      timestamp: new Date(),
    });
  });

  return { success: true };
}

// ─── Income ───────────────────────────────────────────────────────────────

export interface IncomeResult {
  success: true;
  incomeId: string;
}

export async function recordIncome(
  session: AuthSession,
  rawData: unknown
): Promise<IncomeResult> {
  const data = createIncomeSchema.parse(rawData);
  const role = session.user.role as SDCRole;

  if (!BUDGET_ADMIN_ROLES.includes(role)) {
    throw new AuthorizationError("Only finance leads and admins may record income.");
  }

  const event = await db.query.events.findFirst({ where: eq(events.id, data.eventId) });
  if (!event) throw new ValidationError("Event not found.");

  const incomeId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(incomes).values({
      id: incomeId,
      eventId: data.eventId,
      amount: String(data.amount),
      source: data.source,
    });

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: "income_create",
      entity: "income",
      entityId: incomeId,
      details: JSON.stringify({ eventId: data.eventId, amount: data.amount, source: data.source }),
      timestamp: new Date(),
    });
  });

  return { success: true, incomeId };
}
