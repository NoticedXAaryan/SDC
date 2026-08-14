import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, CheckCircle2, UserPlus, Users, MessageSquare } from "lucide-react";
import { ApplicationActions } from "./actions";
import { Button } from "@/components/ui/button";

export default async function RecruitmentManagementPage() {
  await requireRole(["admin", "lead", "co_lead"]);

  const allApps = await db.select({
    app: applications,
    applicant: {
      name: user.name,
      email: user.email,
    }
  }).from(applications)
    .leftJoin(user, eq(applications.userId, user.id))
    .orderBy(desc(applications.createdAt));

  const stats = {
    applied: allApps.filter(a => a.app.status === "applied").length,
    ai_graded: allApps.filter(a => a.app.status === "ai_graded").length,
    interviewing: allApps.filter(a => a.app.status === "interviewing").length,
    offered: allApps.filter(a => a.app.status === "accepted").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recruitment Dashboard</h2>
          <p className="text-muted-foreground">Manage ongoing recruitment cycles and candidate reviews</p>
        </div>
        <a href="/api/applications/export" target="_blank" rel="noreferrer">
          <Button variant="outline">Export CSV</Button>
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Graded</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ai_graded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers Extended</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offered}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allApps.map(({ app, applicant }) => (
              <div key={app.id} className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 last:border-0 last:pb-0 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{applicant?.name || "Unknown"} ({applicant?.email})</p>
                    <Badge variant="outline" className="uppercase text-xs">{app.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Applied Domain: <span className="font-medium">{app.teamPreference || "Any"}</span> • AI Score: <span className="font-medium">{app.aiScore ?? "Pending"}</span>
                  </p>
                  {app.aiFeedback && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">"{app.aiFeedback}"</p>
                  )}
                </div>
                <div className="shrink-0">
                  <ApplicationActions application={app} />
                </div>
              </div>
            ))}
            {allApps.length === 0 && (
              <div className="text-center p-4 text-muted-foreground border border-dashed rounded-lg">
                No applications found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
