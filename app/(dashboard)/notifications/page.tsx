import { requirePageSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export default async function NotificationsPage() {
  const session = await requirePageSession("/notifications");
  const items = await db.query.notifications.findMany({ where: eq(notifications.userId, session.user.id), orderBy: [desc(notifications.createdAt)] });
  return <div className="mx-auto max-w-3xl">
    <PageHeader title="Notifications" description="Your application decisions, event updates, and club activity." />
    <NotificationInbox initialItems={items.map(item => ({ ...item, read: !!item.read, createdAt: item.createdAt.toISOString() }))} />
  </div>;
}
