import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, eventSessions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RegisterButton } from "@/components/events/register-button";
import { generateSignedPass } from "@/lib/passes/qr";
import { IssueCertificatesButton } from "@/components/events/issue-certificates-button";
import { AdminEventControls } from "@/components/events/admin-event-controls";
import { EventSessionsList } from "@/components/events/event-sessions";
import { CancelRegistrationButton } from "@/components/events/cancel-registration-button";
import { RelativeTime } from "@/components/app/relative-time";
import { Card, Heading, Text, Badge, HStack, VStack, Button } from "@astryxdesign/core";
import Link from "next/link";
import { Calendar, Clock, MapPin, CheckCircle2, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  
  const eventData = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const event = eventData[0];
  
  if (!event || (event.status !== "published" && !["owner", "admin", "lead", "co_lead"].includes(session.user.role as string))) {
    notFound();
  }

  const template = await db.query.certificateTemplates.findFirst();
  
  // Get registered count dynamically
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, event.id),
        eq(registrations.status, "confirmed")
      )
    );
  const registeredCount = Number(countResult.count);

  const sessions = await db.select().from(eventSessions).where(eq(eventSessions.eventId, event.id)).orderBy(eventSessions.startTime);

  // Check if user is registered
  const userRegistration = await db.select().from(registrations).where(
    and(
      eq(registrations.eventId, event.id),
      eq(registrations.userId, session.user.id)
    )
  ).limit(1);
  
  const isRegistered = userRegistration.length > 0 && userRegistration[0].status !== "cancelled";
  const registration = userRegistration[0];
  const canRegister = event.status === "published" && (!event.registrationDeadline || new Date() <= new Date(event.registrationDeadline));
  
  let signedPass = null;
  if (isRegistered && registration?.status === "confirmed") {
    signedPass = generateSignedPass({
      userId: session.user.id,
      eventId: event.id,
      passCode: registration.passCode
    });
  }

  return (
    <VStack gap={8} className="max-w-5xl mx-auto">
      {event.coverImage && (
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-muted border shadow-sm relative">
          <div 
            className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-30"
            style={{ backgroundImage: `url(${event.coverImage})` }}
          />
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover relative z-10" />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <VStack gap={8} className="flex-1">
          <VStack gap={4}>
            <HStack align="center" gap={3}>
              <Badge variant="blue" className="uppercase tracking-wider" label={event.type} />
              {event.status !== "published" && (
                <Badge variant={event.status === "draft" ? "neutral" : "warning"} className="uppercase tracking-wider" label={event.status} />
              )}
            </HStack>
            <Heading level={1} className="text-4xl md:text-5xl font-bold tracking-tight">{event.title}</Heading>
            
            <HStack align="center" className="flex-wrap gap-x-6 gap-y-3 text-muted-foreground mt-2">
              <HStack align="center" gap={2}>
                <Clock className="w-5 h-5" />
                <Text>{new Date(event.startsAt).toLocaleString()}</Text>
              </HStack>
              {event.endsAt && (
                <HStack align="center" gap={2}>
                  <Text>Ends: {new Date(event.endsAt).toLocaleString()}</Text>
                </HStack>
              )}
              <HStack align="center" gap={2}>
                <MapPin className="w-5 h-5" />
                <Text>{event.location || "TBA"}</Text>
              </HStack>
            </HStack>
          </VStack>
          
          <VStack gap={4} className="pt-4 border-t border-border">
            <Heading level={2} className="text-2xl font-semibold">About this event</Heading>
            <div className="prose dark:prose-invert max-w-none text-foreground/90">
              <p className="whitespace-pre-wrap leading-relaxed text-lg">{event.description || "No description provided."}</p>
            </div>
          </VStack>

          <div className="pt-4 border-t border-border">
            <EventSessionsList 
              eventId={event.id} 
              sessions={sessions} 
              canManage={["admin", "owner", "lead", "co_lead", "event_lead"].includes(session.user.role as string)} 
            />
          </div>
        </VStack>
        
        <div className="md:w-[340px] w-full shrink-0">
          <Card padding={6} className="sticky top-24 bg-card/50 backdrop-blur-sm border-border shadow-md relative overflow-hidden">
            <VStack gap={6}>
              <VStack gap={1}>
                <HStack align="center" justify="between">
                  <Heading level={3} className="text-xl font-semibold">Registration</Heading>
                </HStack>
                {event.isPaid ? (
                  <Text className="text-3xl font-bold text-foreground">₹{event.price}</Text>
                ) : (
                  <Text className="text-3xl font-bold text-green-600 dark:text-green-500">Free</Text>
                )}
              </VStack>

              <VStack gap={3}>
                <HStack justify="between" align="center" className="py-2 border-b border-border/50">
                  <Text type="supporting">Capacity</Text>
                  <Text weight="medium">
                    {event.capacity ? `${registeredCount} / ${event.capacity}` : "Unlimited"}
                  </Text>
                </HStack>
                
                {event.registrationDeadline && (
                  <HStack justify="between" align="center" className="py-2 border-b border-border/50">
                    <Text type="supporting">Deadline</Text>
                    <Text weight="medium"><RelativeTime date={event.registrationDeadline} format="date" /></Text>
                  </HStack>
                )}
              </VStack>
              
              {!isRegistered ? (
                canRegister ? (
                  <RegisterButton 
                    eventId={event.id} 
                    forms={event.forms as any} 
                    isWaitlist={event.capacity ? registeredCount >= event.capacity : false} 
                  />
                ) : (
                  <div className="bg-muted p-3 rounded-lg text-sm text-center text-muted-foreground border border-border">
                    Registration Closed
                  </div>
                )
              ) : (
                <VStack gap={4} className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50">
                  <HStack align="center" gap={2} className="text-blue-700 dark:text-blue-400 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Registered</span>
                  </HStack>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Status: <span className="capitalize font-semibold">{registration.status}</span>
                  </Text>
                  
                  {signedPass && (
                    <VStack gap={3} className="pt-3 border-t border-blue-200/50 dark:border-blue-900/50">
                      <Text type="supporting" className="text-xs break-all opacity-80">Pass Token: {signedPass.substring(0, 20)}...</Text>
                      <Button href={`/passes/${event.id}`} variant="secondary" className="w-full bg-white dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300" label="View QR Pass" icon={<Ticket className="w-4 h-4" />} />
                    </VStack>
                  )}
                  {new Date() < new Date(event.startsAt) && registration.status !== "cancelled" && (
                    <div className="pt-2">
                      <CancelRegistrationButton eventId={event.id} />
                    </div>
                  )}
                </VStack>
              )}
              
              {["admin", "owner", "lead", "co_lead"].includes(session.user.role as string) && (
                <VStack gap={4} className="pt-6 border-t border-border mt-2">
                  <Heading level={3} className="text-lg font-semibold text-foreground">Admin Controls</Heading>
                  <VStack gap={2}>
                    {template && <IssueCertificatesButton eventId={event.id} templateId={template.id} />}
                    <AdminEventControls eventId={event.id} currentStatus={event.status || "draft"} />
                  </VStack>
                </VStack>
              )}
            </VStack>
          </Card>
        </div>
      </div>
    </VStack>
  );
}
