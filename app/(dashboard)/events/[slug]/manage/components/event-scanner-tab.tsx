import { and, desc, eq, gte } from "drizzle-orm";
import { Card, Heading, Text, HStack, VStack } from "@astryxdesign/core";
import { CheckCircle2, ScanLine } from "lucide-react";

import { QrScanner } from "@/components/scanner/qr-scanner";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";

type EventRecord = typeof events.$inferSelect;

export async function EventScannerTab({ event }: { event: EventRecord }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const recentCheckIns = await db.select({
    id: registrations.id,
    checkedInAt: registrations.checkedInAt,
    attendanceMethod: registrations.attendanceMethod,
    name: user.name,
  })
    .from(registrations)
    .innerJoin(user, eq(registrations.userId, user.id))
    .where(and(
      eq(registrations.eventId, event.id),
      eq(registrations.status, "checked_in"),
      gte(registrations.checkedInAt, startOfToday),
    ))
    .orderBy(desc(registrations.checkedInAt))
    .limit(8);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card padding={6}>
        <VStack gap={5}>
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <ScanLine className="size-5" />
              <Heading level={3} className="text-lg">Live attendee scanner</Heading>
            </HStack>
            <Text type="supporting">Scan signed event passes. Offline scans queue on this device and sync when connectivity returns.</Text>
          </VStack>
          <QrScanner eventId={event.id} />
        </VStack>
      </Card>

      <Card padding={6}>
        <VStack gap={4}>
          <div>
            <Heading level={3} className="text-lg">Today’s check-ins</Heading>
            <Text type="supporting" className="text-sm">{recentCheckIns.length} shown from the latest successful scans.</Text>
          </div>
          {recentCheckIns.length > 0 ? (
            <VStack gap={3}>
              {recentCheckIns.map((checkIn) => (
                <HStack key={checkIn.id} align="center" justify="between" className="w-full border-b pb-3 last:border-b-0 last:pb-0">
                  <HStack align="center" gap={3}>
                    <CheckCircle2 className="size-5 text-emerald-500" />
                    <VStack gap={0}>
                      <Text weight="medium" className="text-sm">{checkIn.name}</Text>
                      <Text type="supporting" className="text-xs capitalize">{checkIn.attendanceMethod ?? "qr"} check-in</Text>
                    </VStack>
                  </HStack>
                  <time className="text-xs text-muted-foreground">
                    {checkIn.checkedInAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </HStack>
              ))}
            </VStack>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Successful scans will appear here immediately after refresh.
            </div>
          )}
        </VStack>
      </Card>
    </div>
  );
}
