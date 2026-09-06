"use client";

import { useState } from "react";
import { Landmark, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EventOption = { id: string; title: string };

function FinanceMutationDialog({
  kind,
  events,
  onChanged,
}: {
  kind: "budget" | "income";
  events: EventOption[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventId, setEventId] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const isBudget = kind === "budget";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(isBudget ? "/api/finance/budgets" : "/api/finance/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, [isBudget ? "allocated" : "amount"]: Number(amount), ...(!isBudget ? { source: source.trim() } : {}) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || `${isBudget ? "Budget" : "Income"} could not be recorded`);
      toast.success(isBudget ? "Budget allocated" : "Income recorded");
      setOpen(false);
      setEventId("");
      setAmount("");
      setSource("");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Finance record could not be saved");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={events.length === 0} />}>
        {isBudget ? <Landmark aria-hidden="true" /> : <PlusCircle aria-hidden="true" />}
        {isBudget ? "Allocate Budget" : "Record Income"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isBudget ? "Allocate Event Budget" : "Record Event Income"}</DialogTitle>
          <DialogDescription>
            {isBudget ? "Set the approved spending ceiling for an event." : "Record sponsorships, ticket receipts, or other event income."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`${kind}-event`}>Event</Label>
            <Select name="eventId" value={eventId} onValueChange={(value) => setEventId(value || "")} required>
              <SelectTrigger id={`${kind}-event`} className="w-full"><SelectValue placeholder="Select an event…" /></SelectTrigger>
              <SelectContent>{events.map((event) => <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-amount`}>{isBudget ? "Allocated Amount" : "Amount"} (₹)</Label>
            <Input id={`${kind}-amount`} name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </div>
          {!isBudget ? (
            <div className="space-y-2">
              <Label htmlFor="income-source">Source</Label>
              <Input id="income-source" name="source" autoComplete="off" maxLength={200} placeholder="Sponsor, tickets, membership…" value={source} onChange={(event) => setSource(event.target.value)} required />
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={submitting || !eventId || !amount || (!isBudget && !source.trim())}>
            {submitting ? "Saving…" : isBudget ? "Allocate Budget" : "Record Income"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AllocateBudgetDialog(props: { events: EventOption[]; onChanged: () => void }) {
  return <FinanceMutationDialog kind="budget" {...props} />;
}

export function RecordIncomeDialog(props: { events: EventOption[]; onChanged: () => void }) {
  return <FinanceMutationDialog kind="income" {...props} />;
}
