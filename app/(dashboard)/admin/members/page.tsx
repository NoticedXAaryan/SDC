import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { MetricCard } from "@/components/astryx/metric-card";
import { OrgChartTabs } from "@/components/admin/org-chart-tabs";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await requireAdmin();

  // Get initial data server-side
  const members = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    username: user.username,
    year: user.year,
    branch: user.branch,
    points: user.points,
    level: user.level,
    banned: user.banned,
    createdAt: user.createdAt,
    image: user.image,
  })
  .from(user)
  .orderBy(desc(user.createdAt))
  .limit(20);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(user);
  const total = Number(countResult[0]?.count ?? 0);

  // Role distribution stats
  const roleStats = await db.select({
    role: user.role,
    count: sql<number>`count(*)`,
  })
  .from(user)
  .groupBy(user.role);

  const allLeads = await db.select({
    id: user.id,
    name: user.name,
    role: user.role,
    image: user.image,
  }).from(user).where(
    sql`${user.role} IN ('owner', 'admin', 'lead', 'vice_lead', 'faculty_coordinator', 'event_lead', 'content_lead', 'marketing_lead', 'tech_lead', 'finance_lead', 'volunteer_lead', 'co_lead')`
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Member Management" 
        description={`Manage ${total} club members. Search, filter, and update roles.`}
      />

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {roleStats.map((stat) => (
          <MetricCard 
            key={stat.role || "unset"}
            title={stat.role?.replace(/_/g, " ") || "unset"} 
            value={Number(stat.count).toString()} 
          />
        ))}
      </div>

      <OrgChartTabs 
        membersProps={{
          initialMembers: members,
          total,
          currentUserRole: session.user.role,
          currentUserId: session.user.id
        }}
        orgChartData={allLeads}
      />
    </div>
  );
}
