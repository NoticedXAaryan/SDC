import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-wrapper";
import { guestRegister } from "@/lib/dal/events";
import { z } from "zod";

const guestRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
});

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    
    
  const { id } = await params;
  const parsed = guestRegistrationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid name and email address", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await guestRegister(id, parsed.data);
  return NextResponse.json({ success: true, ...result }, { status: 201 });
}, { requireAuth: false });
