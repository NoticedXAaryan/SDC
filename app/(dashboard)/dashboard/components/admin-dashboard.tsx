"use client";

import React from "react";
import Link from "next/link";
import { Shield, Activity, Bell, FileText, Package, DollarSign, Sparkles, TerminalSquare, Inbox } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";
import { MetricCard } from "@/components/astryx/metric-card";
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
  ChartData 
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
  user, managementStats, upcomingEvents, insights = [],
  pendingApprovalsCount, recentAuditLogs, financeSnapshot, inventoryAlerts, chartData
}: AdminDashboardProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Generating new insights...");
    const res = await generateInsightsAction();
    setIsRefreshing(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Insights updated!");
    }
  };

  const handleDismiss = async (id: string) => {
    const res = await deleteInsightAction(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Insight dismissed.");
    }
  };

  return (
    <VStack gap={8}>
      {/* 1. Global KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Club Members"
          value={managementStats?.totalMembers || 0}
          icon={<Shield />}
        />
        <MetricCard
          title="Active Events"
          value={managementStats?.activeEvents || 0}
          icon={<Activity />}
        />
        <MetricCard
          title="Total Registrations"
          value={managementStats?.totalRegistrations || 0}
          icon={<FileText />}
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovalsCount}
          icon={<Bell />}
          variant={pendingApprovalsCount > 0 ? "red" : "default"}
        />
      </div>

      {/* 2. Charts */}
      {chartData && <AdminCharts data={chartData} />}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          
          {/* 3. AI Insights Panel */}
          {(insights.length > 0 || isRefreshing) && (
            <Card padding={5} className="border-primary/20 bg-primary/5 dark:bg-primary/10">
              <VStack gap={5}>
                <HStack justify="between" align="center">
                  <HStack align="center" gap={2}>
                    <Sparkles className="text-primary w-5 h-5" />
                    <Heading level={3} className="font-semibold text-lg text-primary">
                      AI Insights
                    </Heading>
                  </HStack>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    label={isRefreshing ? "Generating..." : "Refresh"} 
                    onClick={handleRefresh}
                    isDisabled={isRefreshing}
                  />
                </HStack>
                
                <VStack gap={3}>
                  {insights.map((insight) => (
                    <Card key={insight.id} padding={4} className="bg-background/80 backdrop-blur border-border/50 shadow-sm relative group">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDismiss(insight.id)}
                          className="text-muted-foreground hover:text-foreground text-xs p-1 rounded hover:bg-muted"
                          title="Dismiss Insight"
                        >
                          ✕
                        </button>
                      </div>
                      <HStack justify="between" align="start" className="mb-2 pr-6">
                        <Text weight="medium">
                          {insight.title}
                        </Text>
                        {insight.metricTrend && (
                          <Badge variant={insight.metricTrend.startsWith('+') ? 'success' : insight.metricTrend.startsWith('-') ? 'error' : 'neutral'} label={insight.metricTrend} />
                        )}
                      </HStack>
                      <Text type="supporting" className="mt-1">
                        {insight.description}
                      </Text>
                      {insight.isActionable && insight.actionLink && (
                        <Link href={insight.actionLink} className="text-xs text-primary hover:underline mt-3 inline-block font-medium">
                          Take Action →
                        </Link>
                      )}
                    </Card>
                  ))}
                </VStack>
              </VStack>
            </Card>
          )}

          {/* 4. Recent Audit Logs — Real Data */}
          <Card padding={5}>
            <VStack gap={5}>
              <HStack justify="between" align="center">
                <VStack>
                  <Heading level={3} className="font-semibold text-lg">Recent Activity</Heading>
                  <Text type="supporting">System activity stream</Text>
                </VStack>
                <Button variant="secondary" size="sm" href="/admin/audit" label="View All" icon={<TerminalSquare className="w-4 h-4" />} />
              </HStack>
              
              <VStack gap={4}>
                {recentAuditLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <Text type="supporting">No activity logged yet.</Text>
                  </div>
                ) : (
                  recentAuditLogs.map((log) => (
                    <HStack key={log.id} align="start" gap={4} className="border-b border-border pb-3 last:border-0">
                      <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <VStack gap={1}>
                        <Text weight="medium" className="capitalize">
                          {log.action.replace(/_/g, " ")}
                        </Text>
                        {log.details && (
                          <Text type="supporting" className="text-xs truncate max-w-sm">{log.details}</Text>
                        )}
                      </VStack>
                    </HStack>
                  ))
                )}
              </VStack>
            </VStack>
          </Card>
        </div>
        
        {/* Sidebar: Finance & Inventory */}
        <VStack gap={6}>
          {/* Finance Snapshot — Real Data */}
          <Card padding={5}>
            <VStack gap={5}>
              <Heading level={3} className="font-semibold text-lg">Finance Snapshot</Heading>
              
              {financeSnapshot ? (
                <>
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-border">
                    <HStack align="center" gap={3}>
                      <div className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 p-2 rounded-full"><DollarSign className="w-4 h-4" /></div>
                      <VStack gap={0}>
                        <Text weight="semibold" className="text-sm">Budget Remaining</Text>
                        <Text type="supporting" className="text-xs">Across all events</Text>
                      </VStack>
                    </HStack>
                    <span className="font-bold font-mono">
                      ₹{financeSnapshot.budgetRemaining.toLocaleString()}
                    </span>
                  </div>
                  
                  {financeSnapshot.pendingExpenses.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pending Expenses</h4>
                      <div className="space-y-2 flex flex-col">
                        {financeSnapshot.pendingExpenses.map((exp) => (
                          <Link key={exp.id} href="/admin/finance" className="text-sm flex justify-between p-2 hover:bg-muted rounded-md transition">
                            <Text className="capitalize">{exp.category}</Text>
                            <Text weight="medium" className="text-amber-600">₹{Number(exp.amount).toLocaleString()}</Text>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Text type="supporting">No budgets configured yet.</Text>
                </div>
              )}
            </VStack>
          </Card>

          {/* Inventory Alerts — Real Data */}
          <Card padding={5}>
            <VStack gap={5}>
              <Heading level={3} className="font-semibold text-lg">Inventory Alerts</Heading>
              
              {inventoryAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <Text type="supporting">All items are well stocked.</Text>
                </div>
              ) : (
                <>
                  {inventoryAlerts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-l-2 pl-3" style={{ borderLeftColor: item.qtyAvailable === 0 ? 'var(--destructive)' : '#f59e0b' }}>
                      <VStack gap={0}>
                        <Text weight="medium" className="text-sm">{item.name}</Text>
                        <Text type="supporting" className="text-xs">
                          {item.qtyAvailable === 0 ? "Out of stock" : "Low stock warning"}
                        </Text>
                      </VStack>
                      <Badge 
                        variant={item.qtyAvailable === 0 ? "error" : "warning"} 
                        label={`${item.qtyAvailable} left`} 
                      />
                    </div>
                  ))}
                  <Button variant="secondary" className="w-full mt-2 text-xs" href="/admin/inventory" label="Manage Inventory" icon={<Package className="w-4 h-4" />} />
                </>
              )}
            </VStack>
          </Card>
        </VStack>
      </div>
    </VStack>
  );
}
