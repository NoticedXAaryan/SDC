import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { certificates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const revokeSchema = z.object({
  reason: z.string().min(5),
});

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const sessionAuth = await requireRole(["admin", "owner"]); // only high level admins should revoke

const body = await req.json();
const parsed = revokeSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { id } = await params;
const { reason } = parsed.data;

const [cert] = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
if (!cert) {
  return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
}

if (cert.revoked) {
  return NextResponse.json({ error: "Certificate is already revoked" }, { status: 400 });
}

await db.update(certificates).set({
  revoked: true,
  revokedReason: reason,
}).where(eq(certificates.id, id));

await logAuditEvent({
  actorId: sessionAuth.user.id,
  action: "certificate_revoke" as any,
  entity: "certificate",
  entityId: cert.id,
  details: `Revoked certificate for reason: ${reason}`
});

return NextResponse.json({ success: true, message: "Certificate revoked successfully" });

});
