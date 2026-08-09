import React from "react";
import { getAdminDashboardData, getLeadDashboardData, getStudentDashboardData } from "@/lib/dal/dashboard";
import { AdminDashboard } from "./admin-dashboard";
import { LeadDashboard } from "./lead-dashboard";
import { StudentDashboard } from "./student-dashboard";

import { DashboardUser } from "./dashboard-types";

export async function AdminContainer({ user }: { user: DashboardUser }) {
  const data = await getAdminDashboardData(user.id);
  return <AdminDashboard user={user} {...data} />;
}

export async function LeadContainer({ user }: { user: DashboardUser }) {
  const data = await getLeadDashboardData(user.id);
  return <LeadDashboard user={user} {...data} />;
}

export async function StudentContainer({ user }: { user: DashboardUser }) {
  const { myRegistrations, myApplication, myCertificates } = await getStudentDashboardData(user.id);
  return <StudentDashboard user={user} myRegistrations={myRegistrations} myApplication={myApplication} myCertificates={myCertificates} />;
}
