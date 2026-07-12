import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateExpenseStatusSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/finance/expenses/[id]
 * Update expense status (approve/reject).
 * Requires finance_lead, admin, or owner.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["finance_lead", "admin", "owner"]);
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
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Expense PATCH]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
