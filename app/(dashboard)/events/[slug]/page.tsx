import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RegisterButton } from "@/components/events/register-button";
import { generateSignedPass } from "@/lib/passes/qr";

export default async function EventDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  
  const eventData = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const event = eventData[0];
  
  if (!event) {
    notFound();
  }
  
  // Check if user is registered
  const userRegistration = await db.select().from(registrations).where(
    and(
      eq(registrations.eventId, event.id),
      eq(registrations.userId, session.user.id)
    )
  ).limit(1);
  
  const isRegistered = userRegistration.length > 0;
  const registration = userRegistration[0];
  
  let signedPass = null;
  if (isRegistered && registration.status === "confirmed") {
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
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {event.type}
            </span>
            <h1 className="text-4xl font-bold tracking-tight mt-4">{event.title}</h1>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {new Date(event.startsAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {event.location || "TBA"}
            </div>
          </div>
          
          <div className="prose dark:prose-invert max-w-none pt-4">
            <p>{event.description || "No description provided."}</p>
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
            
            {!isRegistered ? (
              <RegisterButton eventId={event.id} />
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
          </div>
        </div>
      </div>
    </div>
  );
}
