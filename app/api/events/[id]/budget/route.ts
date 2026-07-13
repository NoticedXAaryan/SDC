import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { budgets, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
// Only admins or finance team (if applicable) can allocate budget
await requireRole(["admin", "owner"]);

const { id: eventId } = await params;
const body = await req.json().catch(() => ({}));
const { allocated } = body;

if (allocated === undefined || isNaN(Number(allocated))) {
  return NextResponse.json({ error: "Valid allocated amount is required" }, { status: 400 });
}

const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

// Check if budget already exists
const existingBudget = await db.query.budgets.findFirst({
  where: eq(budgets.eventId, eventId),
});

if (existingBudget) {
  return NextResponse.json({ error: "Budget already allocated for this event. Use PUT/PATCH to update." }, { status: 400 });
}

const budgetId = crypto.randomUUID();
await db.insert(budgets).values({
  id: budgetId,
  eventId,
  allocated: String(allocated),
});

  // Removed redundant link: events no longer store budgetId since budgets store eventId

return NextResponse.json({ success: true, budgetId }, { status: 201 });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Event Budget POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
