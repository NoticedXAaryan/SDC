import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { generateSignedPass } from "@/lib/passes/qr";
import { RotatingQR } from "@/components/passes/rotating-qr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PassPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await requireSession();
  
  const eventData = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  const event = eventData[0];
  
  if (!event) {
    notFound();
  }
  
  const userRegistration = await db.select().from(registrations).where(
    and(
      eq(registrations.eventId, eventId),
      eq(registrations.userId, session.user.id)
    )
  ).limit(1);
  
  if (userRegistration.length === 0) {
    redirect(`/events/${event.slug}`);
  }
  
  const registration = userRegistration[0];
  
  if (registration.status !== "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Registration not confirmed</h2>
        <p className="text-muted-foreground">Your status is currently: {registration.status}</p>
        <Link href={`/events/${event.slug}`} className={cn(buttonVariants())}>Back to Event</Link>
      </div>
    );
  }
  
  const signedPass = generateSignedPass({
    userId: session.user.id,
    eventId: event.id,
    passCode: registration.passCode
  });

  return (
    <div className="max-w-md mx-auto space-y-8 py-8">
      <Card className="overflow-hidden border-2 shadow-lg">
        <div className="h-32 bg-blue-600 flex items-center justify-center p-6 text-white text-center">
          <div>
            <h1 className="text-2xl font-bold line-clamp-1">{event.title}</h1>
            <p className="text-blue-100 mt-1">{new Date(event.startsAt).toLocaleDateString()}</p>
          </div>
        </div>
        <CardHeader className="text-center pb-2">
          <CardTitle>Entry Pass</CardTitle>
          <CardDescription>
            Show this QR code at the entrance to check in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
          <RotatingQR 
            initialPass={signedPass} 
            eventId={event.id}
            passCode={registration.passCode}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Link href={`/events/${event.slug}`} className={cn(buttonVariants({ variant: "outline" }))}>← Back to Event</Link>
      </div>
    </div>
  );
}
