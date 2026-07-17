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
    <div className="max-w-4xl mx-auto space-y-8">
      {event.coverImage && (
        <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden bg-muted">
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {event.type}
              </span>
              {event.status !== "published" && (
                <span className="text-sm font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  {event.status}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight mt-4">{event.title}</h1>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {new Date(event.startsAt).toLocaleString()}
            </div>
            {event.endsAt && (
              <div className="flex items-center gap-2">
                Ends: {new Date(event.endsAt).toLocaleString()}
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {event.location || "TBA"}
            </div>
          </div>
          
          <div className="prose dark:prose-invert max-w-none pt-4">
            <h3 className="text-xl font-semibold mb-2">About this event</h3>
            <p className="whitespace-pre-wrap">{event.description || "No description provided."}</p>
          </div>

          <div className="pt-8 border-t mt-8">
            <EventSessionsList 
              eventId={event.id} 
              sessions={sessions} 
              canManage={["admin", "owner", "lead", "co_lead", "event_lead"].includes(session.user.role as string)} 
            />
          </div>
        </div>
        
        <div className="md:w-80 w-full shrink-0">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6 sticky top-24">
            <div>
              <h3 className="font-semibold text-lg mb-1">Registration</h3>
              {event.isPaid ? (
                <p className="text-2xl font-bold">₹{event.price}</p>
              ) : (
                <p className="text-2xl font-bold text-green-600">Free</p>
              )}
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">
                {event.capacity ? `${registeredCount} / ${event.capacity}` : "Unlimited"}
              </span>
            </div>
            
            {event.registrationDeadline && (
              <div className="flex justify-between items-center py-2 border-b text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium text-right">{new Date(event.registrationDeadline).toLocaleDateString()}</span>
              </div>
            )}
            
            {!isRegistered ? (
              canRegister ? (
                <RegisterButton 
                  eventId={event.id} 
                  forms={event.forms as any} 
                  isWaitlist={event.capacity ? registeredCount >= event.capacity : false} 
                />
              ) : (
                <div className="bg-muted p-3 rounded-lg text-sm text-center text-muted-foreground border">
                  Registration Closed
                </div>
              )
            ) : (
              <div className="space-y-4 p-4 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-950 dark:border-blue-900">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Registered
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Status: <span className="capitalize font-semibold">{registration.status}</span>
                </p>
                
                {signedPass && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2 break-all">Pass Token: {signedPass.substring(0, 20)}...</p>
                    <a href={`/passes/${event.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                      View QR Pass →
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {["admin", "owner", "lead", "co_lead"].includes(session.user.role as string) && (
              <div className="pt-4 border-t mt-4">
                <h3 className="font-semibold text-lg mb-2">Admin Controls</h3>
                {template && <IssueCertificatesButton eventId={event.id} templateId={template.id} />}
                <AdminEventControls eventId={event.id} currentStatus={event.status || "draft"} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
