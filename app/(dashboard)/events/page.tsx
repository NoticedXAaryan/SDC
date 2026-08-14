/**
 * Events Listing Page — SOC workspace template: IndexTableTemplate.
 * Doc ref: §02 "Run an event" journey, §03 IndexTableTemplate, §09 accessibility.
 *
 * States covered: loading (loading.tsx), empty (EmptyCosmicState), error (error.tsx),
 * forbidden (role-gated create button — backend also enforces),
 * desktop (card grid), mobile (responsive cards with 44px touch targets).
 *
 * Astryx-first: Card, HStack, VStack, Badge, Button, EmptyState from @astryxdesign/core.
 * SOC layer: EmptyCosmicState, CosmicSurface.
 * Shadcn exception: Skeleton from @/components/ui/skeleton (stable, well-tested).
 */
import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import Link from "next/link";
import { desc, or, eq, and, gt, lt, ilike, sql, inArray } from "drizzle-orm";
import { EventFilters } from "@/components/events/event-filters";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyCosmicState } from "@/components/design-system";
import { Calendar, Plus, MapPin, Users, Clock } from "lucide-react";
import { ResourceActionMenu } from "@/components/app/resource-action-menu";
import { RelativeTime } from "@/components/app/relative-time";
import { Card, Heading, Text, Button, Badge, HStack, VStack } from "@astryxdesign/core";

export const revalidate = 60;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filter = (resolvedSearchParams.filter as string) || "upcoming";
  const query = (resolvedSearchParams.q as string) || "";

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-enter">
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
      description="Discover and register for SDC events, workshops, and hackathons."
      eyebrow="Club Hub"
      primaryAction={
        canCreate ? (
          <Button
            href="/events/create"
            label="Create event"
            icon={<Plus aria-hidden="true" size={16} />}
          />
        ) : undefined
      }
    />
  );
}

