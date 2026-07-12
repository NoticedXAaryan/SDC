import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { generateSignedPass } from "@/lib/passes/qr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export const dynamic = "force-dynamic";

export default async function PassPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await requireSession();

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) {
    notFound();
  }

  const [registration] = await db.select()
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!registration || registration.status !== "confirmed") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Pass Unavailable</CardTitle>
            <CardDescription>You do not have a confirmed registration for this event.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const signedPass = generateSignedPass({
    userId: session.user.id,
    eventId: event.id,
    passCode: registration.passCode,
  });

  return (
    <div className="flex items-center justify-center py-10">
      <Card className="w-full max-w-sm overflow-hidden">
        <div className="h-32 bg-primary relative">
          {event.coverImage && (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
            <h2 className="text-xl font-bold leading-tight">{event.title}</h2>
            <p className="text-sm opacity-90 truncate">{event.location || "TBA"}</p>
          </div>
        </div>
        
        <CardContent className="pt-8 pb-8 flex flex-col items-center space-y-6">
          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">{session.user.name}</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <QRCodeSVG value={signedPass} size={200} level="M" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Admit One
            </p>
            <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {registration.passCode}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
