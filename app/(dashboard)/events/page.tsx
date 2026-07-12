import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { desc, or, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await requireSession();
  const userRole = session.user.role || "member";
  const canCreate = isManagementRole(userRole);

  // Show all events to management, only published/public to members
  const allEvents = canCreate
    ? await db.select().from(events).orderBy(desc(events.startsAt))
    : await db.select().from(events)
        .where(eq(events.status, "published"))
        .orderBy(desc(events.startsAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Discover and register for upcoming STC events.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/events/create"
            className={cn(buttonVariants(), "gap-2")}
          >
            + Create Event
          </Link>
        )}
      </div>
      
      {allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {canCreate
              ? "Create your first event to get started!"
              : "There are no upcoming events at the moment. Check back later!"}
          </p>
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
                  <span className="text-xs font-medium uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 px-2 py-1 rounded-full">{event.type}</span>
                  <div className="flex items-center gap-2">
                    {event.status !== "published" && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 rounded-full capitalize">{event.status}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{new Date(event.startsAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-6">
                <Link href={`/events/${event.slug}`} className={cn(buttonVariants(), "w-full")}>View Details</Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
