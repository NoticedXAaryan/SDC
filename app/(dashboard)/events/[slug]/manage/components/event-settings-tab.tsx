"use client";

import { Card, Heading, Text, VStack, HStack, Button, TextInput } from "@astryxdesign/core";
import { Settings, Save, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EventSettingsTab({ event }: { event: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    capacity: event.capacity || 50,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to update event");
      toast.success("Event updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update event settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete event");
      toast.success("Event deleted successfully");
      router.push("/events");
    } catch (error) {
      toast.error("Failed to delete event");
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
      
      <div className="rounded-xl border border-red-500/20 bg-card p-6">
        <HStack justify="between" align="center">
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <AlertCircle className="w-5 h-5 text-red-500" />
              <Heading level={5} className="text-red-500">Danger Zone</Heading>
            </HStack>
            <Text type="supporting" className="text-sm">
              Permanently delete this event and all associated data.
            </Text>
          </VStack>
          <Button variant="destructive" icon={<Trash2 className="w-4 h-4" />} label="Delete Event" onClick={handleDelete} />
        </HStack>
      </div>
    </div>
  );
}
