import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { budgets, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { allocateBudget, BUDGET_ADMIN_ROLES } from "@/lib/services/finance";
import { FINANCE_READ_ROLES } from "@/lib/dal/finance";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/budgets
 * Requires finance_lead, admin, or owner.
 */
export const GET = withApiHandler(async () => {
  await requireRole(FINANCE_READ_ROLES);

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

  const eventOptions = await db.select({ id: events.id, title: events.title })
    .from(events)
    .orderBy(events.startsAt);
  const budgetedEventIds = new Set(allBudgets.map((budget) => budget.eventId));

  return NextResponse.json({
    budgets: allBudgets,
    events: eventOptions,
    availableBudgetEvents: eventOptions.filter((event) => !budgetedEventIds.has(event.id)),
  });
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const session = await requireRole(BUDGET_ADMIN_ROLES);
const body = await req.json();
const result = await allocateBudget(session, body.eventId, body.allocated);
return NextResponse.json(result, { status: 201 });

});
