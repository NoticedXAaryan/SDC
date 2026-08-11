import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-wrapper";
import { guestRegister } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const result = await guestRegister(id, { name, email });
  return NextResponse.json({ success: true, ...result }, { status: 201 });
}, { requireAuth: false });

