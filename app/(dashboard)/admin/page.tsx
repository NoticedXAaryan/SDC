/**
 * Admin Overview Page — SOC design system compliant.
 * Journey: §02 "Govern the club" → admin at-a-glance.
 * States: loading (loading.tsx via Suspense), error (error.tsx / PageErrorBoundary),
 *         empty (inline empty copy), forbidden (requireAdmin() redirect).
 *
 * Astryx-first: Button, Badge from @astryxdesign/core.
 * SOC layer: OrbitalMetric / OrbitalMetricGrid, CosmicSurface.
 * Shadcn exception: none.
 */
import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, events, registrations, auditLogs } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";
import Link from "next/link";
import { Users, Calendar, CheckSquare, Activity } from "lucide-react";
import { OrbitalMetric, OrbitalMetricGrid } from "@/components/design-system/cosmic/OrbitalMetric";
import { CosmicSurface } from "@/components/design-system/cosmic/CosmicSurface";
import { PageHeader } from "@/components/astryx/page-header";
import { Button } from "@astryxdesign/core";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  // Aggregate stats — real data
  const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
  const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(events);
  const [regCount] = await db.select({ count: sql<number>`count(*)` }).from(registrations);

  // Recent audit logs
  const recentAudit = await db
    .select({
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
    <div className="space-y-8 max-w-6xl mx-auto py-6 animate-enter">
      <PageHeader
        title="Admin Overview"
        description="System-wide statistics and recent activity."
        primaryAction={
          <Button href="/manage/approvals" label="Review approvals" />
        }
      />

      {/* Orbital metric cards — SOC token surface */}
      <OrbitalMetricGrid cols={3}>
        <OrbitalMetric
          title="Total Members"
          value={Number(memberCount.count).toLocaleString()}
          icon={<Users aria-hidden="true" size={14} />}
          accent="violet"
          trend="neutral"
          trendLabel="all time"
        />
        <OrbitalMetric
          title="Total Events"
          value={Number(eventCount.count).toLocaleString()}
          icon={<Calendar aria-hidden="true" size={14} />}
          accent="blue"
          trend="neutral"
          trendLabel="all time"
        />
        <OrbitalMetric
          title="Registrations"
          value={Number(regCount.count).toLocaleString()}
          icon={<CheckSquare aria-hidden="true" size={14} />}
          accent="lime"
          trend="neutral"
          trendLabel="all time"
        />
      </OrbitalMetricGrid>

      {/* Quick-action links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Manage members", href: "/admin/members" },
          { label: "View events", href: "/events" },
          { label: "Audit log", href: "/admin/audit" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between rounded-[var(--radius-tile)] border border-[var(--d-line)] bg-[var(--d-panel)] px-4 py-3 text-sm font-medium text-[var(--d-fg)] transition-colors hover:bg-[var(--d-panel-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
          >
            {link.label}
            <span aria-hidden="true" className="text-[var(--d-fg-dim)]">→</span>
          </Link>
        ))}
      </div>

      {/* Recent activity feed */}
      <CosmicSurface variant="default" padding="none">
        <div className="flex items-center justify-between border-b border-[var(--d-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity
              aria-hidden="true"
              size={15}
              className="text-[var(--soc-accretion-violet)]"
            />
            <h2 className="text-sm font-semibold text-[var(--d-fg)]">
              Recent Activity
            </h2>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs text-[var(--soc-accretion-violet)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] rounded-sm"
          >
            View all →
          </Link>
        </div>

        <div
          role="log"
          aria-label="Recent audit activity"
          className="divide-y divide-[var(--d-line)]"
        >
          {recentAudit.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--d-fg-dim)]">
              No activity logged yet.
            </p>
          ) : (
            recentAudit.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--d-panel-alt)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--d-fg)] truncate">
                    <span className="capitalize">
                      {log.action.replace(/_/g, " ")}
                    </span>{" "}
                    <span className="text-[var(--d-fg-dim)]">
                      on {log.entity}
                    </span>
                  </p>
                  {log.details && (
                    <p className="mt-0.5 text-xs text-[var(--d-fg-dim)] truncate">
                      {log.details}
                    </p>
                  )}
                </div>
                <time
                  dateTime={new Date(log.timestamp).toISOString()}
                  className="shrink-0 text-xs text-[var(--d-fg-dim)] tabular-nums whitespace-nowrap"
                >
                  {new Date(log.timestamp).toLocaleString()}
                </time>
              </div>
            ))
          )}
        </div>
      </CosmicSurface>
    </div>
  );
}
