"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";

type Item = { id: string; title: string; message: string; read: boolean; link: string | null; createdAt: string };
export function NotificationInbox({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useHydrated();
  const unread = items.filter(item => !item.read);
  async function markRead(ids: string[]) {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationIds: ids }) });
      if (!response.ok) throw new Error();
      setItems(previous => previous.map(item => ids.includes(item.id) ? { ...item, read: true } : item));
    } catch { setError("Couldn't mark these updates as read. Please try again."); }
    finally { setPending(false); }
  }
  return <>
    {unread.length > 0 && <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><span className="club-field-help" role="status">{unread.length} unread {unread.length === 1 ? "update" : "updates"}</span><button type="button" className="club-button club-button-secondary" disabled={!hydrated || pending} onClick={() => void markRead(unread.map(item => item.id))}><CheckCheck size={16} aria-hidden="true" />Mark all as read</button></div>}
    {error && <p className="club-form-error mb-4" role="alert">{error}</p>}
    <div className="club-inbox">{items.length === 0 ? <div className="club-inbox-empty"><CheckCheck size={32} aria-hidden="true" /><h2>You're all caught up.</h2><p className="club-field-help">Application decisions and event updates will appear here.</p><Link href="/dashboard" className="club-text-link mt-4">Back to your home</Link></div> : items.map(item => <article key={item.id} className="club-inbox-item">
      <header><Bell size={18} aria-hidden="true" className="mt-1 shrink-0" /><div><h2>{item.title}</h2><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST</time></div>{!item.read && <span className="club-status">New</span>}</header>
      <p>{item.message}</p><div className="flex flex-wrap gap-5">
        {item.link?.startsWith("/") && !item.link.startsWith("//") && !item.link.includes("\\") && <Link href={item.link} className="club-text-link">View update</Link>}
        {!item.read && <button type="button" className="club-text-link" disabled={!hydrated || pending} onClick={() => void markRead([item.id])}>Mark as read<span className="sr-only">: {item.title}</span></button>}
      </div>
    </article>)}</div>
  </>;
}
