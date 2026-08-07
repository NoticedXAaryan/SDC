import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, events, registrations, applications, insights, certificatesV2, auditLogs, budgets, expenses, inventory } from "@/lib/db/schema";
import { eq, sql, and, desc, gte, lte, or, inArray } from "drizzle-orm";

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
  
  // 4. Admin-specific data
  let insightsData: any[] = [];
  let pendingApprovalsCount = 0;
  let recentAuditLogs: any[] = [];
  let financeSnapshot: { budgetRemaining: number; pendingExpenses: any[] } | null = null;
  let inventoryAlerts: any[] = [];

  if (role === "admin" || role === "owner") {
    insightsData = await db.select().from(insights).orderBy(desc(insights.generatedAt)).limit(3);
    
    // Count pending approvals (applications + draft events awaiting review)
    const [pendingApps] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(inArray(applications.status, ["applied", "needs_manual_review"]));
    const [pendingEvts] = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.status, "draft"));
    pendingApprovalsCount = Number(pendingApps.count) + Number(pendingEvts.count);
    
    // Recent audit logs
    recentAuditLogs = await db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(5);

    // Finance snapshot — total allocated budget minus approved expenses
    try {
      const budgetRows = await db.select({
        totalAllocated: sql<number>`coalesce(sum(cast(${budgets.allocated} as numeric)), 0)`,
      }).from(budgets);
      
      const [approvedExpenseSum] = await db.select({
        total: sql<number>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.status, "approved"));

      const pendingExpenseRows = await db.select({
        id: expenses.id,
        amount: expenses.amount,
        category: expenses.category,
      })
      .from(expenses)
      .where(eq(expenses.status, "pending"))
      .limit(5);
      
      financeSnapshot = {
        budgetRemaining: Number(budgetRows[0]?.totalAllocated ?? 0) - Number(approvedExpenseSum?.total ?? 0),
        pendingExpenses: pendingExpenseRows,
      };
    } catch {
      // Finance tables may not exist yet — degrade gracefully
      financeSnapshot = null;
    }

    // Inventory low-stock alerts (items with 5 or fewer available)
    try {
      inventoryAlerts = await db.select({
        id: inventory.id,
        name: inventory.name,
        qtyAvailable: inventory.qtyAvailable,
      })
      .from(inventory)
      .where(lte(inventory.qtyAvailable, 5))
      .orderBy(inventory.qtyAvailable)
      .limit(5);
    } catch {
      // Inventory table may not exist — degrade gracefully
      inventoryAlerts = [];
    }
  }

  // 5. Lead-specific pending tasks count
  let pendingTasksCount = 0;
  if (isManagement) {
    const [leadPendingApps] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(inArray(applications.status, ["applied", "needs_manual_review"]));
    pendingTasksCount = Number(leadPendingApps.count);
  }

  // 6. User's Application Status
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

  // 7. User's Certificates
  const myCertificates = await db.select({
    id: certificatesV2.id,
    verifyId: certificatesV2.verifyId,
    issuedAt: certificatesV2.issuedAt,
    data: certificatesV2.data,
  })
  .from(certificatesV2)
  .where(eq(certificatesV2.userId, userId))
  .orderBy(desc(certificatesV2.issuedAt))
  .limit(3);

  return {
    user: session.user,
    upcomingEvents,
    myRegistrations: myRegistrationsData,
    managementStats,
    myApplication,
    insightsData,
    myCertificates,
    pendingApprovalsCount,
    recentAuditLogs,
    financeSnapshot,
    inventoryAlerts,
    pendingTasksCount,
  };
}
