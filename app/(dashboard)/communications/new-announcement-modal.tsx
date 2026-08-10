"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell } from "lucide-react";
import { Button as AstryxButton } from "@astryxdesign/core/Button";

export function NewAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  
  const router = useRouter();

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Required Fields", { description: "Title and message are required." });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, link }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to broadcast");
      }
      
      toast.success("Announcement Broadcasted", { description: "Message has been sent to all members." });
      setIsOpen(false);
      setTitle("");
      setMessage("");
      setLink("");
      router.refresh();
    } catch (e: any) {
      toast.error("Error", { description: e.message || "Failed to send announcement." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <div className="inline-block">
          <AstryxButton variant="primary" label="New Announcement" icon={<Bell className="w-4 h-4" />} />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Broadcast Announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              placeholder="e.g. Venue Change for Hackathon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="The venue has been moved to..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Link (Optional)</label>
            <Input 
              placeholder="e.g. https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
