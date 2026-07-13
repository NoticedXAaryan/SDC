import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses, budgets, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createExpenseSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/expenses
 * Requires lead, co_lead, finance_lead, admin, or owner.
 */
export async function GET() {
  try {
    await requireRole(["lead", "co_lead", "finance_lead", "admin", "owner"]);

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
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Expenses GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withApiHandler(async (req: NextRequest) => {
try {
const session = await requireRole(["co_lead", "lead", "finance_lead", "admin", "owner"]);
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

// Check if budget exists
const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
if (!budget) {
  return NextResponse.json({ error: "Budget not found" }, { status: 404 });
}

const expenseId = crypto.randomUUID();

await db.insert(expenses).values({
  id: expenseId,
  budgetId,
  amount: String(amount),
  category,
  receiptUrl: receiptUrl || null,
  status: "pending",
  createdBy: session.user.id,
});

await logAuditEvent({
  actorId: session.user.id,
  action: "expense_create",
  entity: "expense",
  entityId: expenseId,
  details: `Submitted expense of ₹${amount} for category ${category}`,
});

const { NotificationService } = await import("@/lib/services/notifications");
await NotificationService.notifyLeads("finance_lead", {
  type: "approval_needed",
  title: "New Expense Approval",
  message: `A new expense of ${amount} requires your approval.`,
  link: `/dashboard/finance/expenses/${expenseId}`
});

return NextResponse.json({ success: true, id: expenseId }, { status: 201 });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Expenses POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
