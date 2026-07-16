import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificatesV2 } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Public endpoint to verify a certificate
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [cert] = await db.query.certificatesV2.findMany({
      where: eq(certificatesV2.id, id),
    });

    if (!cert) {
      return NextResponse.json({ valid: false, error: "Certificate not found" }, { status: 404 });
    }

    if (cert.status === "revoked") {
      return NextResponse.json({ 
        valid: false, 
        error: "Certificate has been revoked",
        revokedReason: cert.revokedReason
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      certificate: cert,
    });
  } catch (error) {
    console.error("Certificate Verification Error:", error);
    return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
  }
}
