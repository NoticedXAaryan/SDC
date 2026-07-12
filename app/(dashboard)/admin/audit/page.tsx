import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireRole(["admin", "owner"]);
  
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">View system-wide activity and changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest 100 system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="bg-background hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.actorName || "System"}</div>
                        <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {log.entity} {log.entityId ? `(${log.entityId.substring(0, 8)}...)` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
