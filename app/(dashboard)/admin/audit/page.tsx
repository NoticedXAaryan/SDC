import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const session = await requireSession();
  
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    redirect("/");
  }

  const logs = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    entity: auditLogs.entity,
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
    <div className="max-w-6xl mx-auto py-12 space-y-6">
      <h1 className="text-3xl font-bold">Security Audit Logs</h1>
      <p className="text-muted-foreground">Immutable record of sensitive system actions.</p>

      <div className="border rounded-md overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{log.actorName}</p>
                  <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.entity}</td>
                <td className="px-4 py-3 max-w-[300px] truncate" title={log.details || ""}>{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
