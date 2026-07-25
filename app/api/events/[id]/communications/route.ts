import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, communications, registrations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { emailQueue } from "@/lib/queues/email";
import crypto from "crypto";
import { withApiHandler } from "@/lib/api-wrapper";
import { z } from "zod";

const createCommSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  targetAudience: z.enum(["all", "confirmed", "waitlist"]),
});

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireRole(["admin", "owner", "lead", "co_lead", "event_lead"]);
  const { id: eventId } = await params;

  const body = await req.json();
  const parsed = createCommSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
  }

  const { subject, body: messageBody, targetAudience } = parsed.data;

  // 1. Create communication record
  const commId = crypto.randomUUID();
  await db.insert(communications).values({
    id: commId,
    eventId,
    senderId: session.user.id,
    subject,
    body: messageBody,
    targetAudience,
    status: "processing",
    sentCount: 0,
  });

  // 2. Queue broadcast job
  await emailQueue.add("broadcast_communication", {
    commId,
    eventId,
    subject,
    body: messageBody,
    targetAudience,
  });

  return NextResponse.json({ success: true, id: commId });
});

export const GET = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole(["admin", "owner", "lead", "co_lead", "event_lead"]);
  const { id: eventId } = await params;

  const comms = await db.select()
    .from(communications)
    .where(eq(communications.eventId, eventId))
    .orderBy(desc(communications.createdAt));

  return NextResponse.json({ communications: comms });
});
