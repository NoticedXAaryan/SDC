"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Heading, Text, HStack, VStack, TextInput, TextArea, Selector, Switch } from "@astryxdesign/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "workshop", label: "Workshop" },
  { value: "hackathon", label: "Hackathon" },
  { value: "seminar", label: "Seminar" },
  { value: "social", label: "Social" },
  { value: "competition", label: "Competition" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public — visible to everyone" },
  { value: "members_only", label: "Members Only" },
  { value: "invite_only", label: "Invite Only" },
];

const formatDateForInput = (isoString?: Date | string | null) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function EditEventForm({ event }: { event: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: event.title || "",
    type: event.type || "workshop",
    domain: event.domain || "",
    description: event.description || "",
    location: event.location || "",
    startsAt: formatDateForInput(event.startsAt),
    endsAt: formatDateForInput(event.endsAt),
    registrationDeadline: formatDateForInput(event.registrationDeadline),
    capacity: event.capacity?.toString() || "",
    visibility: event.visibility || "public",
    isPaid: event.isPaid || false,
    price: event.price?.toString() || "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parseDate = (val: string | null) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const body = {
      title: formData.title,
      type: formData.type,
      domain: formData.domain || undefined,
      description: formData.description,
      location: formData.location || undefined,
      capacity: formData.capacity ? Number(formData.capacity) : null,
      startsAt: parseDate(formData.startsAt),
      endsAt: parseDate(formData.endsAt),
      registrationDeadline: parseDate(formData.registrationDeadline),
      isPaid: formData.isPaid,
      price: formData.isPaid && formData.price ? Number(formData.price) : null,
      visibility: formData.visibility,
    };

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Event updated successfully.");
        router.push(`/events/${data.event?.slug || event.slug}`);
        router.refresh();
      } else {
        setError(data.error || "Failed to update event");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <VStack gap={1}>
        <Heading level={1} className="text-3xl font-bold tracking-tight">Edit Event</Heading>
        <Text type="supporting">Update details for {event.title}.</Text>
      </VStack>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding={6}>
          <VStack gap={6}>
            <Heading level={3}>Basic Information</Heading>
            <VStack gap={4}>
              <TextInput
                label="Title *"
                htmlName="title"
                value={formData.title}
                onChange={(value) => setFormData(prev => ({...prev, title: value}))}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Selector
                  label="Type *"
                  htmlName="type"
                  options={EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({...prev, type: value || "workshop"}))}
                  isRequired
                />
                <TextInput
                  label="Domain"
                  htmlName="domain"
                  value={formData.domain}
                  onChange={(value) => setFormData(prev => ({...prev, domain: value}))}
                />
              </div>

              <TextArea
                label="Description *"
                htmlName="description"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({...prev, description: value}))}
                isRequired
                rows={4}
              />

              <TextInput
                label="Location"
                htmlName="location"
                value={formData.location}
                onChange={(value) => setFormData(prev => ({...prev, location: value}))}
              />
            </VStack>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={6}>
            <Heading level={3}>Schedule & Capacity</Heading>
            <VStack gap={4}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startsAt" className="text-sm font-medium">Start Date & Time *</Label>
                  <Input id="startsAt" name="startsAt" type="datetime-local" required value={formData.startsAt} onChange={(e) => setFormData(prev => ({...prev, startsAt: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endsAt" className="text-sm font-medium">End Date & Time *</Label>
                  <Input id="endsAt" name="endsAt" type="datetime-local" required value={formData.endsAt} onChange={(e) => setFormData(prev => ({...prev, endsAt: e.target.value}))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="registrationDeadline" className="text-sm font-medium">Registration Deadline</Label>
                  <Input id="registrationDeadline" name="registrationDeadline" type="datetime-local" value={formData.registrationDeadline} onChange={(e) => setFormData(prev => ({...prev, registrationDeadline: e.target.value}))} />
                </div>
                <TextInput
                  label="Capacity (max attendees)"
                  htmlName="capacity"
                  type="text"
                  value={formData.capacity}
                  onChange={(value) => setFormData(prev => ({...prev, capacity: value}))}
                />
              </div>
            </VStack>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={6}>
            <Heading level={3}>Visibility & Pricing</Heading>
            <VStack gap={6}>
              <Selector
                label="Visibility"
                htmlName="visibility"
                options={VISIBILITY_OPTIONS.map(v => ({ value: v.value, label: v.label }))}
                value={formData.visibility}
                onChange={(value) => setFormData(prev => ({...prev, visibility: value || "public"}))}
              />

              <Switch 
                label="This is a paid event"
                value={formData.isPaid}
                onChange={(checked) => setFormData(prev => ({...prev, isPaid: checked}))}
              />

              {formData.isPaid && (
                <div className="space-y-2 max-w-sm">
                  <TextInput
                    label="Price (INR) *"
                    htmlName="price"
                    type="text"
                    value={formData.price}
                    onChange={(value) => setFormData(prev => ({...prev, price: value}))}
                    isRequired
                  />
                </div>
              )}
            </VStack>
          </VStack>
        </Card>

        <HStack align="center" gap={4}>
          <Button type="submit" isDisabled={loading} label={loading ? "Saving..." : "Save Changes"} />
          <Button type="button" variant="secondary" onClick={() => router.back()} isDisabled={loading} label="Cancel" />
        </HStack>
      </form>
    </div>
  );
}
