import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { getSessions, createSession } from "@/lib/dal/events";

const sessionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
});

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  
  const sessions = await getSessions(id);
  return NextResponse.json(sessions);
});

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const sessionAuth = await requireSession();
  
  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
  }

  const { id } = await params;
  
  const newSession = await createSession(sessionAuth, id, parsed.data);
  return NextResponse.json(newSession, { status: 201 });
});

