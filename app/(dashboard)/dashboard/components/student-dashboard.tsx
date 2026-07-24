"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, QrCode, FileText } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";

export function StudentDashboard({ user, myRegistrations = [], myApplication }: any) {
  return (
    <VStack gap={6}>
      
      {/* 1. Up Next Card */}
      <Card padding={4} variant="blue" className="border-blue-200">
        <VStack gap={4}>
          <HStack align="center" gap={2}>
            <Clock className="w-5 h-5 text-blue-600" />
            <Heading level={2} className="font-semibold text-lg text-blue-900 dark:text-blue-100">Up Next</Heading>
          </HStack>
          <Text type="supporting" className="text-blue-700 dark:text-blue-300">Your pending actions and upcoming events</Text>
          
          <VStack gap={3}>
            {myRegistrations.length === 0 ? (
              <Text type="supporting">You are all caught up!</Text>
            ) : (
              myRegistrations.map((reg: any) => (
                <HStack key={reg.eventId} justify="between" align="center" className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm text-blue-900 dark:text-blue-100">{reg.eventTitle}</Text>
                    <Text type="supporting" className="text-xs text-blue-700 dark:text-blue-300">Upcoming Event</Text>
                  </VStack>
                  <Button variant="secondary" size="sm" href={`/passes/${reg.eventId}`} label="View Pass" />
                </HStack>
              ))
            )}
            {/* Mock pending form to show concept */}
            <HStack justify="between" align="center" className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
              <VStack gap={0}>
                <Text weight="semibold" className="text-sm text-blue-900 dark:text-blue-100">Post-Event Feedback</Text>
                <Text type="supporting" className="text-xs text-blue-700 dark:text-blue-300">Missing Info</Text>
              </VStack>
              <Button size="sm" href={`/forms/feedback`} className="bg-amber-600 hover:bg-amber-700 text-white border-0" label="Give Feedback" />
            </HStack>
          </VStack>
        </VStack>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 2. My Applications Timeline */}
        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={0}>
              <Heading level={2} className="font-semibold text-lg">My Applications</Heading>
              <Text type="supporting">Current recruitment cycle status</Text>
            </VStack>
            
            {myApplication ? (
              <div className="relative border-l border-border ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><CheckCircle2 className="w-5 h-5 text-blue-600 bg-background" /></div>
                  <Text weight="semibold" className="text-sm">Applied</Text>
                  <Text type="supporting" className="text-xs">Application submitted</Text>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background">
                    {myApplication.status === "pending" ? <Circle className="w-5 h-5 text-muted-foreground fill-background" /> : <CheckCircle2 className="w-5 h-5 text-blue-600 bg-background" />}
                  </div>
                  <Text weight="semibold" className="text-sm">Online Assessment (OA)</Text>
                  <Text type="supporting" className="text-xs">{myApplication.status === "pending" ? "Pending review" : "Completed"}</Text>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Circle className="w-5 h-5 text-muted-foreground fill-background" /></div>
                  <Text weight="semibold" className="text-sm">Interview</Text>
                  <Text type="supporting" className="text-xs">Not scheduled</Text>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Circle className="w-5 h-5 text-muted-foreground fill-background" /></div>
                  <Text weight="semibold" className="text-sm">Result</Text>
                  <Text type="supporting" className="text-xs">TBD</Text>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Text type="supporting" className="text-sm">
                  No active applications. <Link href="/apply" className="text-blue-600 hover:underline">Apply now</Link>
                </Text>
              </div>
            )}
          </VStack>
        </Card>

        <VStack gap={6}>
          {/* 3. My Kit Card (ID Card Layout) */}
          <Card padding={6} className="overflow-hidden relative bg-gradient-to-br from-zinc-900 to-black text-white border-zinc-800">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <Badge variant="neutral" className="bg-white/10 text-zinc-300 border-zinc-700 mb-4" label="Member ID" />
              <h3 className="text-2xl font-bold text-white">{user.name}</h3>
              <p className="text-zinc-400 mb-4">@{user.username || "student"}</p>
              
              <HStack gap={4} className="mt-6">
                <VStack gap={0}>
                  <Text type="supporting" className="text-zinc-500 text-xs">Role</Text>
                  <Text weight="medium" className="text-zinc-200 capitalize">{user.role}</Text>
                </VStack>
                <VStack gap={0}>
                  <Text type="supporting" className="text-zinc-500 text-xs">Joined</Text>
                  <Text weight="medium" className="text-zinc-200">2026</Text>
                </VStack>
              </HStack>
            </div>
          </Card>

          {/* 4. Certificate Wallet Card */}
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2} className="font-semibold text-lg">Certificate Wallet</Heading>
              
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x">
                {/* Mock certificates for visual slider */}
                {[1, 2, 3].map((i) => (
                  <Link href="/certificates" key={i} className="min-w-[200px] snap-center block">
                    <div className="aspect-[1.4/1] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 border border-border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate text-foreground">Workshop {i}</p>
                        <p className="text-xs text-muted-foreground">Issued 2026</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </VStack>
          </Card>
        </VStack>
      </div>
    </VStack>
  );
}
