import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses, budgets, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
const session = await requireRole(["lead", "co_lead", "admin", "owner"]);

const { id: eventId } = await params;
const body = await req.json().catch(() => ({}));
const { amount, category, receiptUrl } = body;

if (!amount || isNaN(Number(amount)) || !category) {
  return NextResponse.json({ error: "Amount and category are required" }, { status: 400 });
}

const budget = await db.query.budgets.findFirst({
  where: eq(budgets.eventId, eventId),
});

if (!budget) {
  return NextResponse.json({ error: "No budget allocated for this event yet" }, { status: 400 });
}

const expenseId = crypto.randomUUID();
await db.insert(expenses).values({
  id: expenseId,
  budgetId: budget.id,
  amount: String(amount),
  category,
  receiptUrl: receiptUrl || null,
  status: "pending",
  createdBy: session.user.id,
});

return NextResponse.json({ success: true, expenseId }, { status: 201 });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Event Expenses POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
