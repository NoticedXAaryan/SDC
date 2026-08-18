import "server-only";

import crypto from "crypto";
import { ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditLogs,
  communications,
  notifications,
  user,
} from "@/lib/db/schema";
import { makeAuditRecord } from "@/lib/services/audit";
import type { AuthSession } from "@/lib/dal/auth";
import type { CreateAnnouncementInput } from "@/lib/validators/announcements";

const NOTIFICATION_BATCH_SIZE = 100;

export async function createAnnouncementDb(
  session: AuthSession,
  input: CreateAnnouncementInput,
) {
  return db.transaction(async (tx) => {
    const recipients = await tx
      .select({ id: user.id })
      .from(user)
      .where(ne(user.role, "outsider"));

    const communicationId = crypto.randomUUID();
    const notificationRows = recipients.map((recipient) => ({
      id: crypto.randomUUID(),
      userId: recipient.id,
      type: "announcement",
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    }));

    for (let index = 0; index < notificationRows.length; index += NOTIFICATION_BATCH_SIZE) {
      await tx.insert(notifications).values(
        notificationRows.slice(index, index + NOTIFICATION_BATCH_SIZE),
      );
    }

    await tx.insert(communications).values({
      id: communicationId,
      senderId: session.user.id,
      subject: input.title,
      body: input.message,
      targetAudience: "all",
      status: "pending",
      sentCount: 0,
    });

    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: session.user.id,
      action: "communication_queued",
      entity: "communication",
      entityId: communicationId,
      details: JSON.stringify({
        kind: "announcement",
        recipientCount: recipients.length,
      }),
    }));

    return { id: communicationId, recipientCount: recipients.length };
  });
}

export async function setAnnouncementDeliveryStatus(
  communicationId: string,
  status: "queued" | "queue_failed",
): Promise<void> {
  const { eq } = await import("drizzle-orm");
  await db
    .update(communications)
    .set({ status })
    .where(eq(communications.id, communicationId));
}
