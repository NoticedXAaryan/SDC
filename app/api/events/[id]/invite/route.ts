import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { sendInvites } from "@/lib/dal/communications";

const inviteSchema = z.object({
  emails: z.array(z.string().email()),
});

export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;
  
  const body = await req.json();
  const { emails } = inviteSchema.parse(body);

  const result = await sendInvites(session, id, emails);
  return NextResponse.json(result);
});

