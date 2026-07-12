import { db } from "@/lib/db";
import { notifications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { STCRole } from "@/lib/dal/auth";

export async function notifyLeads(
  roleRequired: STCRole,
  notification: { type: string; title: string; message: string; link?: string }
) {
  const leads = await db.select({ id: user.id }).from(user).where(eq(user.role, roleRequired as any));
  
  if (leads.length === 0) return;

  const newNotifications = leads.map(l => ({
    userId: l.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
  }));

  await db.insert(notifications).values(newNotifications);
}
