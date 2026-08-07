"use client";

import React from "react";
import Link from "next/link";
import { Shield, Activity, Bell, FileText, Package, DollarSign, Sparkles, TerminalSquare, Inbox } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";
import { MetricCard } from "@/components/astryx/metric-card";

interface AdminDashboardProps {
  user: any;
  managementStats: any;
  upcomingEvents: any[];
  insights?: any[];
  pendingApprovalsCount: number;
  recentAuditLogs: any[];
  financeSnapshot: { budgetRemaining: number; pendingExpenses: any[] } | null;
  inventoryAlerts: any[];
}

export function AdminDashboard({ 
  user, managementStats, upcomingEvents, insights = [],
  pendingApprovalsCount, recentAuditLogs, financeSnapshot, inventoryAlerts
}: AdminDashboardProps) {
  return (
    <VStack gap={6}>
      
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          
          {/* 2. AI Insights Panel */}
          {insights.length > 0 && (
            <Card variant="blue" padding={4}>
              <VStack gap={4}>
                <HStack align="center" gap={2}>
                  <Sparkles className="text-blue-500 w-5 h-5" />
                  <Heading level={2} className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                    AI Insights
                  </Heading>
                </HStack>
                
                <VStack gap={3}>
                  {insights.map((insight: any) => (
                    <Card key={insight.id} padding={3} variant="transparent" className="bg-white/60 dark:bg-black/20 border-blue-100 dark:border-blue-900">
                      <HStack justify="between" align="start" className="mb-2">
                        <Text weight="medium" className="text-blue-900 dark:text-blue-100">
                          {insight.title}
                        </Text>
                        {insight.metricTrend && (
                          <Badge variant={insight.metricTrend.startsWith('+') ? 'success' : insight.metricTrend.startsWith('-') ? 'error' : 'neutral'} label={insight.metricTrend} />
                        )}
                      </HStack>
                      <Text type="supporting" className="text-blue-700 dark:text-blue-400 mt-1">
                        {insight.description}
                      </Text>
                      {insight.isActionable && insight.actionLink && (
                        <Link href={insight.actionLink} className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                          Take Action →
                        </Link>
                      )}
                    </Card>
                  ))}
                </VStack>
              </VStack>
            </Card>
          )}

          {/* 3. Recent Audit Logs — Real Data */}
          <Card padding={4}>
            <VStack gap={4}>
              <HStack justify="between" align="center">
                <VStack>
                  <Heading level={2} className="font-semibold text-lg">Recent Activity</Heading>
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
                  recentAuditLogs.map((log: any) => (
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
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Finance Snapshot</Heading>
              
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
                        {financeSnapshot.pendingExpenses.map((exp: any) => (
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
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Inventory Alerts</Heading>
              
              {inventoryAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <Text type="supporting">All items are well stocked.</Text>
                </div>
              ) : (
                <>
                  {inventoryAlerts.map((item: any) => (
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
