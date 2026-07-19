import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { desc, or, eq, and, gt, lt, ilike, sql, inArray } from "drizzle-orm";
import { EventFilters } from "@/components/events/event-filters";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Calendar, Plus } from "lucide-react";
import { ResourceActionMenu } from "@/components/app/resource-action-menu";
import { RelativeTime } from "@/components/app/relative-time";

export const revalidate = 60; // DFD 15: ISR 60s (applies to parts not using headers)

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filter = (resolvedSearchParams.filter as string) || "upcoming";
  const query = (resolvedSearchParams.q as string) || "";

  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-10 w-full mb-8" />}>
        <PageHeaderSection />
      </Suspense>
      
      <Suspense>
        <EventFilters />
      </Suspense>

      <Suspense fallback={<EventsSkeleton />}>
        <EventsList filter={filter} query={query} />
      </Suspense>
    </div>
  );
}

async function PageHeaderSection() {
  const session = await requireSession();
  const userRole = session.user.role || "member";
  const canCreate = isManagementRole(userRole);

  return (
    <PageHeader
      title="Events"
      description="Discover and register for upcoming SDC events."
      primaryAction={canCreate ? (
        <Button asChild><Link href="/events/create"><Plus className="w-4 h-4 mr-2" /> Create Event</Link></Button>
      ) : undefined}
    />
  );
}
async function EventsList({ filter, query }: { filter: string; query: string }) {
  const session = await requireSession();
  const userId = session.user.id;
  const userRole = session.user.role || "member";
  const canCreate = isManagementRole(userRole);

  const now = new Date();

  // Base conditions
  let conditions = canCreate ? undefined : eq(events.status, "published");

  // Status Filter
  if (filter === "upcoming") {
    const upcomingCond = gt(events.startsAt, now);
    conditions = conditions ? and(conditions, upcomingCond) : upcomingCond;
  } else if (filter === "ongoing") {
    const ongoingCond = and(lt(events.startsAt, now), gt(events.endsAt, now));
    conditions = conditions ? and(conditions, ongoingCond) : ongoingCond;
  } else if (filter === "past") {
    const pastCond = lt(events.endsAt, now);
    conditions = conditions ? and(conditions, pastCond) : pastCond;
  }

  // Query Filter
  if (query) {
    const queryCond = ilike(events.title, `%${query}%`);
    conditions = conditions ? and(conditions, queryCond) : queryCond;
  }

  let allEvents = [];

  if (filter === "my-registrations") {
    // Join with registrations
    const results = await db.select({ event: events })
      .from(events)
      .innerJoin(registrations, eq(events.id, registrations.eventId))
      .where(and(eq(registrations.userId, userId), conditions))
      .orderBy(desc(events.startsAt));
    allEvents = results.map(r => r.event);
  } else {
    allEvents = await db.select().from(events)
      .where(conditions)
      .orderBy(desc(events.startsAt));
  }
  if (allEvents.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No events found"
        description={
          canCreate && !query
            ? "Create your first event to get started!"
            : "Try adjusting your filters or search query."
        }
        action={
          canCreate && !query ? (
            <Button asChild>
              <Link href="/events/create">Create Event</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  // Batch-fetch registration counts for all events with capacity
  const eventIds = allEvents.map(e => e.id);
  const regCounts = eventIds.length > 0 ? await db.select({
    eventId: registrations.eventId,
    count: sql<number>`count(*)`,
  })
    .from(registrations)
    .where(and(
      inArray(registrations.eventId, eventIds),
      eq(registrations.status, "confirmed")
    ))
    .groupBy(registrations.eventId) : [];

  const countMap = new Map(regCounts.map(r => [r.eventId, Number(r.count)]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {allEvents.map((event) => {
        // Capacity Bar Logic (Green/Yellow/Red)
        let capacityColor = "bg-green-500";
        let capacityPercentage = 0;
        
        if (event.capacity && event.capacity > 0) {
           const registered = countMap.get(event.id) || 0;
           capacityPercentage = Math.min(100, Math.round((registered / event.capacity) * 100));
           if (capacityPercentage > 90) capacityColor = "bg-red-500";
           else if (capacityPercentage > 75) capacityColor = "bg-yellow-500";
        }

        return (
          <Card key={event.id} className="flex flex-col overflow-hidden group">
            {event.coverImage ? (
              <div className="h-48 w-full overflow-hidden bg-muted relative">
                {/* Blur placeholder effect */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-50"
                  style={{ backgroundImage: `url(${event.coverImage})` }}
                />
                <img 
                  src={event.coverImage} 
                  alt={event.title} 
                  className="object-cover w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105" 
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-48 w-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            
            {/* Capacity Bar */}
            {event.capacity && event.capacity > 0 && (
              <div className="w-full h-1.5 bg-muted/50">
                <div className={`h-full ${capacityColor} transition-all duration-500`} style={{ width: `${capacityPercentage}%` }} />
              </div>
            )}

            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 px-2 py-1 rounded-full">
                  {event.type}
                </span>
                <div className="flex items-center gap-2">
                  {event.status !== "published" && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 rounded-full capitalize">
                      {event.status}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    <RelativeTime date={event.startsAt} format="date" />
                  </span>
                </div>
              </div>
              <CardTitle className="mt-2 text-xl line-clamp-1">{event.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-6 flex items-center justify-between gap-2">
              <Button asChild className="w-full">
                <Link href={`/events/${event.slug}`}>
                  {canCreate ? "Manage Event" : "View Details"}
                </Link>
              </Button>
              {canCreate && (
                <ResourceActionMenu 
                  label={`Manage ${event.title}`}
                  actions={{
                    primary: [
                      { label: "Manage", href: `/events/${event.slug}` },
                      { label: "Edit", href: `/events/${event.slug}/edit` },
                    ],
                    management: [
                      { label: "Open scanner", href: `/scanner?event=${event.id}` },
                      { label: "Export roster", href: `/api/events/${event.id}/export` },
                    ],
                    destructive: [
                      { label: "Archive", href: `/events/${event.slug}/archive` },
                    ]
                  }}
                />
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="flex flex-col overflow-hidden">
          <Skeleton className="h-48 w-full rounded-none" />
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4 mt-4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </CardHeader>
          <CardFooter className="mt-auto pt-6 flex items-center justify-between gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
