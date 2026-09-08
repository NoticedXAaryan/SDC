import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { applications, formTemplates, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/astryx/page-header";
import { ApplicationsBoard } from "./components/applications-board";
import { Button } from "@astryxdesign/core/Button";
import { Download } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "vice_lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const [activeForm] = await db.select({ cycleName: formTemplates.cycleName })
    .from(formTemplates)
    .where(eq(formTemplates.isActive, true))
    .orderBy(desc(formTemplates.updatedAt))
    .limit(1);
  const currentCycle = activeForm?.cycleName;

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
  .where(currentCycle ? eq(applications.applicationCycle, currentCycle) : undefined)
  .orderBy(desc(applications.createdAt));

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      <div className="shrink-0">
        <PageHeader 
          title="Recruitment Pipeline" 
          description={currentCycle
            ? `Manage applications and applicant status for ${currentCycle}.`
            : "No recruitment form is active, so applications from every cycle are shown."}
          primaryAction={currentCycle ? (
            <Button
              href={`/api/applications/export?cycle=${encodeURIComponent(currentCycle)}`}
              variant="secondary"
              label="Export CSV"
              icon={<Download className="h-4 w-4" />}
            />
          ) : undefined}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ApplicationsBoard initialData={allApplications} />
      </div>
    </div>
  );
}
