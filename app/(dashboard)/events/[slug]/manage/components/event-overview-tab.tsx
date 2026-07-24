import { Card, Heading, Text, HStack, VStack } from "@astryxdesign/core"
import { ActivityTimeline } from "@/components/app/activity-timeline"
import { Calendar, Users, Ticket, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function EventOverviewTab({ event }: { event: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting">Registrations</Text>
                <HStack align="center" justify="between">
                  <span className="text-3xl font-bold">0</span>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </HStack>
              </VStack>
              <Text type="supporting" className="text-xs">
                Capacity: {event.capacity || "Unlimited"}
              </Text>
            </VStack>
          </Card>
          
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting">Check-ins</Text>
                <HStack align="center" justify="between">
                  <span className="text-3xl font-bold">0</span>
                  <Ticket className="w-5 h-5 text-muted-foreground" />
                </HStack>
              </VStack>
              <Text type="supporting" className="text-xs">
                0% attendance rate
              </Text>
            </VStack>
          </Card>
          
          <Card padding={4}>
            <VStack gap={4}>
              <VStack gap={1}>
                <Text type="supporting">Event Date</Text>
                <HStack align="center" justify="between">
                  <span className="text-xl font-bold">{new Date(event.startsAt).toLocaleDateString()}</span>
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </HStack>
              </VStack>
              <Text type="supporting" className="text-xs">
                {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </VStack>
          </Card>
        </div>

        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Recent Activity</Heading>
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
          </VStack>
        </Card>
      </div>

      <div className="space-y-6">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={3} className="text-lg">Quick Actions</Heading>
            <VStack gap={2}>
              <Link 
                href={`/events/${event.slug}/manage?tab=scanner`}
                className="flex items-center p-3 w-full rounded-lg hover:bg-muted transition-colors border"
              >
                <div className="bg-primary/10 p-2 rounded-md mr-3">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Open Scanner</p>
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
                  <p className="text-sm font-medium text-foreground">Send Update</p>
                  <p className="text-xs text-muted-foreground">Email registered users</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </VStack>
          </VStack>
        </Card>
      </div>
    </div>
  )
}
