"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CommunicationsActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, link: link || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Announcement sent!");
        setTitle("");
        setMessage("");
        setLink("");
        setIsOpen(false);
      } else {
        toast.error(data.error || "Failed to send announcement");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        variant="primary" 
        label="New Announcement" 
        icon={<Bell className="w-4 h-4" />}
        onClick={() => setIsOpen(true)} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-foreground">New Announcement</h2>
        <p className="text-xs text-muted-foreground">
          This will send a notification to all club members.
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Link (optional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" label="Cancel" onClick={() => setIsOpen(false)} isDisabled={sending} />
          <Button 
            variant="primary" 
            label={sending ? "Sending..." : "Send Announcement"} 
            onClick={handleSend}
            isDisabled={sending || !title.trim() || !message.trim()}
            icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );
}
