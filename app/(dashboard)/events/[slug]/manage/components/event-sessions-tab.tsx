"use client";

import { Card, Heading, Text, VStack, HStack, Button } from "@astryxdesign/core";
import { Plus, Calendar, Clock, MapPin } from "lucide-react";
import { EmptyState } from "@/components/astryx/empty-state";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function EventSessionsTab({ event }: { event: any }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app this would fetch from /api/events/${event.id}/sessions
    // For now we'll just simulate an empty state since the API might not exist yet
    setLoading(false);
  }, [event.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={4}>Sessions Schedule</Heading>
          <Text type="supporting">Manage the agenda and individual sessions for this event.</Text>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} label="Add Session" onClick={() => alert("Add Session Modal (Coming Soon)")} />
      </div>

      {loading ? (
        <Card padding={6}>
          <VStack gap={4}>
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
          </VStack>
        </Card>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-muted-foreground" />}
          title="No sessions created"
          description="Add sessions to build the agenda for your event."
          actionLabel="Add Session"
          onAction={() => alert("Add Session Modal (Coming Soon)")}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session, i) => (
            <Card key={i} padding={4}>
              <HStack justify="between" align="center">
                <VStack gap={1}>
                  <Text weight="bold">{session.title}</Text>
                  <HStack gap={3} className="text-muted-foreground text-sm">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}</span>
                    {session.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.location}</span>}
                  </HStack>
                </VStack>
                <Button variant="secondary" label="Edit" onClick={() => alert("Edit Modal")} />
              </HStack>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
