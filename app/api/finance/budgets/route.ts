import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { budgets, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createBudgetSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/budgets
 * Requires finance_lead, admin, or owner.
 */
export async function GET() {
  try {
    await requireRole(["finance_lead", "admin", "owner"]);

    const allBudgets = await db.select({
      id: budgets.id,
      eventId: budgets.eventId,
      allocated: budgets.allocated,
      updatedAt: budgets.updatedAt,
      eventTitle: events.title,
    })
    .from(budgets)
    .leftJoin(events, eq(budgets.eventId, events.id))
    .orderBy(budgets.updatedAt);

    return NextResponse.json(allBudgets);
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Budgets GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireRole(["finance_lead", "admin", "owner"]);
const body = await req.json();
const parsed = createBudgetSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid budget data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { eventId, allocated } = parsed.data;

// Check if event exists
const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

const budgetId = crypto.randomUUID();

await db.insert(budgets).values({
  id: budgetId,
  eventId,
  allocated: String(allocated),
});

await logAuditEvent({
  actorId: session.user.id,
  action: "budget_create",
  entity: "budget",
  entityId: budgetId,
  details: `Created budget of ₹${allocated} for event ${event.title}`,
});

return NextResponse.json({ success: true, id: budgetId }, { status: 201 });

});
