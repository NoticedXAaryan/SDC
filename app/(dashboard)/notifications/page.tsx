import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import Link from "next/link";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const session = await requireSession();

  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    orderBy: [desc(notifications.createdAt)],
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Notifications" 
        description="View and manage all your notifications."
      />

      <div className="space-y-4">
        {userNotifications.length === 0 ? (
          <EmptyState
            title="You're all caught up!"
            description="No notifications to display."
          />
        ) : (
          userNotifications.map(n => (
            <Card key={n.id} className={!n.read ? "bg-muted/10 border-primary/20" : ""}>
              <VStack gap={4}>
                <VStack gap={1}>
                  <HStack justify="between" align="start">
                    <HStack gap={2} align="center">
                      <Bell className={`w-4 h-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                      <Text weight={!n.read ? "bold" : "semibold"} className="text-lg">
                        {n.title}
                      </Text>
                      {!n.read && <Badge variant="info" label="New" />}
                    </HStack>
                  </HStack>
                  <Text type="supporting" className="text-xs">
                    {new Date(n.createdAt).toLocaleString()}
                  </Text>
                </VStack>
                
                <Text className="text-sm">
                  {n.message}
                </Text>
                
                {n.link && (
                  <Link href={n.link} className="text-sm text-primary font-medium hover:underline">
                    View Details
                  </Link>
                )}
              </VStack>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
