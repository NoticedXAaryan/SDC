import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { incomes, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { BUDGET_ADMIN_ROLES, recordIncome } from "@/lib/services/finance";
import { FINANCE_READ_ROLES } from "@/lib/dal/finance";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/incomes
 * Requires finance_lead, admin, or owner.
 */
export const GET = withApiHandler(async () => {
  await requireRole(FINANCE_READ_ROLES);

  const allIncomes = await db.select({
    id: incomes.id,
    eventId: incomes.eventId,
    amount: incomes.amount,
    source: incomes.source,
    createdAt: incomes.createdAt,
    eventTitle: events.title,
  })
  .from(incomes)
  .leftJoin(events, eq(incomes.eventId, events.id))
  .orderBy(desc(incomes.createdAt));

  return NextResponse.json(allIncomes);
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const session = await requireRole(BUDGET_ADMIN_ROLES);
const result = await recordIncome(session, await req.json());
return NextResponse.json(result, { status: 201 });

});
