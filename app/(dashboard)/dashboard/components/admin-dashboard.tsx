"use client";

import React from "react";
import Link from "next/link";
import { Shield, Activity, Bell, FileText, Package, DollarSign, Sparkles, TerminalSquare } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";
import { MetricCard } from "@/components/astryx/metric-card";

export function AdminDashboard({ user, managementStats, upcomingEvents, insights = [] }: any) {
  return (
    <VStack gap={6}>
      
      {/* 1. Master Command Center (System Health, Global KPIs) */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="System Health"
          value="99.9%"
          icon={<Activity />}
          progressValue={99.9}
          progressVariant="success"
          progressLabel="All services operational"
          variant="gray"
        />
        <MetricCard
          title="Club Members"
          value={managementStats?.totalMembers || 0}
          icon={<Shield />}
          trend="up"
          trendValue="+12% this month"
        />
        <MetricCard
          title="Global Registrations"
          value={managementStats?.totalRegistrations || 0}
          icon={<FileText />}
          trend="up"
          trendValue="+5% this week"
        />
        <MetricCard
          title="Pending Approvals"
          value="8"
          icon={<Bell />}
          variant="red"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          
          {/* 4. AI Insights Panel */}
          <Card variant="blue" padding={4}>
            <VStack gap={4}>
              <HStack align="center" gap={2}>
                <Sparkles className="text-blue-500 w-5 h-5" />
                <Heading level={2} className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                  AI Insights Panel
                </Heading>
              </HStack>
              <Text type="supporting" className="text-blue-700 dark:text-blue-300">
                Auto-generated summaries of club activity
              </Text>
              
              <VStack gap={3}>
                {insights.length === 0 ? (
                  <Card padding={3} variant="transparent" className="bg-white/60 dark:bg-black/20 border-blue-100 dark:border-blue-900">
                    <Text weight="medium" className="text-blue-900 dark:text-blue-100">
                      Recruitment Velocity Drop
                    </Text>
                    <Text type="supporting" className="text-blue-700 dark:text-blue-400 mt-1">
                      Application submissions have dropped by 40% in the last 48 hours compared to previous cycle.
                    </Text>
                  </Card>
                ) : (
                  insights.map((insight: any) => (
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
                  ))
                )}
              </VStack>
            </VStack>
          </Card>

          {/* 3. Recent Audit Logs */}
          <Card padding={4}>
            <VStack gap={4}>
              <HStack justify="between" align="center">
                <VStack>
                  <Heading level={2} className="font-semibold text-lg">Recent Audit Logs</Heading>
                  <Text type="supporting">Real-time system activity stream</Text>
                </VStack>
                <Button variant="secondary" size="sm" as={Link} href="/admin/audit" label="View All" icon={<TerminalSquare className="w-4 h-4" />} />
              </HStack>
              
              <VStack gap={4}>
                <HStack align="start" gap={4} className="border-b border-border pb-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500">10:42 AM</div>
                  <VStack gap={1}>
                    <Text weight="medium">Finance Expense Approved</Text>
                    <Text type="supporting" className="text-xs">Admin @aaryan approved expense EXP-2042 for $250.00.</Text>
                  </VStack>
                </HStack>
                <HStack align="start" gap={4} className="border-b border-border pb-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500">09:15 AM</div>
                  <VStack gap={1}>
                    <Text weight="medium" className="text-red-500">Certificate Revoked</Text>
                    <Text type="supporting" className="text-xs">Admin @john revoked certificate CERT-9912 (Plagiarism).</Text>
                  </VStack>
                </HStack>
                <HStack align="start" gap={4} className="border-b border-border pb-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500">Yesterday</div>
                  <VStack gap={1}>
                    <Text weight="medium">Role Updated</Text>
                    <Text type="supporting" className="text-xs">System auto-promoted @sarah to Member.</Text>
                  </VStack>
                </HStack>
              </VStack>
            </VStack>
          </Card>
        </div>
        
        {/* 2. Finance & Inventory Snapshot */}
        <VStack gap={6}>
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Finance Snapshot</Heading>
              
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-border">
                <HStack align="center" gap={3}>
                  <div className="bg-green-100 text-green-700 p-2 rounded-full"><DollarSign className="w-4 h-4" /></div>
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm">Budget Remaining</Text>
                    <Text type="supporting" className="text-xs">Q3 Allocation</Text>
                  </VStack>
                </HStack>
                <span className="font-bold font-mono">$4,250</span>
              </div>
              
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pending Approvals</h4>
                <div className="space-y-2 flex flex-col">
                  <Link href="/admin/finance" className="text-sm flex justify-between p-2 hover:bg-muted rounded-md transition">
                    <Text>Venue Booking</Text>
                    <Text weight="medium" className="text-amber-600">$500</Text>
                  </Link>
                  <Link href="/admin/finance" className="text-sm flex justify-between p-2 hover:bg-muted rounded-md transition">
                    <Text>Marketing Materials</Text>
                    <Text weight="medium" className="text-amber-600">$150</Text>
                  </Link>
                </div>
              </div>
            </VStack>
          </Card>

          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Inventory Alerts</Heading>
              
              <div className="flex items-center justify-between border-l-2 border-amber-500 pl-3">
                <VStack gap={0}>
                  <Text weight="medium" className="text-sm">Club T-Shirts (M)</Text>
                  <Text type="supporting" className="text-xs">Low stock warning</Text>
                </VStack>
                <Badge variant="warning" label="5 left" />
              </div>
              <div className="flex items-center justify-between border-l-2 border-red-500 pl-3">
                <VStack gap={0}>
                  <Text weight="medium" className="text-sm">Lanyards</Text>
                  <Text type="supporting" className="text-xs">Out of stock</Text>
                </VStack>
                <Badge variant="error" label="0 left" />
              </div>
              <Button variant="secondary" className="w-full mt-2 text-xs" as={Link} href="/admin/inventory" label="Manage Inventory" icon={<Package className="w-4 h-4" />} />
            </VStack>
          </Card>
        </VStack>
      </div>
    </VStack>
  );
}
