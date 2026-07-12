import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { QrScanner } from "@/components/scanner/qr-scanner";

export default async function ScannerPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  // Only organizers can scan
  await requireRole(["lead", "co_lead", "admin", "owner"]);
  
  const resolvedParams = await searchParams;
  const selectedEventId = resolvedParams.eventId;
  
  // Fetch active/upcoming events
  const activeEvents = await db.select().from(events);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ClassScan</h1>
        <p className="text-muted-foreground">Scan attendee QR passes for secure check-in.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Event to Scan For</label>
        <form method="GET" className="flex gap-2">
          <select 
            name="eventId" 
            defaultValue={selectedEventId || ""}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>Select an event...</option>
            {activeEvents.map(evt => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Set Event
          </button>
        </form>
      </div>

      {selectedEventId && (
        <div className="pt-4 border-t">
          <QrScanner eventId={selectedEventId} />
        </div>
      )}
    </div>
  );
}
