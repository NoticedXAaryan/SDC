import { requireAdmin } from "@/lib/dal/auth";
import { getMemberManagementOverview } from "@/lib/dal/members";
import { PageHeader } from "@/components/astryx/page-header";
import { MetricCard } from "@/components/astryx/metric-card";
import { OrgChartTabs } from "@/components/admin/org-chart-tabs";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await requireAdmin();
  const { members, total, roleStats, allLeads } =
    await getMemberManagementOverview(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Management"
        description={`Manage ${total} club accounts, access, roles, and sessions.`}
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
          currentUserId: session.user.id,
        }}
        orgChartData={allLeads}
      />
    </div>
  );
}