async function EventsList({ filter, query }: { filter: string; query: string }) {
  const session = await requireSession();
  const userId = session.user.id;
  const userRole = session.user.role || "member";
  const canCreate = isManagementRole(userRole);

  const now = new Date();

  // Build conditions
  let conditions = canCreate ? undefined : eq(events.status, "published");

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

  if (query) {
    const queryCond = ilike(events.title, `%${query}%`);
    conditions = conditions ? and(conditions, queryCond) : queryCond;
  }

  let allEvents: typeof events.$inferSelect[] = [];

  if (filter === "my-registrations") {
    const results = await db
      .select({ event: events })
      .from(events)
      .innerJoin(registrations, eq(events.id, registrations.eventId))
      .where(and(eq(registrations.userId, userId), conditions))
      .orderBy(desc(events.startsAt));
    allEvents = results.map((r) => r.event);
  } else {
    allEvents = await db
      .select()
      .from(events)
      .where(conditions)
      .orderBy(desc(events.startsAt));
  }

  // Capacity data
  const eventIds = allEvents.map((e) => e.id);
  const regCounts =
    eventIds.length > 0
      ? await db
          .select({
            eventId: registrations.eventId,
            count: sql<number>`count(*)`,
          })
          .from(registrations)
          .where(
            and(
              inArray(registrations.eventId, eventIds),
              eq(registrations.status, "confirmed")
            )
          )
          .groupBy(registrations.eventId)
      : [];

  const countMap = new Map(regCounts.map((r) => [r.eventId, Number(r.count)]));

  // Empty state
  if (allEvents.length === 0) {
    return (
      <EmptyCosmicState
        title={query ? "No events match your search" : "No events found"}
        description={
          canCreate && !query
            ? "Create your first event to get started."
            : query
              ? "Try adjusting your search or clearing the filter."
              : "Check back later or browse a different filter."
        }
        illustration="orbit"
        size="md"
        action={
          canCreate && !query ? (
            <Button href="/events/create" label="Create first event" variant="primary" />
          ) : undefined
        }
      />
    );
  }

  return (
    <section aria-label={`${filter} events, ${allEvents.length} found`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {allEvents.map((event, i) => {
          const registered = countMap.get(event.id) || 0;
          const capacityPct =
            event.capacity && event.capacity > 0
              ? Math.min(100, Math.round((registered / event.capacity) * 100))
              : 0;
          const capacityVariant =
            capacityPct > 90 ? "error" : capacityPct > 75 ? "warning" : "success";

          return (
            <article
              key={event.id}
              className="cosmic-panel overflow-hidden flex flex-col group animate-tile-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Cover image */}
              {event.coverImage ? (
                <div className="h-44 w-full overflow-hidden bg-[var(--d-panel-alt)] relative shrink-0">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-40"
                    style={{ backgroundImage: `url(${event.coverImage})` }}
                  />
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="object-cover w-full h-full relative z-10 transition-transform duration-[var(--motion-content)] group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="h-44 w-full bg-[var(--d-panel-alt)] flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(59,130,246,0.05) 100%)",
                  }}
                >
                  <Calendar aria-hidden="true" size={32} className="text-[var(--color-fg-dim)] opacity-50" />
                </div>
              )}

              {/* Capacity progress bar */}
              {event.capacity && event.capacity > 0 && (
                <div
                  className="w-full h-1 bg-[var(--d-line)] shrink-0"
                  role="progressbar"
                  aria-valuenow={capacityPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${capacityPct}% of capacity filled`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      capacityVariant === "error" ? "bg-[var(--color-danger)]" :
                      capacityVariant === "warning" ? "bg-[var(--color-warning)]" :
                      "bg-[var(--color-positive)]"
                    }`}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="blue" label={(event.type ?? "event").toUpperCase()} />
                  <div className="flex items-center gap-2">
                    {event.status !== "published" && (
                      <Badge
                        variant={event.status === "draft" ? "neutral" : "warning"}
                        label={event.status ?? ""}
                      />
                    )}
                    <span className="text-xs text-[var(--color-fg-dim)] flex items-center gap-1">
                      <Clock aria-hidden="true" size={11} />
                      <RelativeTime date={event.startsAt} format="date" />
                    </span>
                  </div>
                </div>

                {/* Title + description */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[var(--color-fg)] line-clamp-1 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-sm text-[var(--color-fg-dim)] mt-1 line-clamp-2">
                    {event.description || "No description provided."}
                  </p>
                </div>

                {/* Location + capacity */}
                {(event.location || (event.capacity && event.capacity > 0)) && (
                  <div className="flex items-center gap-3 text-xs text-[var(--color-fg-dim)]">
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin aria-hidden="true" size={11} />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                    {event.capacity && event.capacity > 0 && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Users aria-hidden="true" size={11} />
                        {registered}/{event.capacity}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-0 mt-auto flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[var(--touch-target)]"
                  href={`/events/${event.slug}`}
                  label={canCreate ? "Manage" : "View details"}
                />
                {canCreate && (
                  <ResourceActionMenu
                    label={`Options for ${event.title}`}
                    actions={{
                      primary: [
                        { label: "Manage event", href: `/events/${event.slug}` },
                        { label: "Edit details", href: `/events/${event.slug}/edit` },
                      ],
                      management: [
                        { label: "Open scanner", href: `/scanner?event=${event.id}` },
                        { label: "Export roster", href: `/api/events/${event.id}/export` },
                      ],
                      destructive: [
                        { label: "Archive event", href: `/events/${event.slug}/archive` },
                      ],
                    }}
                  />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EventsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true" aria-busy="true">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="cosmic-panel overflow-hidden flex flex-col">
          <div className="h-44 w-full bg-[var(--d-panel-alt)] animate-pulse" />
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
              <div className="h-4 w-24 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
            </div>
            <div className="h-5 w-3/4 rounded-md bg-[var(--d-panel-alt)] animate-pulse" />
            <div className="h-4 w-full rounded-md bg-[var(--d-panel-alt)] animate-pulse opacity-60" />
            <div className="h-4 w-2/3 rounded-md bg-[var(--d-panel-alt)] animate-pulse opacity-40" />
          </div>
          <div className="px-5 pb-5">
            <div className="h-9 w-full rounded-lg bg-[var(--d-panel-alt)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
