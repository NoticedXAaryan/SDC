"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, QrCode, FileText, ArrowRight, Zap, Trophy, TrendingUp } from "lucide-react";
import { Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";

import { DashboardUser, UserRegistration, UserApplication, UserCertificate } from "./dashboard-types";

interface StudentDashboardProps {
  user: DashboardUser;
  myRegistrations?: UserRegistration[];
  myApplication?: UserApplication | null;
  myCertificates?: UserCertificate[];
}

export function StudentDashboard({ user, myRegistrations = [], myApplication, myCertificates = [] }: StudentDashboardProps) {
  return (
    <VStack gap={6}>
      
      {/* Overview Stats Row (Inspired by Image 2 - Colorful Metric Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Activity Score */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/20 border-none shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 dark:bg-black/10 rounded-full blur-2xl" />
          <VStack gap={4} className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Zap className="w-5 h-5" />
            </div>
            <VStack gap={1}>
              <Text type="supporting" className="text-sm font-medium text-orange-800/70 dark:text-orange-200/70">Activity Score</Text>
              <h2 className="text-3xl font-bold text-orange-900 dark:text-orange-100">{user.points || 0}</h2>
            </VStack>
          </VStack>
        </div>

        {/* Metric 2: Events Attended */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/20 border-none shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 dark:bg-black/10 rounded-full blur-2xl" />
          <VStack gap={4} className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <VStack gap={1}>
              <Text type="supporting" className="text-sm font-medium text-emerald-800/70 dark:text-emerald-200/70">Events Attended</Text>
              <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{myRegistrations.length}</h2>
            </VStack>
          </VStack>
        </div>

        {/* Metric 3: User Level */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/20 border-none shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 dark:bg-black/10 rounded-full blur-2xl" />
          <VStack gap={4} className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <VStack gap={1}>
              <Text type="supporting" className="text-sm font-medium text-indigo-800/70 dark:text-indigo-200/70">Current Level</Text>
              <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">Level {user.level || 1}</h2>
            </VStack>
          </VStack>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Up Next Card - Image 4 Inspiration */}
        <div className="rounded-3xl p-6 bg-card border border-border shadow-sm col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          
          <VStack gap={5} className="relative z-10">
            <HStack align="center" gap={2} justify="between">
              <HStack align="center" gap={2}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Clock className="w-4 h-4" />
                </div>
                <Heading level={3} className="font-semibold text-xl">Up Next</Heading>
              </HStack>
              <Link href="/events" className="text-sm text-primary hover:underline font-medium flex items-center">
                Browse Events <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </HStack>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRegistrations.length === 0 ? (
                <div className="col-span-full py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
                  <Text type="supporting">You are all caught up! No upcoming events.</Text>
                </div>
              ) : (
                myRegistrations.map((reg) => (
                  <div key={reg.eventId} className="bg-background/80 hover:bg-muted/50 transition-colors border border-border shadow-sm p-4 rounded-2xl flex flex-col justify-between h-32">
                    <VStack gap={1}>
                      <Badge variant="neutral" className="w-fit text-[10px] uppercase font-bold tracking-wider" label="Registered" />
                      <Text weight="semibold" className="text-base line-clamp-1">{reg.eventTitle}</Text>
                    </VStack>
                    <HStack justify="end">
                      <Button variant="secondary" size="sm" href={`/passes/${reg.eventId}`} label="View Pass" className="rounded-full px-4" />
                    </HStack>
                  </div>
                ))
              )}
            </div>
          </VStack>
        </div>

        {/* 2. My Applications Timeline */}
        <div className="rounded-3xl p-6 bg-card border border-border shadow-sm">
          <VStack gap={6}>
            <VStack gap={1}>
              <Heading level={3} className="font-semibold text-xl">My Applications</Heading>
              <Text type="supporting" className="text-sm">Current recruitment cycle status</Text>
            </VStack>
            
            {myApplication ? (
              <div className="relative border-l-2 border-primary/20 ml-3 space-y-8 my-4">
                <div className="relative pl-6">
                  <div className="absolute -left-[11px] top-0 bg-card p-1"><CheckCircle2 className="w-4 h-4 text-primary bg-card" /></div>
                  <Text weight="semibold" className="text-sm text-foreground">Applied</Text>
                  <Text type="supporting" className="text-xs">Application submitted</Text>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[11px] top-0 bg-card p-1">
                    {myApplication.status === "pending" ? <Circle className="w-4 h-4 text-primary fill-primary/20" /> : <CheckCircle2 className="w-4 h-4 text-primary bg-card" />}
                  </div>
                  <Text weight="semibold" className={`text-sm ${myApplication.status === "pending" ? "text-primary" : "text-foreground"}`}>Online Assessment</Text>
                  <Text type="supporting" className="text-xs">{myApplication.status === "pending" ? "Pending review" : "Completed"}</Text>
                </div>
                <div className="relative pl-6 opacity-50">
                  <div className="absolute -left-[11px] top-0 bg-card p-1"><Circle className="w-4 h-4 text-muted-foreground fill-card" /></div>
                  <Text weight="semibold" className="text-sm">Interview</Text>
                  <Text type="supporting" className="text-xs">Not scheduled</Text>
                </div>
                <div className="relative pl-6 opacity-50">
                  <div className="absolute -left-[11px] top-0 bg-card p-1"><Circle className="w-4 h-4 text-muted-foreground fill-card" /></div>
                  <Text weight="semibold" className="text-sm">Result</Text>
                  <Text type="supporting" className="text-xs">TBD</Text>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border mt-2">
                <Text type="supporting" className="text-sm mb-3">No active applications found.</Text>
                <Button variant="primary" size="sm" href="/apply" label="Apply Now" className="rounded-full" />
              </div>
            )}
          </VStack>
        </div>

        <VStack gap={6}>
          {/* 3. My Kit Card (ID Card Layout) */}
          <div className="rounded-3xl p-6 overflow-hidden relative bg-gradient-to-br from-zinc-900 to-black text-white shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
              <div>
                <Badge variant="neutral" className="bg-white/10 text-white border-none mb-6 backdrop-blur-md rounded-full px-3" label="Member ID" />
                <h3 className="text-3xl font-bold text-white tracking-tight">{user.name}</h3>
                <p className="text-zinc-400 text-sm mt-1">@{user.username || "student"}</p>
              </div>
              
              <HStack gap={6} className="mt-8">
                <VStack gap={1}>
                  <Text type="supporting" className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Role</Text>
                  <Text weight="semibold" className="text-zinc-100 capitalize">{user.role}</Text>
                </VStack>
                <VStack gap={1}>
                  <Text type="supporting" className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Joined</Text>
                  <Text weight="semibold" className="text-zinc-100">{user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}</Text>
                </VStack>
              </HStack>
            </div>
          </div>

          {/* 4. Certificate Wallet Card */}
          <div className="rounded-3xl p-6 bg-card border border-border shadow-sm">
            <VStack gap={5}>
              <HStack align="center" justify="between">
                <Heading level={3} className="font-semibold text-xl">Certificate Wallet</Heading>
                <Link href="/certificates" className="text-xs text-muted-foreground hover:text-foreground hover:underline">View All</Link>
              </HStack>
              
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
                {myCertificates && myCertificates.length > 0 ? (
                  myCertificates.map((cert) => (
                    <Link href={`/verify/${cert.verifyId}`} key={cert.id} className="min-w-[220px] snap-center block group">
                      <div className="aspect-[1.4/1] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 flex flex-col justify-between group-hover:shadow-md transition-all group-hover:-translate-y-1">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-black/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate text-blue-900 dark:text-blue-100 mb-1">{cert.data?.eventName || "Certificate"}</p>
                          <p className="text-xs text-blue-700/70 dark:text-blue-300/70 font-medium">Issued {cert.issuedAt ? new Date(cert.issuedAt).getFullYear() : "N/A"}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 w-full bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Text type="supporting" className="text-sm">
                      No certificates earned yet.<br/>Attend events to get one!
                    </Text>
                  </div>
                )}
              </div>
            </VStack>
          </div>
        </VStack>
      </div>
    </VStack>
  );
}
