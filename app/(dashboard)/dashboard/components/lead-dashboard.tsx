"use client";

import React from "react";
import Link from "next/link";
import { Users, Calendar, ClipboardList, CheckSquare, Activity, FileText, Settings, Inbox } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";
import { MetricCard } from "@/components/astryx/metric-card";

import { DashboardUser, ManagementStats, UpcomingEvent, AuditLog } from "./dashboard-types";

interface LeadDashboardProps {
  user: DashboardUser;
  managementStats: ManagementStats;
  upcomingEvents?: UpcomingEvent[];
  pendingTasksCount: number;
  recentAuditLogs: AuditLog[];
}

export function LeadDashboard({ user, managementStats, upcomingEvents = [], pendingTasksCount, recentAuditLogs = [] }: LeadDashboardProps) {
  const role = user.role || "lead";
  
  return (
    <VStack gap={8}>
      
      {/* Domain KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Domain Members"
          value={managementStats?.totalMembers || 0}
          icon={<Users />}
        />
        <MetricCard
          title="Active Events"
          value={managementStats?.activeEvents || 0}
          icon={<Calendar />}
        />
        <MetricCard
          title="Total Responses"
          value={managementStats?.totalRegistrations || 0}
          icon={<ClipboardList />}
        />
        <MetricCard
          title="Pending Tasks"
          value={pendingTasksCount}
          icon={<CheckSquare />}
          variant={pendingTasksCount > 0 ? "orange" : "default"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <VStack gap={6} className="md:col-span-2">
          {/* Recent Activity — Real Data */}
          <Card padding={5}>
            <VStack gap={5}>
              <VStack gap={0}>
                <Heading level={3} className="font-semibold text-lg">Recent Activity</Heading>
                <Text type="supporting">Recent actions from your team</Text>
              </VStack>
              
              {recentAuditLogs.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg">
                  <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <Text type="supporting">No recent activity to show.</Text>
                </div>
              ) : (
                <div className="relative border-l border-border ml-3 space-y-6">
                  {recentAuditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 bg-background"><Activity className="w-5 h-5 text-muted-foreground bg-background" /></div>
                      <VStack gap={0}>
                        <Text weight="semibold" className="text-sm capitalize">
                          {log.action.replace(/_/g, " ")}
                        </Text>
                        <Text type="supporting" className="text-xs">
                          {log.entity}{log.details ? ` · ${log.details}` : ""} · {new Date(log.timestamp).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </div>
                  ))}
                </div>
              )}
            </VStack>
          </Card>
        </VStack>

        {/* Quick Actions + Upcoming Events */}
        <VStack gap={6}>
          <Card padding={5}>
            <VStack gap={5}>
              <Heading level={3} className="font-semibold text-lg">
                {role === "finance_lead" ? "Finance Actions" : 
                 role === "marketing_lead" ? "Marketing Actions" :
                 role === "tech_lead" ? "Technical Actions" :
                 role === "event_lead" ? "Event Actions" :
                 "Quick Actions"}
              </Heading>
              
              {role === "finance_lead" ? (
                <VStack gap={2}>
                  <Button variant="secondary" className="justify-start w-full py-3" href="/finance/budget" label="Review Budget" icon={<FileText className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/finance/expenses" label="Approve Expenses" icon={<Activity className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/finance/procurement" label="Procurement" icon={<Inbox className="w-4 h-4 text-muted-foreground" />} />
                </VStack>
              ) : role === "tech_lead" ? (
                <VStack gap={2}>
                  <Button variant="secondary" className="justify-start w-full py-3" href="/admin/inventory" label="Manage Assets" icon={<Settings className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/internal-projects" label="Active Projects" icon={<FileText className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/admin/audit" label="System Logs" icon={<Activity className="w-4 h-4 text-muted-foreground" />} />
                </VStack>
              ) : role === "event_lead" ? (
                <VStack gap={2}>
                  <Button variant="secondary" className="justify-start w-full py-3" href="/manage/events/new" label="Create New Event" icon={<Calendar className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/scanner" label="Check-in Scanner" icon={<ClipboardList className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/manage/forms" label="Feedback Forms" icon={<FileText className="w-4 h-4 text-muted-foreground" />} />
                </VStack>
              ) : role === "marketing_lead" ? (
                <VStack gap={2}>
                  <Button variant="secondary" className="justify-start w-full py-3" href="/communications/newsletters" label="Newsletters" icon={<Inbox className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/communications/social" label="Social Media" icon={<Users className="w-4 h-4 text-muted-foreground" />} />
                </VStack>
              ) : (
                <VStack gap={2}>
                  <Button variant="secondary" className="justify-start w-full py-3" href="/manage/events/new" label="Create New Event" icon={<Calendar className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/manage/forms" label="Form Builder" icon={<FileText className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/manage/recruitment" label="Recruitment" icon={<Users className="w-4 h-4 text-muted-foreground" />} />
                  <Button variant="secondary" className="justify-start w-full py-3" href="/manage/settings" label="Settings" icon={<Settings className="w-4 h-4 text-muted-foreground" />} />
                </VStack>
              )}
            </VStack>
          </Card>
          
          <Card padding={5}>
            <VStack gap={5}>
              <HStack justify="between" align="center">
                <Heading level={3} className="font-semibold text-lg">Upcoming Events</Heading>
                <Link href="/events" className="text-sm text-primary hover:underline font-medium">View all</Link>
              </HStack>
              
              <VStack gap={4}>
                {upcomingEvents.length === 0 ? (
                  <Text type="supporting" className="text-center py-4">No events in the next 7 days.</Text>
                ) : (
                  upcomingEvents.map((event) => (
                    <VStack key={event.id} gap={2} className="p-3 bg-muted/50 rounded-lg">
                      <HStack justify="between" align="start">
                        <VStack gap={0}>
                          <Text weight="semibold" className="text-sm">{event.title}</Text>
                          <Text type="supporting" className="text-xs">
                            {new Date(event.startsAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                        <Badge variant="neutral" label={event.type || "Event"} />
                      </HStack>
                      <HStack gap={2} className="mt-2">
                        <Button size="sm" variant="secondary" className="w-full text-xs h-7" href={`/events/${event.slug}/manage`} label="Manage" />
                        <Button size="sm" className="w-full text-xs h-7" href={`/events/${event.slug}/manage?tab=scanner`} label="Scanner" />
                      </HStack>
                    </VStack>
                  ))
                )}
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </div>
    </VStack>
  );
}
