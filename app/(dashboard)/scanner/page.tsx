import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { events, registrations } from "@/lib/db/schema";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { PageHeader } from "@/components/app/page-header";
import { Selector } from "@astryxdesign/core/Selector";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export default async function ScannerPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  // Only organizers can scan
  await requireRole(["lead", "co_lead", "admin", "owner"]);
  
  const resolvedParams = await searchParams;
  const selectedEventId = resolvedParams.eventId;
  
  // Fetch active/upcoming events
  const activeEvents = await db.select().from(events);
  
  let checkInsToday = 0;
  if (selectedEventId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fallback naive count for now to avoid complex SQL date functions
    const allCheckIns = await db.select({ id: registrations.id, checkedInAt: registrations.checkedInAt })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, selectedEventId),
          eq(registrations.status, 'checked_in')
        )
      );
      
    checkInsToday = allCheckIns.filter(r => r.checkedInAt && new Date(r.checkedInAt) >= today).length;
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      <PageHeader 
        title="ClassScan" 
        description="Scan attendee QR passes for secure check-in."
      />

      <VStack gap={4}>
        <Text weight="medium">Select Event to Scan For</Text>
        <form method="GET" className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Selector
              htmlName="eventId"
              label="Event"
              isLabelHidden
              value={selectedEventId || ""}
              options={activeEvents.map(evt => ({ label: evt.title, value: evt.id }))}
            />
          </div>
          <Button type="submit" label="Set Event" variant="primary" className="w-full sm:w-auto" />
        </form>
      </VStack>

      {selectedEventId && (
        <div className="pt-8 border-t border-border">
          <div className="flex justify-between items-center mb-4">
            <Text type="supporting" className="text-sm">
              <span className="font-semibold text-foreground">{checkInsToday}</span> check-ins today
            </Text>
          </div>
          <QrScanner eventId={selectedEventId} />
        </div>
      )}
    </div>
  );
}
