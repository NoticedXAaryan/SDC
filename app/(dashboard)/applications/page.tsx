import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/astryx/page-header";
import { ApplicationsBoard } from "./components/applications-board";

export default async function ApplicationsPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  // Fetch applications for the current cycle
  const currentCycle = "Fall 2024"; // Or fetch from settings

  const allApplications = await db.select({
    id: applications.id,
    status: applications.status,
    applicationCycle: applications.applicationCycle,
    aiScore: applications.aiScore,
    aiFeedback: applications.aiFeedback,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    }
  })
  .from(applications)
  .leftJoin(user, eq(applications.userId, user.id))
  .where(eq(applications.applicationCycle, currentCycle))
  .orderBy(desc(applications.createdAt));

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      <div className="shrink-0">
        <PageHeader 
          title="Recruitment Pipeline" 
          description={`Manage applications and applicant status for ${currentCycle}.`}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ApplicationsBoard initialData={allApplications} />
      </div>
    </div>
  );
}
