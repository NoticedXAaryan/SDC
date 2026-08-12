import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { CommunicationService } from "@/lib/services/communications";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireSession();
  const { id } = await params;
  
  const result = await CommunicationService.getWhatsappTemplate(session, id);
  return NextResponse.json({ success: true, ...result });
}, { requireRateLimit: false });

