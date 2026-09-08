import { requirePageSession, isManagementRole } from "@/lib/dal/auth";
import { AdminContainer, LeadContainer, StudentContainer } from "./components/dashboard-containers";
import { DashboardSkeleton } from "./components/dashboard-skeleton";
import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { user as users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isClubMember } from "@/lib/membership";
import { MembershipWelcome } from "@/components/app/membership-welcome";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const session = await requirePageSession();
  const [account] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (account && !account.onboardingCompleted) redirect("/setup");
  const user = { ...session.user, ...account, role: (account?.role || session.user.role) as typeof session.user.role };
  const isAdmin = ["admin", "owner"].includes(user.role);
  const isLead = isManagementRole(user.role) && !isAdmin;
  return <div className="mx-auto max-w-6xl space-y-8">
    {isClubMember(user.role) && account && !account.membershipWelcomeSeen && <MembershipWelcome />}
    {(isAdmin || isLead) && <header className="club-page-heading">
      <div><p className="club-eyebrow">Club workspace</p><h1>Welcome, {user.name}.</h1><p>{isAdmin ? "Review the club's activity and decisions that need your attention." : "Keep up with your team's work and upcoming events."}</p></div>
      <Link href={isAdmin ? "/manage/approvals" : "/tasks"} className="club-button">{isAdmin ? "Review approvals" : "View team tasks"}</Link>
    </header>}
    <Suspense fallback={<DashboardSkeleton />}>
      {isAdmin ? <AdminContainer user={user} /> : isLead ? <LeadContainer user={user} /> : <StudentContainer user={user} />}
    </Suspense>
  </div>;
}
