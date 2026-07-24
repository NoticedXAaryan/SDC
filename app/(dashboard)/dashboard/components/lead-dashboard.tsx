"use client";

import React from "react";
import Link from "next/link";
import { Users, Calendar, ClipboardList, CheckSquare, Activity, Plus, FileText, Settings } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";
import { MetricCard } from "@/components/astryx/metric-card";
import { StatusBadge } from "@/components/astryx/status-badge";

export function LeadDashboard({ user, managementStats, upcomingEvents = [] }: any) {
  return (
    <VStack gap={6}>
      
      {/* 2. Domain KPIs */}
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
          value="12"
          icon={<CheckSquare />}
          variant="orange"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <VStack gap={6} className="md:col-span-2">
          {/* 1. Active Tasks (Reviews pending, approvals, interviews) */}
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={0}>
                <Heading level={2} className="font-semibold text-lg">Active Tasks</Heading>
                <Text type="supporting">Items that need your review or approval</Text>
              </VStack>
              
              <VStack gap={4}>
                <HStack justify="between" align="center" className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-3">
                  <HStack align="center" gap={3}>
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-full"><ClipboardList className="w-4 h-4" /></div>
                    <VStack gap={0}>
                      <Text weight="semibold" className="text-sm">Application Reviews</Text>
                      <Text type="supporting" className="text-xs">5 pending reviews in Tech Domain</Text>
                    </VStack>
                  </HStack>
                  <Button size="sm" href="/manage/recruitment" label="View Applications" />
                </HStack>
                <HStack justify="between" align="center" className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-3">
                  <HStack align="center" gap={3}>
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><FileText className="w-4 h-4" /></div>
                    <VStack gap={0}>
                      <Text weight="semibold" className="text-sm">Certificate Generation</Text>
                      <Text type="supporting" className="text-xs">Batch #452 needs approval</Text>
                    </VStack>
                  </HStack>
                  <Button size="sm" variant="secondary" href="/manage/certificates" label="Issue Certificates" />
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* 4. Team Activity Feed */}
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Team Activity</Heading>
              
              <div className="relative border-l border-border ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Activity className="w-5 h-5 text-muted-foreground bg-background" /></div>
                  <Text weight="semibold" className="text-sm">Event Created</Text>
                  <Text type="supporting" className="text-xs">Aaryan created "Tech Talk 2026" • 2h ago</Text>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Activity className="w-5 h-5 text-muted-foreground bg-background" /></div>
                  <Text weight="semibold" className="text-sm">Form Published</Text>
                  <Text type="supporting" className="text-xs">Jane published "Feedback Form" • 5h ago</Text>
                </div>
              </div>
            </VStack>
          </Card>
        </VStack>

        {/* 3. Quick Actions */}
        <VStack gap={6}>
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Quick Actions</Heading>
              <VStack gap={2}>
                <Button variant="secondary" className="justify-start w-full py-3" href="/manage/events/new" label="Create New Event" icon={<Calendar className="w-4 h-4 text-muted-foreground" />} />
                <Button variant="secondary" className="justify-start w-full py-3" href="/manage/forms" label="Form Builder" icon={<FileText className="w-4 h-4 text-muted-foreground" />} />
                <Button variant="secondary" className="justify-start w-full py-3" href="/manage/recruitment" label="Recruitment" icon={<Users className="w-4 h-4 text-muted-foreground" />} />
                <Button variant="secondary" className="justify-start w-full py-3" href="/manage/settings" label="Settings" icon={<Settings className="w-4 h-4 text-muted-foreground" />} />
              </VStack>
            </VStack>
          </Card>
          
          <Card padding={4}>
            <VStack gap={4}>
              <HStack justify="between" align="center">
                <Heading level={2} className="font-semibold text-lg">Upcoming Events</Heading>
                <Link href="/events" className="text-sm text-blue-600 hover:underline font-medium">View all</Link>
              </HStack>
              
              <VStack gap={4}>
                {upcomingEvents.length === 0 ? (
                  <Text type="supporting" className="text-center py-4">No events in the next 7 days.</Text>
                ) : (
                  upcomingEvents.map((event: any) => (
                    <VStack key={event.id} gap={2} className="p-3 bg-muted/50 rounded-lg">
                      <HStack justify="between" align="start">
                        <VStack gap={0}>
                          <Text weight="semibold" className="text-sm">{event.title}</Text>
                          <Text type="supporting" className="text-xs">
                            {new Date(event.startsAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                        <Badge variant="neutral" label={event.type} />
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
