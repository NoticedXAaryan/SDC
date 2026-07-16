import { getDashboardData } from "@/lib/dal/dashboard";
import { isManagementRole } from "@/lib/dal/auth";
import { StudentDashboard } from "./components/student-dashboard";
import { LeadDashboard } from "./components/lead-dashboard";
import { AdminDashboard } from "./components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { user, upcomingEvents, myRegistrations, managementStats, myApplication, insightsData } = data;
  
  const role = user.role as string;
  const isAdmin = ["admin", "owner"].includes(role);
  const isLead = ["lead", "co_lead", "finance_lead", "event_lead", "tech_lead"].includes(role);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground mt-2">
          {isAdmin ? "Here is your club overview and action items." : 
           isLead ? "Here are your domain KPIs and management tools." : 
           "Here is your student dashboard."}
        </p>
      </div>

      {isAdmin ? (
        <AdminDashboard user={user} managementStats={managementStats} upcomingEvents={upcomingEvents} insights={insightsData} />
      ) : isLead ? (
        <LeadDashboard user={user} managementStats={managementStats} upcomingEvents={upcomingEvents} />
      ) : (
        <StudentDashboard user={user} myRegistrations={myRegistrations} myApplication={myApplication} />
      )}
    </div>
  );
}
