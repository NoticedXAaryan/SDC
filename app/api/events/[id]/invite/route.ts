import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventInvites, user, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { emailQueue } from "@/lib/queues/email";
import { withApiHandler } from "@/lib/api-wrapper";

const inviteSchema = z.object({
  emails: z.array(z.string().email()),
});

export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const resolvedParams = await params;
    await requireAdmin();
    const body = await req.json();
    const { emails } = inviteSchema.parse(body);

    const [event] = await db.select().from(events).where(eq(events.id, resolvedParams.id));
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const results = [];
    for (const email of emails) {
      // Find user if exists
      const [existingUser] = await db.select().from(user).where(eq(user.email, email));
      const token = crypto.randomUUID();

      const [newInvite] = await db.insert(eventInvites).values({
        id: crypto.randomUUID(),
        eventId: resolvedParams.id,
        userId: existingUser?.id,
        email,
        token,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }).returning();

      results.push(newInvite);

      // Dispatch email
      const inviteUrl = `${process.env.BETTER_AUTH_URL}/events/${resolvedParams.id}/join?token=${token}`;
      await emailQueue.add("send-event-invite", {
        to: email,
        subject: `You're invited to ${event.title}`,
        body: `You have been invited to ${event.title}. Click here to RSVP: ${inviteUrl}`,
      }, { jobId: `invite-${newInvite.id}` });
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send invites" }, { status: 400 });
  }
});
