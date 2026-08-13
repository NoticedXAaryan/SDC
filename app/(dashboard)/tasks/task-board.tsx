"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Plus, User, Clock, AlertCircle } from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  assigneeName: string | null;
  eventName: string | null;
}

export function TaskBoard({ initialTasks, isLead }: { initialTasks: Task[], isLead: boolean }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  const statuses: { id: TaskStatus, label: string, color: string }[] = [
    { id: "todo", label: "To Do", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { id: "blocked", label: "Blocked", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    { id: "done", label: "Done", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ];

  const handleUpdateStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast.success("Task updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
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
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setTasks([created, ...tasks]);
      setIsCreating(false);
      setNewTask({ title: "", description: "" });
      toast.success("Task created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    }
  };

  return (
    <div className="space-y-6">
      {isLead && (
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-primary/10 text-primary hover:bg-primary/20"><Plus className="w-4 h-4 mr-2"/> New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input 
                placeholder="Task title" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
              />
              <Textarea 
                placeholder="Description" 
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
              />
              <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {statuses.map(col => (
          <div key={col.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm tracking-wide text-foreground uppercase flex items-center gap-2">
                {col.label}
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground border-transparent">
                  {tasks.filter(t => t.status === col.id).length}
                </Badge>
              </h3>
            </div>
            <div className="flex flex-col gap-3 min-h-[200px] rounded-xl bg-muted/30 p-3 border border-border/50">
              {tasks.filter(t => t.status === col.id).map(task => (
                <Card key={task.id} className="p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all group bg-card border-border hover:border-primary/30">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-sm leading-tight text-foreground">{task.title}</p>
                    <Badge variant="outline" className={`capitalize text-[10px] whitespace-nowrap ${col.color}`}>{task.status.replace("_", " ")}</Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-1">
                    {task.assigneeName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5 opacity-70" />
                        <span className="truncate max-w-[100px]">{task.assigneeName}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {col.id !== "todo" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => handleUpdateStatus(task.id, "todo")}>To Do</Button>
                    )}
                    {col.id !== "in_progress" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={() => handleUpdateStatus(task.id, "in_progress")}>Start</Button>
                    )}
                    {col.id !== "blocked" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleUpdateStatus(task.id, "blocked")}>Block</Button>
                    )}
                    {col.id !== "done" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleUpdateStatus(task.id, "done")}>Done</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
