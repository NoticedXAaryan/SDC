"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

type EventOption = { id: string; title: string };

export function CreateProcurementDialog({ events }: { events: EventOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", estimatedCost: "", eventId: "" });
  const router = useRouter();

  const handleSubmit = async () => {
    if (form.title.trim().length < 5 || form.description.trim().length < 10) {
      return toast.error("Add a clear title and at least 10 characters of context.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          eventId: form.eventId || undefined,
          estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast.success("Procurement requested");
      setOpen(false);
      setForm({ title: "", description: "", estimatedCost: "", eventId: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Procurement request could not be created");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden="true" /> Request Procurement
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Procurement Request</DialogTitle>
          <DialogDescription>Capture the need now, then attach vendor quotes before approval.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="procurement-title">Request title</Label>
            <Input
            id="procurement-title"
            name="title"
            autoComplete="off"
            minLength={5}
            maxLength={160}
            placeholder="10 monitors for the coding lab"
            value={form.title}
            onChange={e => setForm(current => ({...current, title: e.target.value}))}
            required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurement-description">Why it is needed</Label>
            <Textarea
            id="procurement-description"
            name="description"
            minLength={10}
            maxLength={2000}
            placeholder="Explain the use, deadline, and expected outcome."
            value={form.description}
            onChange={e => setForm(current => ({...current, description: e.target.value}))}
            required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurement-event">Related event (optional)</Label>
            <Select name="eventId" value={form.eventId} onValueChange={(value) => setForm(current => ({ ...current, eventId: value || "" }))}>
              <SelectTrigger id="procurement-event" className="w-full"><SelectValue placeholder="Select an event…" /></SelectTrigger>
              <SelectContent>{events.map((event) => <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurement-cost">Estimated cost (₹, optional)</Label>
            <Input
            id="procurement-cost"
            name="estimatedCost"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            autoComplete="off"
            value={form.estimatedCost}
            onChange={e => setForm(current => ({...current, estimatedCost: e.target.value}))}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating…" : "Create Draft Request"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateVendorDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), category: category.trim() }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Vendor could not be created");
      toast.success("Vendor added");
      setOpen(false);
      setName("");
      setEmail("");
      setCategory("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vendor could not be created");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}><Plus aria-hidden="true" /> Add Vendor</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Approved Vendor</DialogTitle>
          <DialogDescription>Add a reusable vendor record for quote selection and future requests.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2"><Label htmlFor="vendor-name">Vendor name</Label><Input id="vendor-name" name="name" minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="vendor-email">Email (optional)</Label><Input id="vendor-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="vendor-category">Category (optional)</Label><Input id="vendor-category" name="category" autoComplete="off" maxLength={100} placeholder="Printing, hardware, catering…" value={category} onChange={(event) => setCategory(event.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading || name.trim().length < 2}>{loading ? "Adding…" : "Add Vendor"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
