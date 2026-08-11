import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { z } from "zod";
import { getEventCommunications, createEventCommunication } from "@/lib/dal/communications";

const createCommSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  targetAudience: z.enum(["all", "confirmed", "waitlist"]),
});

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;

  const body = await req.json();
  const parsed = createCommSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
  }

  const result = await createEventCommunication(session, id, parsed.data);
  return NextResponse.json(result);
});

export const GET = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;

  const comms = await getEventCommunications(session, id);
  return NextResponse.json({ communications: comms });
});

