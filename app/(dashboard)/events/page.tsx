import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { eq } from "drizzle-orm";

export default async function EventsPage() {
  await requireSession();
  
  const allEvents = await db.select().from(events).where(eq(events.visibility, "public"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Discover and register for upcoming STC events.
        </p>
      </div>
      
      {allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-sm text-muted-foreground mt-1">There are no upcoming events at the moment. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEvents.map((event) => (
            <Card key={event.id} className="flex flex-col">
              {event.coverImage && (
                <div className="h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                  <img src={event.coverImage} alt={event.title} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{event.type}</span>
                  <span className="text-xs text-muted-foreground">{new Date(event.startsAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="mt-2 text-xl">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-6">
                <Button asChild className="w-full">
                  <Link href={`/events/${event.slug}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
