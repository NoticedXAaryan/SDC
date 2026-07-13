import { requireLead } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApplicationsBoard } from "./components/applications-board";
import { Button } from "@/components/ui/button";

export default async function ApplicationsPage() {
  await requireLead(); // Ensures Lead or Vice Lead

  const allApplications = await db
    .select({
      id: applications.id,
      status: applications.status,
      aiScore: applications.aiScore,
      aiFeedback: applications.aiFeedback,
      answers: applications.answers,
      createdAt: applications.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      }
    })
    .from(applications)
    .innerJoin(user, eq(applications.userId, user.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruitment Pipeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review, grade, and approve new member applications.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <a href="/api/applications/export" download="applications.csv">Download CSV</a>
        </Button>
      </div>

      <ApplicationsBoard initialData={allApplications} />
    </div>
  );
}
