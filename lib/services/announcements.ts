import "server-only";

import type { AuthSession } from "@/lib/dal/auth";
import {
  createAnnouncementDb,
  setAnnouncementDeliveryStatus,
} from "@/lib/dal/announcements";
import { getEmailQueue } from "@/lib/queues/email";
import type { CreateAnnouncementInput } from "@/lib/validators/announcements";

export async function broadcastAnnouncement(
  session: AuthSession,
  input: CreateAnnouncementInput,
) {
  const announcement = await createAnnouncementDb(session, input);

  try {
    await getEmailQueue().add(
      "broadcast_announcement",
      {
        type: "broadcast_announcement",
        payload: {
          commId: announcement.id,
          senderId: session.user.id,
          subject: input.title,
          body: input.message,
        },
      },
      { jobId: `announcement-${announcement.id}` },
    );
    await setAnnouncementDeliveryStatus(announcement.id, "queued");
  } catch (error) {
    await setAnnouncementDeliveryStatus(announcement.id, "queue_failed");
    throw error;
  }

  return announcement;
}
