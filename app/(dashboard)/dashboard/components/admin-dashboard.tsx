/**
 * AdminDashboard — SOC space-themed admin overview.
 * Real data from lib/dal/dashboard. All states handled: loading (parent Suspense),
 * empty, and forbidden via role guard in parent.
 *
 * Doc ref: §02 journey "Govern the club", §04 space brand, §03 Astryx-first,
 * §09 accessibility.
 *
 * Component layer: Feature (maps real data into approved OrbitalMetric / CosmicSurface patterns).
 * Shadcn exception: toast via sonner (stable, no Astryx toast equivalent).
 */
"use client";

import React from "react";
import Link from "next/link";
import {
  Shield, Activity, FileText, Bell, Sparkles, ChevronRight,
  AlertTriangle, Wallet, Package, Calendar, Clock,
  ArrowRight, RotateCcw, Users,
} from "lucide-react";
import { Button, Badge } from "@astryxdesign/core";
import { OrbitalMetric, OrbitalMetricGrid } from "@/components/design-system/cosmic/OrbitalMetric";
import { LensingDivider, CosmicSurface, EmptyCosmicState } from "@/components/design-system/cosmic/CosmicSurface";
import { SectionHeader } from "@/components/astryx/page-header";
import { RelativeTime } from "@/components/app/relative-time";
import { AdminCharts } from "./admin-charts";
import { generateInsightsAction, deleteInsightAction } from "@/lib/actions/insights";
import { toast } from "sonner";

import {
  DashboardUser,
  ManagementStats,
  AIInsight,
  AuditLog,
  FinanceSnapshot,
  InventoryAlert,
  UpcomingEvent,
  ChartData,
} from "./dashboard-types";

interface AdminDashboardProps {
  user: DashboardUser;
  managementStats: ManagementStats;
  upcomingEvents: UpcomingEvent[];
  insights?: AIInsight[];
  pendingApprovalsCount: number;
  recentAuditLogs: AuditLog[];
  financeSnapshot: FinanceSnapshot | null;
  inventoryAlerts: InventoryAlert[];
  chartData: ChartData;
}

