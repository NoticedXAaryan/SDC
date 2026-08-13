"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Send, Loader2, Users, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Event = {
  id: string;
  title: string;
};

interface IssueCertificateDialogProps {
  templateId: string;
  templateName: string;
  events: Event[];
}

export function IssueCertificateDialog({ templateId, templateName, events }: IssueCertificateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");

  async function handleIssueIndividual(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/certificates/issue-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, templateId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to issue certificate");
      }

      toast.success(`Certificate issue job queued for ${email}`);
      setIsOpen(false);
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleIssueGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error("Please select an event");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, templateId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to issue certificates");
      }

      toast.success("Bulk certificate issue job queued");
      setIsOpen(false);
      setSelectedEventId("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="flex gap-2" />}>
        <Send className="w-4 h-4" />
        Issue
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Issue Certificates</DialogTitle>
          <DialogDescription>
            Issue "{templateName}" to a group of event attendees or an individual.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="group" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="group" className="flex gap-2">
              <Users className="w-4 h-4" />
              Event Group
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex gap-2">
              <User className="w-4 h-4" />
              Individual
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="group" className="pt-4">
            <form onSubmit={handleIssueGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event">Select Event</Label>
                <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || "")} disabled={isLoading}>
                  <SelectTrigger id="event">
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This will queue a certificate for all attendees of this event.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Issuing...</>
                ) : (
                  "Issue to All Attendees"
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="individual" className="pt-4">
            <form onSubmit={handleIssueIndividual} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="user@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  The user must already have an account on the platform.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Issuing...</>
                ) : (
                  "Issue to User"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
