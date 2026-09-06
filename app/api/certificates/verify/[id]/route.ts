import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/certificates/verify/[id] — Public certificate verification endpoint.
 * Intentionally unauthenticated — verification links are shared publicly.
 */
export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const cert = await db.query.certificates.findFirst({
    columns: {
      verifyId: true,
      data: true,
      pdfUrl: true,
      status: true,
      revokedReason: true,
      issuedAt: true,
      eventId: true,
    },
    where: eq(certificates.verifyId, id),
  });

  if (!cert) {
    return NextResponse.json({ valid: false, error: "Certificate not found" }, { status: 404 });
  }

  if (cert.status === "revoked") {
    return NextResponse.json({ 
      valid: false, 
      error: "Certificate has been revoked",
      revokedReason: cert.revokedReason
    });
  }

  return NextResponse.json({
    valid: true,
    certificate: cert,
  });
}, { requireAuth: false, requireRateLimit: false });
