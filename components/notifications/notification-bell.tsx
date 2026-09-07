"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
type Notification = { id: string; title: string; message: string; read: boolean; link?: string | null; createdAt: string };
export function NotificationBell() {
  const hydrated = useHydrated();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error(response.status === 403 ? "Verify your email to read notifications." : "Couldn't load notifications.");
      setNotifications(await response.json()); setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't load notifications."); }
    finally { setPending(false); }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);
  async function markRead(ids: string[]) {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationIds: ids }) });
      if (!response.ok) throw new Error();
      setNotifications(previous => previous.map(item => ids.includes(item.id) ? { ...item, read: true } : item));
    } catch { setError("Couldn't mark notifications as read. Try again."); }
    finally { setSaving(false); }
  }
  const unread = notifications.filter(item => !item.read);
  return <Sheet open={open} onOpenChange={value => { setOpen(value); if (value) void load(); }}>
    <SheetTrigger asChild><button disabled={!hydrated} className="club-icon-button relative" aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications"}><Bell size={19} aria-hidden="true" />{unread.length > 0 && <span className="club-notification-dot" aria-hidden="true" />}</button></SheetTrigger>
    <SheetContent className="club-notification-sheet">
      <SheetHeader><SheetTitle>Notifications</SheetTitle><SheetDescription>Updates about your applications, events, and club activity.</SheetDescription></SheetHeader>
      {pending && <p role="status" className="club-field-help">Loading notifications…</p>}
      {error && <div role="alert" className="club-form-error">{error}<button className="club-text-link" onClick={load}>Try again</button></div>}
      {unread.length > 0 && <button className="club-text-link" disabled={saving} onClick={() => markRead(unread.map(item => item.id))}>Mark all as read</button>}
      {!pending && !error && !notifications.length && <div className="club-quiet-state"><p>You're all caught up.</p><p>Application decisions and event updates will appear here.</p></div>}
      <ul className="club-notification-list">{notifications.map(item => <li key={item.id} data-unread={!item.read}>
        <h3>{item.title}</h3><p>{item.message}</p>
        <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>
        <div className="flex flex-wrap gap-4">
          {item.link?.startsWith("/") && !item.link.startsWith("//") && !item.link.includes("\\") && <Link className="club-text-link" href={item.link} onClick={() => setOpen(false)}>View update</Link>}
          {!item.read && <button className="club-text-link" disabled={saving} onClick={() => markRead([item.id])}><Check size={14} aria-hidden="true" />Mark as read<span className="sr-only">: {item.title}</span></button>}
        </div>
      </li>)}</ul>
      <Link href="/notifications" className="club-button club-button-secondary" onClick={() => setOpen(false)}>View all notifications</Link>
    </SheetContent>
  </Sheet>;
}
