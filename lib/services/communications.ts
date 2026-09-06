import { getEventCommunications, createEventCommunicationDb, getWhatsappTemplate, markEventCommunicationQueueFailed, notifyColleagues, sendInvitesDb } from "@/lib/dal/communications";
import { getEmailQueue } from "@/lib/queues/email";
import type { AuthSession } from "@/lib/dal/auth";

export class CommunicationService {
  static async getEventCommunications(sessionAuth: AuthSession, eventId: string) {
    return getEventCommunications(sessionAuth, eventId);
  }

  static async createEventCommunication(sessionAuth: AuthSession, eventId: string, data: { subject: string; body: string; targetAudience: "all" | "confirmed" | "waitlist" }) {
    const { id, subject, messageBody, targetAudience } = await createEventCommunicationDb(sessionAuth, eventId, data);
    
    // Dispatch side-effect
    try {
      await getEmailQueue().add("broadcast_communication", {
        type: "broadcast_communication",
        payload: {
          commId: id,
          eventId,
          subject,
          body: messageBody,
          targetAudience,
        },
      });
    } catch (error) {
      await markEventCommunicationQueueFailed(id);
      throw error;
    }

    return { success: true, id };
  }

  static async sendInvites(sessionAuth: AuthSession, eventId: string, emails: string[]) {
    const { count, jobsToQueue } = await sendInvitesDb(sessionAuth, eventId, emails);
    
    if (jobsToQueue.length > 0) {
      await getEmailQueue().addBulk(jobsToQueue);
    }

    return { success: true, count };
  }
  static async notifyColleagues(sessionAuth: AuthSession, eventId: string, data: { subject: string; message: string }) {
    return notifyColleagues(sessionAuth, eventId, data);
  }

  static async getWhatsappTemplate(sessionAuth: AuthSession, eventId: string) {
    return getWhatsappTemplate(sessionAuth, eventId);
  }
}
