"use client";

import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/astryx/empty-state";
import { CheckSquare } from "lucide-react";

export function TaskList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding={4}>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare />}
        title="No tasks found"
        description="There are no tasks assigned yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} padding={4}>
          <HStack justify="between" align="start">
            <VStack gap={1}>
              <Text weight="bold" className="text-lg">{task.title}</Text>
              {task.description && (
                <Text type="supporting" className="text-sm">{task.description}</Text>
              )}
              <HStack gap={4} className="mt-2 text-xs text-muted-foreground">
                {task.assigneeName && <span>Assigned to: {task.assigneeName}</span>}
                {task.eventName && <span>Event: {task.eventName}</span>}
                {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
              </HStack>
            </VStack>
            <Badge 
              label={task.status.replace("_", " ").toUpperCase()} 
              variant={task.status === "done" ? "success" : task.status === "blocked" ? "error" : "neutral"} 
            />
          </HStack>
        </Card>
      ))}
    </div>
  );
}
