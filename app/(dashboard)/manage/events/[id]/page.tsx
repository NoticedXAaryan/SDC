import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, eventSessions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Archive, Eye, EyeOff, FileSpreadsheet, Award } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EventSessionsList } from "@/components/events/event-sessions";

export const dynamic = "force-dynamic";

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin(); // ensures "owner", "admin", "lead", "co_lead" etc.
  
  const eventData = await db.select().from(events).where(eq(events.id, id)).limit(1);
  const event = eventData[0];
  
  if (!event) {
    notFound();
  }

  // Get registered count
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(eq(registrations.eventId, event.id));
  const registeredCount = Number(countResult.count);

  const sessions = await db.select().from(eventSessions).where(eq(eventSessions.eventId, event.id)).orderBy(eventSessions.startTime);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage: {event.title}</h1>
          <p className="text-muted-foreground">Event ID: {event.id}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/create?duplicate=${event.id}`}>
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${event.slug}`}>
              <Edit className="w-4 h-4 mr-2" /> Edit Details
            </Link>
          </Button>
          <form action={`/api/events/${event.id}/publish`} method="POST">
            <Button variant="outline" size="sm" type="submit">
              {event.status === "published" ? (
                <><EyeOff className="w-4 h-4 mr-2" /> Unpublish</>
              ) : (
                <><Eye className="w-4 h-4 mr-2" /> Publish</>
              )}
            </Button>
          </form>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/api/events/${event.id}/export-csv`}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
            </Link>
          </Button>
          <form action={`/api/events/${event.id}/certificates/generate`} method="POST">
            <Button variant="outline" size="sm" type="submit">
              <Award className="w-4 h-4 mr-2" /> Generate Certificates
            </Button>
          </form>
          <form action={`/api/events/${event.id}/archive`} method="POST">
            <Button variant="destructive" size="sm" type="submit">
              <Archive className="w-4 h-4 mr-2" /> Archive
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{event.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registrations</span>
              <span className="font-medium">{registeredCount} {event.capacity ? `/ ${event.capacity}` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{event.type}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Sessions & Attendance</h2>
        <EventSessionsList 
          eventId={event.id} 
          sessions={sessions} 
          canManage={true} 
        />
      </div>
    </div>
  );
}