export function AdminDashboard({
  user,
  managementStats,
  upcomingEvents,
  insights = [],
  pendingApprovalsCount,
  recentAuditLogs,
  financeSnapshot,
  inventoryAlerts,
  chartData,
}: AdminDashboardProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Generating new insights…");
    try {
      const res = await generateInsightsAction();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Insights updated!");
      }
    } catch {
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const res = await deleteInsightAction(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Insight dismissed.");
      }
    } catch {
      toast.error("Failed to dismiss insight.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-enter">

      {/* ── 1. Global KPIs ──────────────────────────────────────── */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Club overview metrics</h2>
        <OrbitalMetricGrid cols={4}>
          <OrbitalMetric
            title="Club Members"
            value={managementStats?.totalMembers ?? 0}
            icon={<Shield aria-hidden="true" size={16} />}
            accent="violet"
          />
          <OrbitalMetric
            title="Active Events"
            value={managementStats?.activeEvents ?? 0}
            icon={<Activity aria-hidden="true" size={16} />}
            accent="blue"
          />
          <OrbitalMetric
            title="Total Registrations"
            value={managementStats?.totalRegistrations ?? 0}
            icon={<FileText aria-hidden="true" size={16} />}
            accent="lime"
          />
          <OrbitalMetric
            title="Pending Approvals"
            value={pendingApprovalsCount}
            icon={<Bell aria-hidden="true" size={16} />}
            accent={pendingApprovalsCount > 0 ? "lime" : "none"}
            trend={pendingApprovalsCount > 5 ? "up" : "neutral"}
            trendLabel={pendingApprovalsCount > 5 ? "Needs attention" : "Stable"}
          />
        </OrbitalMetricGrid>
      </section>

      {/* Pending approvals alert banner */}
      {pendingApprovalsCount > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-warning)]/30 bg-[rgba(245,158,11,0.08)] px-5 py-3.5"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle aria-hidden="true" size={18} className="text-[var(--color-warning)] shrink-0" />
            <p className="text-sm font-medium text-[var(--color-fg)]">
              {pendingApprovalsCount} approval{pendingApprovalsCount !== 1 ? "s" : ""} waiting for review
            </p>
          </div>
          <Link
            href="/manage/approvals"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-warning)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] whitespace-nowrap min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
          >
            Review <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      )}

      {/* ── 2. Charts ───────────────────────────────────────────── */}
      {chartData && <AdminCharts data={chartData} />}

      {/* ── 3. Three-column operational grid ─────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Left: AI Insights + Upcoming Events (span 2) */}
        <div className="space-y-6 lg:col-span-2">

          {/* AI Insights */}
          <CosmicSurface variant="default" padding="none">
            <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--d-line)]">
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" size={16} className="text-[var(--soc-accretion-violet)]" />
                <h3 className="text-sm font-semibold text-[var(--color-fg)]">AI Insights</h3>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh AI insights"
                aria-busy={isRefreshing}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)] px-2 rounded-md"
              >
                <RotateCcw aria-hidden="true" size={13} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Generating…" : "Refresh"}
              </button>
            </div>

            <div className="divide-y divide-[var(--d-line)]">
              {insights.length === 0 ? (
                <EmptyCosmicState
                  title="No insights yet"
                  description="Click refresh to generate AI-powered insights for your club."
                  illustration="orbit"
                  size="sm"
                />
              ) : (
                insights.map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-fg)] truncate">{insight.title}</p>
                      <p className="text-xs text-[var(--color-fg-dim)] mt-0.5 line-clamp-2">{insight.description}</p>
                      {insight.metricTrend && (
                        <Badge variant="purple" label={insight.metricTrend} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {insight.actionLink && (
                        <Link
                          href={insight.actionLink}
                          className="text-xs text-[var(--soc-accretion-violet)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center"
                        >
                          Act
                        </Link>
                      )}
                      <button
                        onClick={() => handleDismiss(insight.id)}
                        aria-label={`Dismiss insight: ${insight.title}`}
                        className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CosmicSurface>

          {/* Upcoming Events */}
          <CosmicSurface variant="default" padding="none">
            <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--d-line)]">
              <div className="flex items-center gap-2">
                <Calendar aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
                <h3 className="text-sm font-semibold text-[var(--color-fg)]">Upcoming Events</h3>
              </div>
              <Link
                href="/events"
                className="text-xs text-[var(--soc-accretion-violet)] hover:underline flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
              >
                All events <ChevronRight aria-hidden="true" size={12} />
              </Link>
            </div>

            <div className="divide-y divide-[var(--d-line)]">
              {upcomingEvents.length === 0 ? (
                <EmptyCosmicState
                  title="No upcoming events"
                  description="Create your first event to get started."
                  illustration="void"
                  size="sm"
                />
              ) : (
                upcomingEvents.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--d-panel-alt)] transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-10 w-10 rounded-lg bg-[var(--d-panel-alt)] flex items-center justify-center shrink-0"
                      >
                        <Calendar aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-fg)] truncate group-hover:text-[var(--soc-accretion-violet)] transition-colors">
                        {event.title}
                      </p>
                      <p className="text-xs text-[var(--color-fg-dim)] flex items-center gap-1 mt-0.5">
                        <Clock aria-hidden="true" size={11} />
                        <RelativeTime date={event.startsAt} format="date" />
                      </p>
                    </div>
                    <ChevronRight aria-hidden="true" size={14} className="text-[var(--color-fg-dim)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))
              )}
            </div>
          </CosmicSurface>
        </div>

        {/* Right column: Finance + Inventory + Audit */}
        <div className="space-y-6">

          {/* Finance Snapshot */}
          <CosmicSurface variant="default" padding="none">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-[var(--d-line)]">
              <Wallet aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
              <h3 className="text-sm font-semibold text-[var(--color-fg)]">Finance</h3>
            </div>
            {financeSnapshot ? (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-fg-dim)]">Budget Remaining</span>
                  <span className="text-sm font-bold text-[var(--color-fg)]">
                    ₹{financeSnapshot.budgetRemaining.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-fg-dim)]">Pending Expenses</span>
                  <Badge
                    variant={financeSnapshot.pendingExpenses.length > 0 ? "warning" : "success"}
                    label={String(financeSnapshot.pendingExpenses.length)}
                  />
                </div>
                <LensingDivider />
                <Link
                  href="/finance"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--soc-accretion-violet)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)]"
                >
                  View finance <ArrowRight aria-hidden="true" size={12} />
                </Link>
              </div>
            ) : (
              <EmptyCosmicState title="No finance data" illustration="none" size="sm" />
            )}
          </CosmicSurface>

          {/* Inventory Alerts */}
          <CosmicSurface variant="default" padding="none">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-[var(--d-line)]">
              <Package aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
              <h3 className="text-sm font-semibold text-[var(--color-fg)]">Inventory Alerts</h3>
            </div>
            {inventoryAlerts.length === 0 ? (
              <EmptyCosmicState
                title="All stocked"
                description="No inventory alerts at this time."
                illustration="none"
                size="sm"
              />
            ) : (
              <div className="divide-y divide-[var(--d-line)]">
                {inventoryAlerts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm text-[var(--color-fg)] truncate flex-1">{item.name}</p>
                    <Badge
                      variant={item.qtyAvailable <= 0 ? "error" : "warning"}
                      label={item.qtyAvailable <= 0 ? "Out" : `${item.qtyAvailable} left`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CosmicSurface>

          {/* Recent Audit */}
          <CosmicSurface variant="default" padding="none">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-[var(--d-line)]">
              <Shield aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
              <h3 className="text-sm font-semibold text-[var(--color-fg)]">Audit Trail</h3>
            </div>
            {recentAuditLogs.length === 0 ? (
              <EmptyCosmicState title="No recent activity" illustration="none" size="sm" />
            ) : (
              <div className="divide-y divide-[var(--d-line)]">
                {recentAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="px-5 py-3">
                    <p className="text-xs font-medium text-[var(--color-fg)] truncate">
                      {log.action} on {log.entity}
                    </p>
                    <p className="text-xs text-[var(--color-fg-dim)] mt-0.5">
                      <RelativeTime date={log.timestamp} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CosmicSurface>
        </div>
      </div>

      {/* ── 4. Quick actions ─────────────────────────────────────── */}
      <section aria-labelledby="quick-actions-heading">
        <SectionHeader title="Quick actions" id="quick-actions-heading" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: "Review approvals", href: "/manage/approvals", icon: Bell },
            { label: "Create event", href: "/events/create", icon: Calendar },
            { label: "Manage members", href: "/admin", icon: Users },
            { label: "Finance overview", href: "/finance", icon: Wallet },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="
                flex flex-col items-start gap-3 rounded-xl border border-[var(--d-line)]
                bg-[var(--d-panel)] p-4 transition-all duration-[var(--motion-micro)]
                hover:border-[var(--soc-accretion-violet)]/40 hover:bg-[var(--d-panel-alt)]
                hover:shadow-[var(--shadow-glow-violet)]
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]
                group min-h-[var(--touch-target)]
              "
            >
              <div
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(124,58,237,0.1)] text-[var(--soc-accretion-violet)] group-hover:scale-105 transition-transform"
              >
                <Icon size={16} />
              </div>
              <span className="text-sm font-medium text-[var(--color-fg)] leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
