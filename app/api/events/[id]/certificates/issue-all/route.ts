import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { issueAllCertificates } from "@/lib/dal/certificates";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;
  
  const result = await issueAllCertificates(session, id);
  
  if (result.count === 0) {
    return NextResponse.json({ message: result.message }, { status: 200 });
  }

  return NextResponse.json({
    success: true,
    message: `Successfully queued ${result.count} certificates for generation.`,
  });
});

