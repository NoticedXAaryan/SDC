import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, events, registrations, applications, insights, certificatesV2, auditLogs, budgets, expenses, inventory } from "@/lib/db/schema";
import { eq, sql, and, desc, gte, lte, or, inArray } from "drizzle-orm";

export async function getStudentDashboardData(userId: string) {
  const [upcomingEvents, myRegistrations, myApplicationRows, myCertificates] = await Promise.all([
    db.select({
      id: events.id, title: events.title, slug: events.slug,
      startsAt: events.startsAt, type: events.type, location: events.location, coverImage: events.coverImage,
    }).from(events).where(and(gte(events.startsAt, new Date()), eq(events.status, "published"))).orderBy(events.startsAt).limit(3),

    db.select({
      eventId: registrations.eventId, status: registrations.status,
      eventTitle: events.title, eventStartsAt: events.startsAt, eventSlug: events.slug,
    }).from(registrations).innerJoin(events, eq(registrations.eventId, events.id))
    .where(and(eq(registrations.userId, userId), eq(registrations.status, "confirmed"))).orderBy(desc(events.startsAt)).limit(5),

    db.select({
      id: applications.id, status: applications.status, applicationCycle: applications.applicationCycle, aiScore: applications.aiScore,
    }).from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt)).limit(1),

    db.select({
      id: certificatesV2.id, verifyId: certificatesV2.verifyId, issuedAt: certificatesV2.issuedAt, data: certificatesV2.data,
    }).from(certificatesV2).where(eq(certificatesV2.userId, userId)).orderBy(desc(certificatesV2.issuedAt)).limit(3)
  ]);

  const myApplication = myApplicationRows[0] || null;

  return { upcomingEvents, myRegistrations, myApplication, myCertificates };
}


export async function getLeadDashboardData(userId: string) {
  const [upcomingEvents, memberCountRes, activeEventsRes, totalRegsRes, leadPendingApps, recentAuditLogs] = await Promise.all([
    db.select({
      id: events.id, title: events.title, slug: events.slug,
      startsAt: events.startsAt, type: events.type, location: events.location, coverImage: events.coverImage,
    }).from(events).where(gte(events.startsAt, new Date())).orderBy(events.startsAt).limit(3),
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ count: sql<number>`count(*)` }).from(events).where(gte(events.startsAt, new Date())),
    db.select({ count: sql<number>`count(*)` }).from(registrations),
    db.select({ count: sql<number>`count(*)` }).from(applications).where(inArray(applications.status, ["applied", "needs_manual_review"])),
    db.select({
      id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity, details: auditLogs.details, timestamp: auditLogs.timestamp,
    }).from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(5)
  ]);

  const managementStats = { totalMembers: Number(memberCountRes[0].count), activeEvents: Number(activeEventsRes[0].count), totalRegistrations: Number(totalRegsRes[0].count) };
  const pendingTasksCount = Number(leadPendingApps[0].count);

  return { upcomingEvents, managementStats, pendingTasksCount, recentAuditLogs };
}

export async function getAdminDashboardData(userId: string) {
  const [upcomingEvents, memberCountRes, activeEventsRes, totalRegsRes, insightsData, pendingAppsRes, pendingEvtsRes, recentAuditLogs] = await Promise.all([
    db.select({
      id: events.id, title: events.title, slug: events.slug,
      startsAt: events.startsAt, type: events.type, location: events.location, coverImage: events.coverImage,
    }).from(events).where(gte(events.startsAt, new Date())).orderBy(events.startsAt).limit(3),
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ count: sql<number>`count(*)` }).from(events).where(gte(events.startsAt, new Date())),
    db.select({ count: sql<number>`count(*)` }).from(registrations),
    db.select().from(insights).orderBy(desc(insights.generatedAt)).limit(3),
    db.select({ count: sql<number>`count(*)` }).from(applications).where(inArray(applications.status, ["applied", "needs_manual_review"])),
    db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.status, "draft")),
    db.select({
      id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity, details: auditLogs.details, timestamp: auditLogs.timestamp,
    }).from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(5)
  ]);

  const managementStats = { totalMembers: Number(memberCountRes[0].count), activeEvents: Number(activeEventsRes[0].count), totalRegistrations: Number(totalRegsRes[0].count) };
  const pendingApprovalsCount = Number(pendingAppsRes[0].count) + Number(pendingEvtsRes[0].count);

  let financeSnapshot = null;
  try {
    const budgetRows = await db.select({ totalAllocated: sql<number>`coalesce(sum(cast(${budgets.allocated} as numeric)), 0)` }).from(budgets);
    const [approvedExpenseSum] = await db.select({ total: sql<number>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)` }).from(expenses).where(eq(expenses.status, "approved"));
    const pendingExpenses = await db.select({ id: expenses.id, amount: expenses.amount, category: expenses.category }).from(expenses).where(eq(expenses.status, "pending")).limit(5);
    financeSnapshot = { budgetRemaining: Number(budgetRows[0]?.totalAllocated ?? 0) - Number(approvedExpenseSum?.total ?? 0), pendingExpenses };
  } catch { financeSnapshot = null; }

  let inventoryAlerts: any[] = [];
  try {
    inventoryAlerts = await db.select({ id: inventory.id, name: inventory.name, qtyAvailable: inventory.qtyAvailable }).from(inventory).where(lte(inventory.qtyAvailable, 5)).orderBy(inventory.qtyAvailable).limit(5);
  } catch { inventoryAlerts = []; }

  let chartData: { attendance: { name: string; attendance: number }[]; members: { name: string; newMembers: number }[] } = { attendance: [], members: [] };
  try {
    const attendanceRes = await db.execute(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', current_date - interval '5 months'),
          date_trunc('month', current_date),
          '1 month'
        ) as month
      )
      SELECT to_char(m.month, 'Mon') as name, COUNT(r."checkedInAt") as attendance
      FROM months m
      LEFT JOIN registrations r ON date_trunc('month', r."checkedInAt") = m.month
      GROUP BY m.month
      ORDER BY m.month
    `);
    
    const membersRes = await db.execute(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', current_date - interval '5 months'),
          date_trunc('month', current_date),
          '1 month'
        ) as month
      )
      SELECT to_char(m.month, 'Mon') as name, COUNT(u."createdAt") as "newMembers"
      FROM months m
      LEFT JOIN "user" u ON date_trunc('month', u."createdAt") = m.month
      GROUP BY m.month
      ORDER BY m.month
    `);
    
    const attendanceRows = Array.isArray(attendanceRes) ? attendanceRes : attendanceRes.rows;
    const membersRows = Array.isArray(membersRes) ? membersRes : membersRes.rows;
    
    chartData = {
      attendance: attendanceRows.map((r: any) => ({ name: String(r.name), attendance: Number(r.attendance) })),
      members: membersRows.map((r: any) => ({ name: String(r.name), newMembers: Number(r.newMembers) }))
    };
  } catch (err) {
    console.error("Failed to fetch chart data:", err);
  }

  return { upcomingEvents, managementStats, insightsData, pendingApprovalsCount, recentAuditLogs, financeSnapshot, inventoryAlerts, chartData };
}
