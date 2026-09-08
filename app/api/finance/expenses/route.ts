import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses, budgets, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createExpenseSchema } from "@/lib/validators/finance";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";
import { addExpense, EXPENSE_SUBMITTER_ROLES } from "@/lib/services/finance";
import { FINANCE_READ_ROLES } from "@/lib/dal/finance";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/expenses
 * Requires lead, co_lead, finance_lead, admin, or owner.
 */
export const GET = withApiHandler(async () => {
  await requireRole(FINANCE_READ_ROLES);

  const allExpenses = await db.select({
    id: expenses.id,
    budgetId: expenses.budgetId,
    amount: expenses.amount,
    category: expenses.category,
    receiptUrl: expenses.receiptUrl,
    status: expenses.status,
    createdAt: expenses.createdAt,
    approvedBy: expenses.approvedBy,
    approvedByName: user.name,
  })
  .from(expenses)
  .leftJoin(user, eq(expenses.approvedBy, user.id))
  .orderBy(desc(expenses.createdAt));

  return NextResponse.json(allExpenses);
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireRole(EXPENSE_SUBMITTER_ROLES);
const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
await checkEmergencyFreeze(session.user.role as string);
const body = await req.json();
const parsed = createExpenseSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid expense data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { budgetId, amount, category, receiptUrl } = parsed.data;

const [budget] = await db.select({ eventId: budgets.eventId }).from(budgets).where(eq(budgets.id, budgetId)).limit(1);
if (!budget?.eventId) throw new ValidationError("Budget not found");
const result = await addExpense(session, budget.eventId, { amount, category, receiptUrl });

const { NotificationService } = await import("@/lib/services/notifications");
await NotificationService.notifyLeads("finance_lead", {
  type: "approval_needed",
  title: "New Expense Approval",
  message: `A new expense of ${amount} requires your approval.`,
  link: `/finance?tab=expenses`
});

return NextResponse.json(result, { status: 201 });

});
