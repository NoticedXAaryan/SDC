import { getDashboardData } from "@/lib/dal/dashboard";
import { isManagementRole } from "@/lib/dal/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { generateSignedPass } from "@/lib/passes/qr";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { user, upcomingEvents, myRegistrations, managementStats, myApplication } = data;
  const isManagement = isManagementRole(user.role as string);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground mt-2">Here is what's happening at the Student Developer Club.</p>
      </div>

      {isManagement && managementStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managementStats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managementStats.activeEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managementStats.totalRegistrations}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {myApplication && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Cycle: {myApplication.applicationCycle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Status: <span className="uppercase text-primary">{(myApplication.status || "pending").replace(/_/g, " ")}</span></p>
                {myApplication.status === "ai_graded" && (
                  <p className="text-xs text-muted-foreground mt-1">Your application has been pre-screened and is awaiting manual review.</p>
                )}
                {myApplication.status === "interviewing" && (
                  <p className="text-xs text-muted-foreground mt-1">You have been selected for an interview! Check your email for details.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Upcoming Events Widget */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events scheduled for the near future.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events found.</p>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="space-y-1">
                    <Link href={`/events/${event.slug}`} className="font-medium hover:underline">
                      {event.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.startsAt).toLocaleString()} • {event.type}
                    </div>
                  </div>
                  <Link href={`/events/${event.slug}`} className="text-xs text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              ))
            )}
            <div className="pt-2">
              <Link href="/events" className="text-sm text-blue-600 font-medium hover:underline">
                View all events →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* My Registrations Widget */}
        <Card>
          <CardHeader>
            <CardTitle>My Registrations</CardTitle>
            <CardDescription>Events you are currently registered for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't registered for any events.</p>
            ) : (
              myRegistrations.map((reg) => (
                <div key={reg.eventId} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="space-y-1">
                    <Link href={`/events/${reg.eventSlug}`} className="font-medium hover:underline">
                      {reg.eventTitle}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(reg.eventStartsAt).toLocaleString()}
                    </div>
                  </div>
                  <Link href={`/passes/${reg.eventId}`} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100">
                    QR Pass
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
