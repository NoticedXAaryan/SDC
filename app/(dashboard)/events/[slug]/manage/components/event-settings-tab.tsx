"use client";

import { Card, Heading, Text, VStack, HStack, Button, TextInput } from "@astryxdesign/core";
import { Settings, Save, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function EventSettingsTab({ event, canCancel }: { event: any; canCancel: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    capacity: event.capacity ?? 50,
    type: event.type || "workshop",
    visibility: event.visibility || "public",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Failed to update event");
      toast.success("Event updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update event settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Failed to cancel event");
      toast.success("Event cancelled");
      setCancelDialogOpen(false);
      router.push("/events");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel event");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Heading level={4}>Event Settings</Heading>
        <Text type="supporting">Update core event details and configuration.</Text>
      </div>

      <Card padding={6}>
        <VStack gap={6}>
          <div className="grid gap-4 md:grid-cols-2">
            <VStack gap={2}>
              <TextInput 
                label="Event Title"
                value={formData.title}
                onChange={(val) => setFormData(prev => ({...prev, title: val}))}
                placeholder="Event Title"
              />
            </VStack>
            
            <VStack gap={2}>
              <TextInput 
                label="Location"
                value={formData.location}
                onChange={(val) => setFormData(prev => ({...prev, location: val}))}
                placeholder="Location (e.g. Room 101, Zoom Link)"
              />
            </VStack>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <VStack gap={2}>
              <label className="text-sm font-medium">Event Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                className="w-full h-10 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="seminar">Seminar</option>
                <option value="social">Social</option>
                <option value="competition">Competition</option>
              </select>
            </VStack>
            <VStack gap={2}>
              <label className="text-sm font-medium">Visibility</label>
              <select 
                value={formData.visibility}
                onChange={(e) => setFormData(prev => ({...prev, visibility: e.target.value}))}
                className="w-full h-10 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="members_only">Members Only</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </VStack>
          </div>
          
          <VStack gap={2}>
            <TextInput 
              label="Capacity"
              value={formData.capacity.toString()}
              onChange={(val) => setFormData(prev => ({...prev, capacity: parseInt(val) || 0}))}
              placeholder="Capacity"
            />
          </VStack>

          <VStack gap={2}>
            <label className="text-sm font-medium">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              placeholder="Event Description..."
              className="w-full min-h-[120px] p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          </VStack>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button 
              variant="primary" 
              icon={<Save className="w-4 h-4" />} 
              label={loading ? "Saving..." : "Save Changes"} 
              onClick={handleSave} 
              isDisabled={loading}
            />
          </div>
        </VStack>
      </Card>
      
      {canCancel && event.status !== "cancelled" && (
        <div className="rounded-xl border border-red-500/20 bg-card p-6">
          <HStack justify="between" align="center" className="gap-4">
            <VStack gap={1}>
              <HStack align="center" gap={2}>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <Heading level={5} className="text-red-500">Cancel event</Heading>
              </HStack>
              <Text type="supporting" className="text-sm">
                Remove this event from active operations while preserving its registrations, attendance, and audit history.
              </Text>
            </VStack>
            <Button
              variant="destructive"
              icon={<Trash2 className="w-4 h-4" />}
              label="Cancel Event"
              onClick={() => setCancelDialogOpen(true)}
            />
          </HStack>
        </div>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {event.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              The event will no longer be active, but its registrations, attendance, certificates, and audit history will be retained.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep event</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                void handleCancel();
              }}
            >
              {cancelling ? "Cancelling…" : "Cancel event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
