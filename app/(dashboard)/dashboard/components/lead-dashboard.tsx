import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Calendar, ClipboardList, CheckSquare, Activity, Plus, FileText, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LeadDashboard({ user, managementStats, upcomingEvents }: any) {
  return (
    <div className="space-y-6">
      
      {/* 2. Domain KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementStats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active in your domain</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementStats?.activeEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Ongoing or upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementStats?.totalRegistrations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all active forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">12</div>
            <p className="text-xs text-muted-foreground mt-1">Requires your attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* 1. Active Tasks (Reviews pending, approvals, interviews) */}
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Items that need your review or approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 text-amber-600 p-2 rounded-full"><ClipboardList className="w-4 h-4" /></div>
                  <div>
                    <p className="font-semibold text-sm">Application Reviews</p>
                    <p className="text-xs text-muted-foreground">5 pending reviews in Tech Domain</p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href="/manage/recruitment">Review</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><FileText className="w-4 h-4" /></div>
                  <div>
                    <p className="font-semibold text-sm">Certificate Generation</p>
                    <p className="text-xs text-muted-foreground">Batch #452 needs approval</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/manage/certificates">Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 4. Team Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-muted ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Activity className="w-5 h-5 text-muted-foreground bg-background" /></div>
                  <h4 className="font-semibold text-sm">Event Created</h4>
                  <p className="text-xs text-muted-foreground">Aaryan created "Tech Talk 2026" • 2h ago</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Activity className="w-5 h-5 text-muted-foreground bg-background" /></div>
                  <h4 className="font-semibold text-sm">Form Published</h4>
                  <p className="text-xs text-muted-foreground">Jane published "Feedback Form" • 5h ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Quick Actions */}
        <div className="space-y-6">
          <Card className="h-max">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 flex flex-col">
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/manage/events/new">
                  <Plus className="mr-2 h-4 w-4" /> Create Event
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/manage/forms">
                  <FileText className="mr-2 h-4 w-4" /> Manage Forms
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/manage/recruitment">
                  <Users className="mr-2 h-4 w-4" /> Recruitment
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/manage/settings">
                  <Settings className="mr-2 h-4 w-4" /> Domain Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Events (Next 7 Days)</CardTitle>
              <Link href="/events" className="text-sm text-primary hover:underline font-medium">View all</Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No events in the next 7 days.</div>
              ) : (
                upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startsAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="w-full text-xs h-7" asChild>
                        <Link href={`/events/${event.slug}/manage`}>Manage</Link>
                      </Button>
                      <Button size="sm" className="w-full text-xs h-7" asChild>
                        <Link href={`/events/${event.slug}/manage?tab=scanner`}>Open scanner</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
