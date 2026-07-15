import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eventSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { z } from "zod";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const sessionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
});

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: eventId } = await params;
    
    const sessions = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.eventId, eventId))
      .orderBy(eventSessions.startTime);
      
    return NextResponse.json(sessions);
  });

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const sessionAuth = await requireRole(["admin", "owner", "lead", "event_lead", "co_lead"]);
await checkEmergencyFreeze(sessionAuth.user.role as string);

const body = await req.json();
const parsed = sessionSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { id: eventId } = await params;
const { title, description, startTime, endTime, location } = parsed.data;

const [newSession] = await db.insert(eventSessions).values({
  id: crypto.randomUUID(),
  eventId,
  title,
  description,
  startTime: new Date(startTime),
  endTime: new Date(endTime),
  location,
  createdAt: new Date(),
}).returning();

return NextResponse.json(newSession, { status: 201 });

});
