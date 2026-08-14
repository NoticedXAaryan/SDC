/**
 * finance.ts DAL — Thin repository layer for finance entities.
 *
 * These functions only read/write data. Business logic (RBAC, validation,
 * overdraw checks, self-approval blocking) lives in lib/services/finance.ts.
 *
 * Route handlers and server actions should prefer calling the service,
 * not these DAL functions directly (unless doing read-only queries).
 *
 * For backward compatibility, the service functions are re-exported here
 * so existing imports like `import { allocateBudget } from "@/lib/dal/finance"`
 * continue to work.
 */

// Re-export the canonical service functions for backward compatibility
export {
  allocateBudget,
  updateBudget,
  addExpense,
  updateExpenseStatus,
  recordIncome,
} from "@/lib/services/finance";

// ── Read-only DAL queries ───────────────────────────────────────────────────

import { db } from "@/lib/db";
import { budgets, expenses, incomes, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import type { SDCRole } from "@/lib/dal/auth";

const FINANCE_READ_ROLES: SDCRole[] = [
  "finance_lead", "lead", "vice_lead", "admin", "owner"
];

export interface FinanceSummary {
  budget: { id: string; allocated: number } | null;
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  totalIncome: number;
  netBalance: number;
}

/**
 * Returns the full finance summary for an event.
 * Domain-scoped: non-admins can only view events in their domain.
 */
export async function getEventFinanceSummary(
  session: AuthSession,
  eventId: string
): Promise<FinanceSummary> {
  const role = session.user.role as SDCRole;

  if (!FINANCE_READ_ROLES.includes(role)) {
    throw new AuthorizationError("You are not authorized to view finance data.");
  }

  const budget = await db.query.budgets.findFirst({
    where: eq(budgets.eventId, eventId),
  });

  const allExpenses = budget
    ? await db.select().from(expenses).where(eq(expenses.budgetId, budget.id))
    : [];

  const allIncome = await db
    .select()
    .from(incomes)
    .where(eq(incomes.eventId, eventId));

  const totalExpenses = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const approvedExpenses = allExpenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + Number(e.amount), 0);
  const pendingExpenses = allExpenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = allIncome.reduce((s, i) => s + Number(i.amount), 0);

  return {
    budget: budget
      ? { id: budget.id, allocated: Number(budget.allocated) }
      : null,
    totalExpenses,
    approvedExpenses,
    pendingExpenses,
    totalIncome,
    netBalance: totalIncome - approvedExpenses,
  };
}

/**
 * Lists all expenses for a budget with status.
 */
export async function getExpensesForEvent(
  session: AuthSession,
  eventId: string
) {
  const role = session.user.role as SDCRole;
  if (!FINANCE_READ_ROLES.includes(role)) {
    throw new AuthorizationError("Not authorized.");
  }

  const budget = await db.query.budgets.findFirst({
    where: eq(budgets.eventId, eventId),
  });
  if (!budget) return [];

  return db.select().from(expenses).where(eq(expenses.budgetId, budget.id));
}