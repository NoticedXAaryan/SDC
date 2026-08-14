import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { updateExpenseStatusSchema } from "@/lib/validators/finance";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler } from "@/lib/api-wrapper";
import { updateExpenseStatus } from "@/lib/dal/finance";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireSession();
const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
await checkEmergencyFreeze(session.user.role as string);
const { id } = await params;

const body = await req.json();
const parsed = updateExpenseStatusSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid update data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { status, reason } = parsed.data;

if (status === "rejected" && !reason) {
  return NextResponse.json({ error: "A reason is required when rejecting an expense." }, { status: 400 });
}

await updateExpenseStatus(session, id, { status, reason });

return NextResponse.json({ success: true, status });
});
