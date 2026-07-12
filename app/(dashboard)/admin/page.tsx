import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, events, registrations, auditLogs } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  // Aggregate stats
  const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
  const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(events);
  const [regCount] = await db.select({ count: sql<number>`count(*)` }).from(registrations);

  // Recent audit logs
  const recentAudit = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    entity: auditLogs.entity,
    details: auditLogs.details,
    timestamp: auditLogs.timestamp,
  })
  .from(auditLogs)
  .orderBy(desc(auditLogs.timestamp))
  .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">System-wide statistics and recent activity.</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Members</div>
          <div className="text-3xl font-bold mt-2">{Number(memberCount.count)}</div>
          <Link href="/admin/members" className="text-xs text-primary hover:underline mt-2 inline-block">
            Manage members →
          </Link>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Events</div>
          <div className="text-3xl font-bold mt-2">{Number(eventCount.count)}</div>
          <Link href="/events" className="text-xs text-primary hover:underline mt-2 inline-block">
            View events →
          </Link>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Registrations</div>
          <div className="text-3xl font-bold mt-2">{Number(regCount.count)}</div>
        </div>
      </div>

      {/* Recent audit log */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Recent Activity</h2>
          <Link href="/admin/audit" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y">
          {recentAudit.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No activity logged yet.</div>
          ) : (
            recentAudit.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className="capitalize">{log.action.replace(/_/g, " ")}</span>
                    {" "}
                    <span className="text-muted-foreground">on {log.entity}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </time>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
