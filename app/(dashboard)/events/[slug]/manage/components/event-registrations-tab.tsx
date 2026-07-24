import { db } from "@/lib/db";
import { registrations, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, Heading, Text, VStack } from "@astryxdesign/core";
import { EventRegistrationsClient } from "./event-registrations-client";

export async function EventRegistrationsTab({ event }: { event: any }) {
  const registrationsData = await db
    .select({
      id: registrations.id,
      status: registrations.status,
      checkedInAt: registrations.checkedInAt,
      createdAt: registrations.createdAt,
      userId: registrations.userId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    })
    .from(registrations)
    .innerJoin(user, eq(registrations.userId, user.id))
    .where(eq(registrations.eventId, event.id));

  return (
    <Card padding={6}>
      <VStack gap={6}>
        <VStack gap={1}>
          <Heading level={3} className="text-lg">Registrations</Heading>
          <Text type="supporting">Manage attendees and waitlist for {event.title}</Text>
        </VStack>
        
        <EventRegistrationsClient registrations={registrationsData} />
      </VStack>
    </Card>
  );
}
