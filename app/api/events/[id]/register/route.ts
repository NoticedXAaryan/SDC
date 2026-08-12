import { NextResponse, NextRequest } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { withApiHandler } from "@/lib/api-wrapper";
import { registerForEvent } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const rl = await checkRateLimit(req, "register");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await requireSession();
    
    
  const { id: eventId } = await params;
  const body = await req.json().catch(() => ({}));
  const formResponses = body.formResponses || null;

  const result = await registerForEvent(session, eventId, formResponses);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, status: result.regStatus }, 
      { status: result.status || 400 }
    );
  }

  return NextResponse.json(result, { status: 201 });
});

