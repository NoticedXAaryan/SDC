import { eq } from "drizzle-orm";
import { Heading, Text } from "@astryxdesign/core";

import { EventSessionsList } from "@/components/events/event-sessions";
import { db } from "@/lib/db";
import { eventSessions, events } from "@/lib/db/schema";

type EventRecord = typeof events.$inferSelect;

export async function EventSessionsTab({ event }: { event: EventRecord }) {
  const sessions = await db.select()
    .from(eventSessions)
    .where(eq(eventSessions.eventId, event.id))
    .orderBy(eventSessions.startTime);

  return (
    <div className="space-y-6">
      <div>
        <Heading level={4}>Session schedule</Heading>
        <Text type="supporting">Build the agenda and keep every session inside the event timeframe.</Text>
      </div>
      <EventSessionsList eventId={event.id} sessions={sessions} canManage />
    </div>
  );
}
