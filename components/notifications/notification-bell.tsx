"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  }

  async function markAsRead(ids: string[]) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids }),
      });
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read");
    }
  }

  const unread = notifications.filter(n => !n.read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex justify-between items-center p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unread.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => markAsRead(unread.map(u => u.id))}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} className={`p-4 border-b last:border-0 flex flex-col gap-1 transition-colors ${!n.read ? 'bg-muted/50' : ''}`} onClick={() => !n.read && markAsRead([n.id])}>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-sm leading-tight">{n.title}</span>
                  {!n.read && <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm">New</Badge>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                {n.link && (
                  <Link href={n.link} className="text-xs text-blue-500 hover:underline mt-1" onClick={() => setOpen(false)}>
                    View details
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t text-center">
          <Link href="/notifications" className="text-xs font-medium text-primary hover:underline" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
