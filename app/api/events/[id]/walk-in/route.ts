import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { walkInRegister } from "@/lib/dal/events";

const walkInSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const body = await req.json();
  const parsed = walkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
  }

  const { id } = await params;
  const result = await walkInRegister(session, id, parsed.data);

  return NextResponse.json({ success: true, result });
});
