import { requirePageSession, isManagementRole } from "@/lib/dal/auth";
import { AdminContainer, LeadContainer, StudentContainer } from "./components/dashboard-containers";
import { DashboardSkeleton } from "./components/dashboard-skeleton";
import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const { user } = await requirePageSession();
  const isAdmin = ["admin", "owner"].includes(user.role);
  const isLead = isManagementRole(user.role) && !isAdmin;
  return <div className="mx-auto max-w-6xl space-y-8">
    {(isAdmin || isLead) && <header className="club-page-heading">
      <div><p className="club-eyebrow">Club workspace</p><h1>Welcome, {user.name}.</h1><p>{isAdmin ? "Review the club's activity and decisions that need your attention." : "Keep up with your team's work and upcoming events."}</p></div>
      <Link href={isAdmin ? "/manage/approvals" : "/tasks"} className="club-button">{isAdmin ? "Review approvals" : "View team tasks"}</Link>
    </header>}
    <Suspense fallback={<DashboardSkeleton />}>
      {isAdmin ? <AdminContainer user={user} /> : isLead ? <LeadContainer user={user} /> : <StudentContainer user={user} />}
    </Suspense>
  </div>;
}
