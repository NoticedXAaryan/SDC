"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EVENT_TYPES = [
  { value: "workshop", label: "Workshop" },
  { value: "hackathon", label: "Hackathon" },
  { value: "meetup", label: "Meetup" },
  { value: "competition", label: "Competition" },
  { value: "talk", label: "Talk" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public — visible to everyone" },
  { value: "members_only", label: "Members Only" },
  { value: "invite_only", label: "Invite Only" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const body = {
      title: form.get("title") as string,
      type: form.get("type") as string,
      domain: form.get("domain") as string || undefined,
      description: form.get("description") as string,
      location: form.get("location") as string || undefined,
      capacity: form.get("capacity") ? Number(form.get("capacity")) : undefined,
      startsAt: new Date(form.get("startsAt") as string).toISOString(),
      endsAt: new Date(form.get("endsAt") as string).toISOString(),
      registrationDeadline: form.get("registrationDeadline")
        ? new Date(form.get("registrationDeadline") as string).toISOString()
        : undefined,
      isPaid,
      price: isPaid ? Number(form.get("price")) : undefined,
      visibility: form.get("visibility") as string,
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/events");
      } else {
        setError(data.error || "Failed to create event");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">Fill in the details to create a new event.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              minLength={3}
              maxLength={200}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g., Web Development Workshop"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type *</label>
              <select
                id="type"
                name="type"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium">Domain</label>
              <input
                id="domain"
                name="domain"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Web, AI/ML, Cybersecurity"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description *</label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Describe the event, what attendees will learn, etc."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g., Room 301, Engineering Block"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Schedule & Capacity</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startsAt" className="text-sm font-medium">Start Date & Time *</label>
              <input id="startsAt" name="startsAt" type="datetime-local" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="endsAt" className="text-sm font-medium">End Date & Time *</label>
              <input id="endsAt" name="endsAt" type="datetime-local" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="registrationDeadline" className="text-sm font-medium">Registration Deadline</label>
              <input id="registrationDeadline" name="registrationDeadline" type="datetime-local" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium">Capacity (max attendees)</label>
              <input id="capacity" name="capacity" type="number" min="1" max="10000" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Leave blank for unlimited" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Visibility & Pricing</h2>

          <div className="space-y-2">
            <label htmlFor="visibility" className="text-sm font-medium">Visibility</label>
            <select id="visibility" name="visibility" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {VISIBILITY_OPTIONS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isPaid"
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="isPaid" className="text-sm font-medium">This is a paid event</label>
          </div>

          {isPaid && (
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Price (INR) *</label>
              <input id="price" name="price" type="number" min="1" step="0.01" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., 100" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Event (Draft)"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Events are created as drafts. You'll need to publish them to make them visible to members.
        </p>
      </form>
    </div>
  );
}
