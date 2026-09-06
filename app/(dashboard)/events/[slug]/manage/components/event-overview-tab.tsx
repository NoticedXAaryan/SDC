import { and, desc, eq, ne, sql } from "drizzle-orm";
import { Card, Heading, Text, HStack, VStack } from "@astryxdesign/core"
import { ActivityTimeline, type ActivityItem } from "@/components/app/activity-timeline"
import { Calendar, Users, Ticket, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db";
import { auditLogs, events, registrations, user } from "@/lib/db/schema";

type EventRecord = typeof events.$inferSelect;

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SDC";
}

function activitySummary(action: string): string {
  const summaries: Record<string, string> = {
    event_create: "created this event",
    event_update: "updated event details",
    event_approve: "approved and published this event",
    event_post_event_update: "updated the post-event report",
    certificate_template_create: "prepared a certificate template",
    certificate_issue: "issued an attendee certificate",
  };
  return summaries[action] ?? action.replaceAll("_", " ");
}

export async function EventOverviewTab({ event }: { event: EventRecord }) {
  const [registrationRows, activityRows] = await Promise.all([
    db.select({
      registered: sql<number>`count(*) filter (where ${registrations.status} <> 'cancelled')`,
      attendanceBase: sql<number>`count(*) filter (where ${registrations.status} in ('confirmed', 'checked_in'))`,
      checkedIn: sql<number>`count(*) filter (where ${registrations.status} = 'checked_in')`,
    }).from(registrations).where(eq(registrations.eventId, event.id)),
    db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
      actorName: user.name,
      actorImage: user.image,
    })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorId, user.id))
      .where(eq(auditLogs.entityId, event.id))
      .orderBy(desc(auditLogs.timestamp))
      .limit(6),
  ]);

  const registeredCount = Number(registrationRows[0]?.registered ?? 0);
  const attendanceBase = Number(registrationRows[0]?.attendanceBase ?? 0);
  const checkedInCount = Number(registrationRows[0]?.checkedIn ?? 0);
  const attendanceRate = attendanceBase > 0 ? Math.round((checkedInCount / attendanceBase) * 100) : 0;
  const activities: ActivityItem[] = activityRows.map((row) => {
    const actorName = row.actorName ?? "System";
    return {
      id: row.id,
      actor: { name: actorName, avatar: row.actorImage ?? undefined, initials: initials(actorName) },
      action: row.action.replaceAll("_", " "),
      summary: activitySummary(row.action),
      timestamp: row.timestamp,
      details: row.details && !row.details.trim().startsWith("{") ? row.details : undefined,
    };
  });

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting">Registrations</Text>
                <HStack align="center" justify="between">
                  <span className="text-3xl font-bold tabular-nums">{registeredCount}</span>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </HStack>
              </VStack>
              <Text type="supporting" className="text-xs">
                Capacity: {event.capacity || "Unlimited"}
              </Text>
            </VStack>
          </Card>
          
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting">Check-ins</Text>
                <HStack align="center" justify="between">
                  <span className="text-3xl font-bold tabular-nums">{checkedInCount}</span>
                  <Ticket className="w-5 h-5 text-muted-foreground" />
                </HStack>
              </VStack>
              <Text type="supporting" className="text-xs">
                {attendanceRate}% attendance rate
              </Text>
            </VStack>
          </Card>
          
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting">Event Date</Text>
                <HStack align="center" justify="between">
                  <span className="text-xl font-bold">{new Date(event.startsAt).toLocaleDateString()}</span>
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </HStack>
              </VStack>
              <Text type="supporting" className="text-xs">
                {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </VStack>
          </Card>
        </div>

        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Recent Activity</Heading>
            <ActivityTimeline activities={activities} />
          </VStack>
        </Card>
      </div>

      <div className="space-y-6">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Quick Actions</Heading>
            <VStack gap={2}>
              <Link 
                href={`/events/${event.slug}/manage?tab=scanner`}
                className="flex items-center p-3 w-full rounded-lg hover:bg-muted transition-colors border"
              >
                <div className="bg-primary/10 p-2 rounded-md mr-3">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Open Scanner</p>
                  <p className="text-xs text-muted-foreground">Check in attendees</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              
              <Link 
                href={`/events/${event.slug}/manage?tab=communications`}
                className="flex items-center p-3 w-full rounded-lg hover:bg-muted transition-colors border"
              >
                <div className="bg-blue-500/10 p-2 rounded-md mr-3">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Send Update</p>
                  <p className="text-xs text-muted-foreground">Email registered users</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </VStack>
          </VStack>
        </Card>
      </div>
    </div>
  )
}
