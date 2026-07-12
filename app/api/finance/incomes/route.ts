import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { incomes, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createIncomeSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/incomes
 * Requires finance_lead, admin, or owner.
 */
export async function GET() {
  try {
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
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Incomes GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/finance/incomes
 * Requires finance_lead, admin, or owner.
 */
export async function POST(req: NextRequest) {
  try {
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
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Incomes POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
