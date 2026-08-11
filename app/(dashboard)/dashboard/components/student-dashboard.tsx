"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, QrCode, FileText } from "lucide-react";
import { Card, Button, Text, HStack, VStack, Badge, Heading } from "@astryxdesign/core";

import { DashboardUser, UserRegistration, UserApplication, UserCertificate } from "./dashboard-types";

interface StudentDashboardProps {
  user: DashboardUser;
  myRegistrations?: UserRegistration[];
  myApplication?: UserApplication | null;
  myCertificates?: UserCertificate[];
}

export function StudentDashboard({ user, myRegistrations = [], myApplication, myCertificates = [] }: StudentDashboardProps) {
  return (
    <VStack gap={8}>
      
      {/* 1. Up Next Card */}
      <Card padding={5} className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <VStack gap={4}>
          <HStack align="center" gap={2}>
            <Clock className="w-5 h-5 text-primary" />
            <Heading level={3} className="font-semibold text-lg text-primary">Up Next</Heading>
          </HStack>
          <Text type="supporting">Your pending actions and upcoming events</Text>
          
          <VStack gap={3}>
            {myRegistrations.length === 0 ? (
              <Text type="supporting">You are all caught up!</Text>
            ) : (
              myRegistrations.map((reg) => (
                <HStack key={reg.eventId} justify="between" align="center" className="bg-background/80 backdrop-blur border border-border/50 shadow-sm p-3 rounded-lg">
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm">{reg.eventTitle}</Text>
                    <Text type="supporting" className="text-xs">Upcoming Event</Text>
                  </VStack>
                  <Button variant="secondary" size="sm" href={`/passes/${reg.eventId}`} label="View Pass" />
                </HStack>
              ))
            )}

          </VStack>
        </VStack>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 2. My Applications Timeline */}
        <Card padding={5}>
          <VStack gap={5}>
            <VStack gap={0}>
              <Heading level={3} className="font-semibold text-lg">My Applications</Heading>
              <Text type="supporting">Current recruitment cycle status</Text>
            </VStack>
            
            {myApplication ? (
              <div className="relative border-l border-border ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><CheckCircle2 className="w-5 h-5 text-primary bg-background" /></div>
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm">Applied</Text>
                    <Text type="supporting" className="text-xs">Application submitted</Text>
                  </VStack>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background">
                    {myApplication.status === "pending" ? <Circle className="w-5 h-5 text-muted-foreground fill-background" /> : <CheckCircle2 className="w-5 h-5 text-primary bg-background" />}
                  </div>
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm">Online Assessment (OA)</Text>
                    <Text type="supporting" className="text-xs">{myApplication.status === "pending" ? "Pending review" : "Completed"}</Text>
                  </VStack>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Circle className="w-5 h-5 text-muted-foreground fill-background" /></div>
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm">Interview</Text>
                    <Text type="supporting" className="text-xs">Not scheduled</Text>
                  </VStack>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Circle className="w-5 h-5 text-muted-foreground fill-background" /></div>
                  <VStack gap={0}>
                    <Text weight="semibold" className="text-sm">Result</Text>
                    <Text type="supporting" className="text-xs">TBD</Text>
                  </VStack>
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
          <Card padding={6} variant="muted" className="overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10">
              <Badge variant="neutral" className="mb-4" label="Member ID" />
              <Heading level={3} className="text-2xl font-bold">{user.name}</Heading>
              <Text type="supporting" className="mb-4">@{user.username || "student"}</Text>
              
              <HStack gap={4} className="mt-6">
                <VStack gap={0}>
                  <Text type="supporting" className="text-xs">Role</Text>
                  <Text weight="medium" className="capitalize">{user.role}</Text>
                </VStack>
                <VStack gap={0}>
                  <Text type="supporting" className="text-xs">Joined</Text>
                  <Text weight="medium">{user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}</Text>
                </VStack>
              </HStack>
            </div>
          </Card>

          {/* 4. Certificate Wallet Card */}
          <Card padding={5}>
            <VStack gap={5}>
              <Heading level={3} className="font-semibold text-lg">Certificate Wallet</Heading>
              
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x">
                {myCertificates && myCertificates.length > 0 ? (
                  myCertificates.map((cert) => (
                    <Link href={`/verify/${cert.verifyId}`} key={cert.id} className="min-w-[200px] snap-center block">
                      <div className="aspect-[1.4/1] bg-gradient-to-br from-primary/5 to-primary/10 border border-border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold truncate text-foreground">{cert.data?.eventName || "Certificate"}</p>
                          <p className="text-xs text-muted-foreground">Issued {cert.issuedAt ? new Date(cert.issuedAt).getFullYear() : "N/A"}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6 w-full">
                    <Text type="supporting" className="text-sm">
                      No certificates earned yet. Attend events to get one!
                    </Text>
                  </div>
                )}
              </div>
            </VStack>
          </Card>
        </VStack>
      </div>
    </VStack>
  );
}
