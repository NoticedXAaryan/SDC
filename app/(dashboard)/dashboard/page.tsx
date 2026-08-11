import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { AdminContainer, LeadContainer, StudentContainer } from "./components/dashboard-containers";
import { DashboardSkeleton } from "./components/dashboard-skeleton";
import { PageHeader } from "@/components/astryx/page-header";
import { Button } from "@astryxdesign/core";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const user = session.user;
  
  const role = user.role as string;
  const isAdmin = ["admin", "owner"].includes(role);
  const isLead = isManagementRole(role) && !isAdmin;

  // We don't have pendingApprovalsCount instantly since we deferred fetching,
  // so we'll show generic links in the header.
  const adminCtaLabel = "Review actions";
  const adminCtaLink = "/manage/approvals";

  return (
    <div className="flex flex-col gap-8 w-full h-full">
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

      <Suspense fallback={<DashboardSkeleton />}>
        {isAdmin ? (
          <AdminContainer user={user} />
        ) : isLead ? (
          <LeadContainer user={user} />
        ) : (
          <StudentContainer user={user} />
        )}
      </Suspense>
    </div>
  );
}
