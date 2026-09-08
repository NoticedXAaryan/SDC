"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpRight, CalendarIcon, Plus, User } from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | string | null;
  createdAt: Date | string;
  assigneeRole: string | null;
  actionHref: string | null;
  actionLabel: string | null;
  assigneeName: string | null;
  eventName: string | null;
  eventSlug: string | null;
}

function humanizeRole(role: string): string {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

export function TaskBoard({ initialTasks, canCreateTasks }: { initialTasks: Task[], canCreateTasks: boolean }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  const statuses: { id: TaskStatus, label: string, color: string }[] = [
    { id: "todo", label: "To Do", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { id: "blocked", label: "Blocked", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    { id: "done", label: "Done", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ];

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], blocked: [], done: [] };
    for (const task of tasks) grouped[task.status].push(task);
    return grouped;
  }, [tasks]);

  const handleUpdateStatus = async (id: string, newStatus: TaskStatus) => {
    setUpdatingTaskId(id);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(getErrorMessage(payload, "Task status could not be updated"));

      setTasks((current) => current.map((task) => task.id === id ? { ...task, status: newStatus } : task));
      toast.success("Task status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task status could not be updated");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) return toast.error("Title is required");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(getErrorMessage(payload, "Task could not be created"));
      const created = payload as Omit<Task, "assigneeName" | "eventName" | "eventSlug">;
      setTasks((current) => [{ ...created, assigneeName: null, eventName: null, eventSlug: null }, ...current]);
      setIsCreating(false);
      setNewTask({ title: "", description: "" });
      toast.success("Task created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task could not be created");
    }
  };

  return (
    <div className="space-y-6">
      {canCreateTasks ? (
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger render={<Button className="bg-primary/10 text-primary hover:bg-primary/20" />}>
            <Plus className="w-4 h-4 mr-2"/> New task
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task title</Label>
                <Input
                  id="task-title"
                  placeholder="Confirm workshop mentors"
                  value={newTask.title}
                  onChange={(event) => setNewTask((current) => ({ ...current, title: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Add the outcome, owner context, and definition of done."
                  value={newTask.description}
                  onChange={(event) => setNewTask((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
              <Button onClick={handleCreateTask} className="w-full">Create task</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {statuses.map(col => (
          <div key={col.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm tracking-wide text-foreground uppercase flex items-center gap-2">
                {col.label}
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground border-transparent">
                  {tasksByStatus[col.id].length}
                </Badge>
              </h3>
            </div>
            <div className="flex flex-col gap-3 min-h-[200px] rounded-xl bg-muted/30 p-3 border border-border/50">
              {tasksByStatus[col.id].map(task => {
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = dueDate && dueDate.getTime() < Date.now() && task.status !== "done";

                return (
                <Card key={task.id} className="p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all group bg-card border-border hover:border-primary/30">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-sm leading-tight text-foreground">{task.title}</p>
                    <Badge variant="outline" className={`capitalize text-[10px] whitespace-nowrap ${col.color}`}>{task.status.replace("_", " ")}</Badge>
                  </div>
                  
                  {task.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  ) : null}

                  {task.eventName ? (
                    <p className="text-xs font-medium text-primary">{task.eventName}</p>
                  ) : null}
                  
                  <div className="flex items-center gap-4 mt-1">
                    {task.assigneeName ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5 opacity-70" />
                        <span className="truncate max-w-[100px]">{task.assigneeName}</span>
                      </div>
                    ) : task.assigneeRole ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5 opacity-70" />
                        <span>{humanizeRole(task.assigneeRole)} queue</span>
                      </div>
                    ) : null}
                    {dueDate ? (
                      <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                        <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                        <span>{isOverdue ? "Overdue · " : ""}{dueDate.toLocaleDateString()}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-3">
                    {task.actionHref && task.actionLabel ? (
                      <Button asChild variant="outline" size="sm" className="w-full justify-between">
                        <Link href={task.actionHref}>
                          {task.actionLabel}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    <Select
                      value={task.status}
                      onValueChange={(value) => value ? handleUpdateStatus(task.id, value as TaskStatus) : undefined}
                      disabled={updatingTaskId === task.id}
                    >
                      <SelectTrigger className="w-full" aria-label={`Status for ${task.title}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
                );
              })}
              {tasksByStatus[col.id].length === 0 ? (
                <p className="px-2 py-8 text-center text-xs text-muted-foreground">No tasks in {col.label.toLowerCase()}.</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
