"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HoverCard } from "@astryxdesign/core";
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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const renderNotificationList = (items: Notification[], limit?: number) => {
    const displayItems = limit ? items.slice(0, limit) : items;
    
    if (displayItems.length === 0) {
      return <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>;
    }

    return (
      <div className="flex flex-col">
        {displayItems.map((n) => (
          <div key={n.id} className={`p-4 border-b last:border-0 flex flex-col gap-1 transition-colors ${!n.read ? 'bg-muted/50' : ''}`} onClick={() => !n.read && markAsRead([n.id])}>
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium text-sm leading-tight">{n.title}</span>
              {!n.read && <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm bg-primary/20 text-primary hover:bg-primary/30">New</Badge>}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
            {n.link && (
              <Link href={n.link} className="text-xs text-primary hover:underline mt-1" onClick={() => setOpen(false)}>
                View details
              </Link>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGlimpse = () => (
    <div className="w-80 flex flex-col">
      <div className="p-3 border-b border-border/40 font-semibold text-sm">
        Recent Notifications
      </div>
      {renderNotificationList(unread.length > 0 ? unread : notifications, 3)}
      <div className="p-2 border-t border-border/40 text-center text-xs text-muted-foreground">
        Click bell icon to view all
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <HoverCard content={renderGlimpse()} placement="end" alignment="center">
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-lg h-10 w-10 text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            {unread.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </Button>
        </SheetTrigger>
      </HoverCard>

      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col border-l border-border/40">
        <SheetHeader className="p-6 border-b border-border/40 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unread.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead(unread.map(u => u.id))}>
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          {renderNotificationList(notifications)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
