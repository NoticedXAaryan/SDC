import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateExpenseStatusSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireRole(["finance_lead", "admin", "owner"]);
const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
await checkEmergencyFreeze(session.user.role as string);
const { id } = await params;

const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
if (!expense) {
  return NextResponse.json({ error: "Expense not found" }, { status: 404 });
}

const body = await req.json();
const parsed = updateExpenseStatusSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid update data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { status } = parsed.data;

const { canTransition } = await import("@/lib/dal/auth");
if (!canTransition(session.user.role, "expense", expense.status || "pending", status)) {
  return NextResponse.json({ error: "Your role cannot transition the expense to this status" }, { status: 403 });
}

if (status === "approved" && expense.createdBy === session.user.id) {
  return NextResponse.json({ error: "You cannot approve your own expense." }, { status: 403 });
}

await db.update(expenses)
  .set({
    status,
    approvedBy: status === "approved" ? session.user.id : null,
  })
  .where(eq(expenses.id, id));

await logAuditEvent({
  actorId: session.user.id,
  action: status === "approved" ? "expense_approve" : "expense_reject",
  entity: "expense",
  entityId: id,
  details: `Expense ${id} marked as ${status}`,
});

return NextResponse.json({ success: true, status });

});
