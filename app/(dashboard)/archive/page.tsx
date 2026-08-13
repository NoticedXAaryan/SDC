import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, projects, formTemplates } from "@/lib/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  await requireSession();

  // Fetch past events
  const pastEvents = await db.select().from(events)
    .where(lt(events.startsAt, new Date()))
    .orderBy(desc(events.startsAt))
    .limit(10);

  // Fetch archived projects
  const archivedProjects = await db.select().from(projects)
    .where(eq(projects.status, "approved"))
    .orderBy(desc(projects.createdAt))
    .limit(10);

  // Fetch past application cycles
  const pastForms = await db.select().from(formTemplates)
    .where(eq(formTemplates.isActive, false))
    .orderBy(desc(formTemplates.createdAt))
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="text-muted-foreground">Historical records of events, projects, and recruitments.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Past Events */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Past Events</h2>
          {pastEvents.length === 0 ? <p className="text-sm text-muted-foreground">No past events found.</p> : null}
          {pastEvents.map(event => (
            <Card key={event.id}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">
                  <Link href={`/events/${event.slug}`} className="hover:underline text-blue-600">{event.title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <p>Date: {new Date(event.startsAt).toLocaleDateString()}</p>
                <p>Status: <Badge variant="outline" className="mt-1">{event.status}</Badge></p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Archived Projects */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Archived Projects</h2>
          {archivedProjects.length === 0 ? <p className="text-sm text-muted-foreground">No archived projects found.</p> : null}
          {archivedProjects.map(project => (
            <Card key={project.id}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <p className="line-clamp-2 mb-2">{project.description}</p>
                {project.githubUrl && <a href={project.githubUrl} className="text-xs text-blue-500 hover:underline">GitHub</a>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Past Application Cycles */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Past Recruitments</h2>
          {pastForms.length === 0 ? <p className="text-sm text-muted-foreground">No past cycles found.</p> : null}
          {pastForms.map(form => (
            <Card key={form.id}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{form.cycleName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <p>Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                <p>Fields: {Array.isArray(form.fields) ? form.fields.length : 0} questions</p>
                <div className="mt-2">
                  <a href={`/api/applications/export?cycle=${form.cycleName}`} className="text-xs text-blue-500 hover:underline">
                    Export CSV
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
