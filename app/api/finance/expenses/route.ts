import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses, budgets, user } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
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

const expenseId = crypto.randomUUID();

await db.transaction(async (tx) => {
  const res = await tx.execute(sql`SELECT * FROM budgets WHERE id=${budgetId} FOR UPDATE`);
  const budget = (res as any).rows ? (res as any).rows[0] : (res as any)[0];
  if (!budget) {
    throw new Error("Budget not found");
  }

  await tx.insert(expenses).values({
    id: expenseId,
    budgetId,
    amount: String(amount),
    category,
    receiptUrl: receiptUrl || null,
    status: "pending",
    createdBy: session.user.id,
  });
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

});
