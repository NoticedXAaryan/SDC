import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, events, registrations, applications, insights } from "@/lib/db/schema";
import { eq, count, sql, and, desc, gte } from "drizzle-orm";

export async function getDashboardData() {
  const session = await requireSession();
  const role = session.user.role || "member";
  const userId = session.user.id;
  const isManagement = isManagementRole(role);

  // 1. Upcoming Events (Next 3 events)
  const upcomingEvents = await db.select({
    id: events.id,
    title: events.title,
    slug: events.slug,
    startsAt: events.startsAt,
    type: events.type,
    location: events.location,
    coverImage: events.coverImage,
  })
  .from(events)
  .where(
    and(
      gte(events.startsAt, new Date()),
      isManagement ? undefined : eq(events.status, "published")
    )
  )
  .orderBy(events.startsAt)
  .limit(3);

  // 2. User's Active Registrations
  const myRegistrationsData = await db.select({
    eventId: registrations.eventId,
    status: registrations.status,
    eventTitle: events.title,
    eventStartsAt: events.startsAt,
    eventSlug: events.slug,
  })
  .from(registrations)
  .innerJoin(events, eq(registrations.eventId, events.id))
  .where(
    and(
      eq(registrations.userId, userId),
      eq(registrations.status, "confirmed")
    )
  )
  .orderBy(desc(events.startsAt))
  .limit(5);

  // 3. Management specific stats (only fetched if management)
  let managementStats = null;
  if (isManagement) {
    const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
    const [activeEvents] = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(gte(events.startsAt, new Date()));
    const [totalRegs] = await db.select({ count: sql<number>`count(*)` }).from(registrations);

    managementStats = {
      totalMembers: Number(memberCount.count),
      activeEvents: Number(activeEvents.count),
      totalRegistrations: Number(totalRegs.count),
    };
  }
  
  let insightsData: any[] = [];
  if (role === "admin" || role === "owner") {
    insightsData = await db.select().from(insights).orderBy(desc(insights.generatedAt)).limit(3);
  }

  // 4. User's Application Status
  const myApplication = await db.select({
    id: applications.id,
    status: applications.status,
    applicationCycle: applications.applicationCycle,
    aiScore: applications.aiScore,
  })
  .from(applications)
  .where(eq(applications.userId, userId))
  .orderBy(desc(applications.createdAt))
  .limit(1)
  .then(rows => rows[0] || null);

  return {
    user: session.user,
    upcomingEvents,
    myRegistrations: myRegistrationsData,
    managementStats,
    myApplication,
    insightsData,
  };
}
