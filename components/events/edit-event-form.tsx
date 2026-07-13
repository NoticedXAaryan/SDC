"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [isPaid, setIsPaid] = useState(event.isPaid || false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const parseDate = (val: FormDataEntryValue | null) => {
      if (!val || typeof val !== "string") return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const body = {
      title: form.get("title") as string,
      type: form.get("type") as string,
      domain: form.get("domain") as string || undefined,
      description: form.get("description") as string,
      location: form.get("location") as string || undefined,
      capacity: form.get("capacity") ? Number(form.get("capacity")) : null,
      startsAt: parseDate(form.get("startsAt")),
      endsAt: parseDate(form.get("endsAt")),
      registrationDeadline: parseDate(form.get("registrationDeadline")),
      isPaid,
      price: isPaid ? Number(form.get("price")) : null,
      visibility: form.get("visibility") as string,
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
        <p className="text-muted-foreground mt-1">Update details for {event.title}.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={200}
                defaultValue={event.title}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  name="type"
                  required
                  defaultValue={event.type}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  defaultValue={event.domain || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                minLength={10}
                rows={4}
                defaultValue={event.description || ""}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={event.location || ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date & Time *</Label>
                <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={formatDateForInput(event.startsAt)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Date & Time *</Label>
                <Input id="endsAt" name="endsAt" type="datetime-local" required defaultValue={formatDateForInput(event.endsAt)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input id="registrationDeadline" name="registrationDeadline" type="datetime-local" defaultValue={formatDateForInput(event.registrationDeadline)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (max attendees)</Label>
                <Input id="capacity" name="capacity" type="number" min="1" max="10000" defaultValue={event.capacity || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="visibility">Visibility</Label>
              <select 
                id="visibility" 
                name="visibility"
                defaultValue={event.visibility}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {VISIBILITY_OPTIONS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPaid" 
                name="isPaid" 
                checked={isPaid} 
                onCheckedChange={(c) => setIsPaid(c as boolean)} 
                value="true"
              />
              <Label htmlFor="isPaid" className="cursor-pointer font-normal">This is a paid event</Label>
            </div>

            {isPaid && (
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="price">Price (INR) *</Label>
                <Input id="price" name="price" type="number" min="1" step="0.01" required defaultValue={event.price || ""} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
