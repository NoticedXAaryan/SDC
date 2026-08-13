import { requireSession, ADMIN_ROLES } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/astryx/page-header";
import { Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const session = await requireSession();
  
  if (!session.user.role || !ADMIN_ROLES.includes(session.user.role as any)) {
    redirect("/dashboard");
  }

  const logs = await db.select({
    log: auditLogs,
    actor: {
      name: user.name,
      email: user.email,
    }
  })
  .from(auditLogs)
  .leftJoin(user, eq(auditLogs.actorId, user.id))
  .orderBy(desc(auditLogs.timestamp))
  .limit(100);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <PageHeader 
        title="Audit Logs"
        description="System activity and security events across the platform."
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(({ log, actor }, i) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-medium bg-secondary px-2 py-1 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{actor?.name || "System"}</span>
                        {actor?.email && <span className="text-xs text-muted-foreground">{actor.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {log.entity} <span className="text-muted-foreground font-normal text-xs">{log.entityId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground line-clamp-1" title={log.details || ""}>
                        {log.details || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
            <Activity className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground font-medium">No audit logs found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
