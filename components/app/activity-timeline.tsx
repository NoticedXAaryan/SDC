import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

export type ActivityItem = {
  id: string
  actor: {
    name: string
    avatar?: string
    initials: string
  }
  action: string
  summary: string
  timestamp: Date
  details?: React.ReactNode
}

interface ActivityTimelineProps {
  activities: ActivityItem[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No recent activity.</div>
  }

  return (
    <div className="relative border-l border-muted ml-4 space-y-6 pb-4 pt-2">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative pl-6">
          <div className="absolute -left-4 top-1 h-8 w-8 rounded-full border-4 border-background bg-background">
            <Avatar className="h-6 w-6">
              <AvatarImage src={activity.actor.avatar} alt={activity.actor.name} />
              <AvatarFallback className="text-[10px]">{activity.actor.initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{activity.actor.name}</span>
              <span className="text-sm text-muted-foreground">{activity.summary}</span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                {activity.action}
              </Badge>
            </div>
            <time className="text-xs text-muted-foreground" dateTime={activity.timestamp.toISOString()}>
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </time>
            {activity.details && (
              <Card className="mt-2 p-3 text-sm bg-muted/30">
                {activity.details}
              </Card>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
