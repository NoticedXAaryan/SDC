import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { CertificateService } from "@/lib/services/certificates";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  
  const body = await req.json().catch(() => ({}));
  const { templateId, userIds, eventId } = body;

  if (!templateId || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Missing templateId or userIds array" }, { status: 400 });
  }

  const result = await CertificateService.issueAdhocCertificates(session, templateId, userIds, eventId);

  await logAuditEvent({
    actorId: session.user.id,
    action: "certificate_blast" as any,
    entity: "certificateTemplates",
    entityId: templateId,
    details: `Queued certificate generation for ${result.count} users.`,
  });

  return NextResponse.json({
    success: true,
    message: `Successfully queued ${result.count} certificates for generation.`,
  });
});
