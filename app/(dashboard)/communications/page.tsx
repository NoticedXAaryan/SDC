import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { communications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Mail } from "lucide-react";
import { CommunicationsActions } from "./communications-actions";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await requireSession();
  const canSend = isManagementRole(session.user.role as string);

  // Fetch recent communications from the DB
  let recentComms: any[] = [];
  try {
    recentComms = await db.query.communications.findMany({
      orderBy: [desc(communications.createdAt)],
      limit: 50,
    });
  } catch {
    // Table might be empty or have issues — graceful fallback
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Communications"
        description="Announcements and messages sent to club members."
        primaryAction={canSend ? <CommunicationsActions /> : undefined}
      />

      <div className="space-y-4">
        {recentComms.length === 0 ? (
          <EmptyState
            title="No communications yet"
            description="Announcements and messages will appear here once sent."
          />
        ) : (
          recentComms.map((comm) => (
            <Card key={comm.id}>
              <VStack gap={3}>
                <HStack justify="between" align="start">
                  <VStack gap={1}>
                    <Text weight="bold" className="text-base">
                      {comm.subject || "Untitled"}
                    </Text>
                    <Text type="supporting" className="text-xs">
                      {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </Text>
                  </VStack>
                  <Badge 
                    variant={comm.status === "sent" ? "success" : comm.status === "failed" ? "error" : "neutral"} 
                    label={comm.status || "draft"} 
                  />
                </HStack>
                <Text className="text-sm text-muted-foreground">
                  {comm.body || "No content"}
                </Text>
                {comm.channel && (
                  <HStack gap={2}>
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <Text type="supporting" className="text-xs capitalize">{comm.channel}</Text>
                  </HStack>
                )}
              </VStack>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
