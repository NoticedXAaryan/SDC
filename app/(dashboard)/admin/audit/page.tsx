import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireRole(["admin", "owner", "faculty_coordinator"]);

  const logs = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    entity: auditLogs.entity,
    entityId: auditLogs.entityId,
    details: auditLogs.details,
    timestamp: auditLogs.timestamp,
    actorName: user.name,
    actorEmail: user.email,
  })
  .from(auditLogs)
  .leftJoin(user, eq(auditLogs.actorId, user.id))
  .orderBy(desc(auditLogs.timestamp))
  .limit(100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Audit Logs"
        description="Review system activities and changes made by members."
      />

      <Card padding={0} className="overflow-hidden">
        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No audit logs found.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                <HStack justify="between" align="start">
                  <VStack gap={1}>
                    <Text weight="medium">
                      {log.actorName || "System"} <span className="text-muted-foreground font-normal">performed</span> {log.action}
                    </Text>
                    <Text type="supporting" className="text-sm font-mono">
                      {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}
                    </Text>
                    {log.details && (
                      <Text type="supporting" className="text-xs mt-1">
                        {log.details}
                      </Text>
                    )}
                  </VStack>
                  <Text type="supporting" className="text-xs shrink-0">
                    {log.timestamp.toLocaleString()}
                  </Text>
                </HStack>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
