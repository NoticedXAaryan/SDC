import { getDashboardData } from "@/lib/dal/dashboard";
import { isManagementRole } from "@/lib/dal/auth";
import { StudentDashboard } from "./components/student-dashboard";
import { LeadDashboard } from "./components/lead-dashboard";
import { AdminDashboard } from "./components/admin-dashboard";

import { PageHeader } from "@/components/astryx/page-header";
import { Button } from "@astryxdesign/core";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { 
    user, upcomingEvents, myRegistrations, managementStats, 
    myApplication, insightsData, myCertificates,
    pendingApprovalsCount, recentAuditLogs, financeSnapshot, 
    inventoryAlerts, pendingTasksCount
  } = data;
  
  const role = user.role as string;
  const isAdmin = ["admin", "owner"].includes(role);
  const isLead = isManagementRole(role) && !isAdmin;

  const adminCtaLabel = pendingApprovalsCount > 0 ? "Review approvals" : "Create event";
  const adminCtaLink = pendingApprovalsCount > 0 ? "/manage/approvals" : "/events/create";

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <PageHeader 
        title={`Welcome, ${user.name}`}
        description={
          isAdmin ? "Here is your club overview and action items." : 
          isLead ? "Here are your domain KPIs and management tools." : 
          "Here is your student dashboard."
        }
        primaryAction={
          isAdmin ? (
            <Button href={adminCtaLink} label={adminCtaLabel} />
          ) : isLead ? (
            <Button href="/events/create" label="Create event" />
          ) : (
            <Button href="/events" label="Explore events" />
          )
        }
      />

      {isAdmin ? (
        <AdminDashboard 
          user={user} 
          managementStats={managementStats} 
          upcomingEvents={upcomingEvents} 
          insights={insightsData}
          pendingApprovalsCount={pendingApprovalsCount}
          recentAuditLogs={recentAuditLogs}
          financeSnapshot={financeSnapshot}
          inventoryAlerts={inventoryAlerts}
        />
      ) : isLead ? (
        <LeadDashboard 
          user={user} 
          managementStats={managementStats} 
          upcomingEvents={upcomingEvents}
          pendingTasksCount={pendingTasksCount}
          recentAuditLogs={recentAuditLogs}
        />
      ) : (
        <StudentDashboard user={user} myRegistrations={myRegistrations} myApplication={myApplication} myCertificates={myCertificates} />
      )}
    </div>
  );
}
