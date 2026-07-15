import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await requireSession();

  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    orderBy: [desc(notifications.createdAt)],
  });

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">View and manage all your notifications.</p>
      </div>

      <div className="space-y-4">
        {userNotifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              You're all caught up! No notifications to display.
            </CardContent>
          </Card>
        ) : (
          userNotifications.map(n => (
            <Card key={n.id} className={!n.read ? "bg-muted/30" : ""}>
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {n.title}
                    {!n.read && <Badge variant="default" className="text-xs h-5">New</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {new Date(n.createdAt).toLocaleString()}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{n.message}</p>
                {n.link && (
                  <Link href={n.link} className="text-sm text-blue-500 hover:underline">
                    View Details
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
