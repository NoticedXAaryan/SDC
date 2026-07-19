import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { incomes, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createIncomeSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/incomes
 * Requires finance_lead, admin, or owner.
 */
export const GET = withApiHandler(async () => {
  await requireRole(["finance_lead", "admin", "owner"]);

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
const session = await requireRole(["finance_lead", "admin", "owner"]);
const body = await req.json();
const parsed = createIncomeSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid income data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { eventId, amount, source } = parsed.data;

const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

const incomeId = crypto.randomUUID();

await db.insert(incomes).values({
  id: incomeId,
  eventId,
  amount: String(amount),
  source,
});

await logAuditEvent({
  actorId: session.user.id,
  action: "income_create",
  entity: "income",
  entityId: incomeId,
  details: `Logged income of ₹${amount} from ${source} for event ${event.title}`,
});

return NextResponse.json({ success: true, id: incomeId }, { status: 201 });

});
