import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventInvites, user, events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { emailQueue } from "@/lib/queues/email";
import { withApiHandler } from "@/lib/api-wrapper";

const inviteSchema = z.object({
  emails: z.array(z.string().email()),
});

export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    await requireAdmin();
    const body = await req.json();
    const { emails } = inviteSchema.parse(body);

    const [event] = await db.select().from(events).where(eq(events.id, resolvedParams.id));
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Bulk query existing users
    const existingUsers = emails.length > 0
      ? await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, emails))
      : [];
    const userMap = new Map(existingUsers.map(u => [u.email, u.id]));

    const invitesToInsert = [];
    const jobsToQueue = [];

    for (const email of emails) {
      const token = crypto.randomUUID();
      const inviteId = crypto.randomUUID();
      
      invitesToInsert.push({
        id: inviteId,
        eventId: resolvedParams.id,
        userId: userMap.get(email) || null,
        email,
        token,
        status: "pending" as const,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const inviteUrl = `${process.env.BETTER_AUTH_URL}/events/${resolvedParams.id}/join?token=${token}`;
      jobsToQueue.push({
        name: "send-event-invite",
        data: {
          to: email,
          subject: `You're invited to ${event.title}`,
          body: `You have been invited to ${event.title}. Click here to RSVP: ${inviteUrl}`,
        },
        opts: { jobId: `invite-${inviteId}` }
      });
    }

    let insertedInvites = [];
    if (invitesToInsert.length > 0) {
      insertedInvites = await db.insert(eventInvites).values(invitesToInsert).returning();
      await emailQueue.addBulk(jobsToQueue);
    }

    return NextResponse.json({ success: true, count: insertedInvites.length });
});
