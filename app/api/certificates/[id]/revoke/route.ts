import { NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-wrapper";
import { requireRole } from "@/lib/dal/auth";
import { CertificateService } from "@/lib/services/certificates";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireRole(["admin", "owner"]);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  await CertificateService.revokeCertificate(session, {
    certificateId: id,
    reason: body.reason,
  });

  return NextResponse.json({ success: true, message: "Certificate revoked successfully" });
});
