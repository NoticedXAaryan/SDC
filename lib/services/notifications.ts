import { db } from "@/lib/db";
import { notifications, user } from "@/lib/db/schema";
import { Mailer } from "./mailer";
import { eq } from "drizzle-orm";
import { SDCRole } from "@/lib/dal/auth";

export type NotificationType = "system" | "event" | "finance" | "achievement" | "admin";

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export const NotificationService = {
  /**
   * Notify users with a specific role
   */
  async notifyLeads(roleRequired: SDCRole, notification: { type: string; title: string; message: string; link?: string }) {
    const leads = await db.select({ id: user.id }).from(user).where(eq(user.role, roleRequired as string));
    
    if (leads.length === 0) return;

    const newNotifications = leads.map(l => ({
      userId: l.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
    }));

    await db.insert(notifications).values(newNotifications);
  },

  /**
   * Send an in-app notification (stored in the database).
   */
  async sendInAppNotification(payload: NotificationPayload) {
    await db.insert(notifications).values({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
    });
  },

  /**
   * Send an email notification only.
   */
  async sendEmailNotification(payload: NotificationPayload, toEmail: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${payload.title}</h2>
        <p>${payload.message}</p>
        ${payload.link ? `<a href="${payload.link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Details</a>` : ""}
      </div>
    `;
    await Mailer.sendEmail({
      to: toEmail,
      subject: payload.title,
      html,
    });
  },

  /**
   * Send both in-app and email notifications (for critical alerts).
   */
  async sendCriticalNotification(payload: NotificationPayload) {
    await this.sendInAppNotification(payload);

    // Fetch user's email to send the email notification
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, payload.userId),
      columns: {
        email: true,
      },
    });

    if (targetUser?.email) {
      await this.sendEmailNotification(payload, targetUser.email);
    }
  },
};
