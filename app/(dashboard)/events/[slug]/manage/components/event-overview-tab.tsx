import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityTimeline } from "@/components/app/activity-timeline"
import { Calendar, Users, Ticket, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function EventOverviewTab({ event }: { event: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Registrations</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                <span>0</span>
                <Users className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Capacity: {event.capacity || "Unlimited"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Check-ins</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                <span>0</span>
                <Ticket className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                0% attendance rate
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Event Date</CardDescription>
              <CardTitle className="text-xl font-bold flex items-center justify-between">
                <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline 
              activities={[
                {
                  id: "1",
                  actor: {
                    name: "System",
                    initials: "SYS",
                  },
                  action: "created",
                  summary: "Event created",
                  timestamp: new Date(),
                  details: "You created this event"
                }
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href={`/events/${event.slug}/manage?tab=scanner`}
              className="flex items-center p-3 w-full rounded-lg hover:bg-muted transition-colors border"
            >
              <div className="bg-primary/10 p-2 rounded-md mr-3">
                <Ticket className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Open Scanner</p>
                <p className="text-xs text-muted-foreground">Check in attendees</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            
            <Link 
              href={`/events/${event.slug}/manage?tab=communications`}
              className="flex items-center p-3 w-full rounded-lg hover:bg-muted transition-colors border"
            >
              <div className="bg-blue-500/10 p-2 rounded-md mr-3">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Send Update</p>
                <p className="text-xs text-muted-foreground">Email registered users</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
