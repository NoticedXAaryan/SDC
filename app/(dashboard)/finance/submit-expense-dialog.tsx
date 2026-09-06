"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExpenseBudget = { id: string; eventId: string; allocated: string; eventTitle?: string | null };

export function SubmitExpenseDialog({ budgets, onSubmitted }: { budgets: ExpenseBudget[], onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ budgetId: "", amount: "", category: "general", receiptUrl: "" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.budgetId || !form.amount || !form.category.trim()) return toast.error("Choose a budget and enter the expense details");
    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: form.category.trim(), receiptUrl: form.receiptUrl || undefined, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success("Expense submitted");
      setOpen(false);
      setForm({ budgetId: "", amount: "", category: "general", receiptUrl: "" });
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Expense could not be submitted");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary/10 text-primary hover:bg-primary/20" disabled={budgets.length === 0} />}>
        <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Submit Expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="expense-budget">Event Budget</Label>
            <Select name="budgetId" value={form.budgetId} onValueChange={(value) => setForm((current) => ({ ...current, budgetId: value || "" }))} required>
              <SelectTrigger id="expense-budget" className="w-full"><SelectValue placeholder="Select an event budget…" /></SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>{budget.eventTitle || budget.eventId.slice(0, 8)} — ₹{Number(budget.allocated).toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (₹)</Label>
            <Input id="expense-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" autoComplete="off" placeholder="1,500…" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Input id="expense-category" name="category" autoComplete="off" maxLength={100} placeholder="Equipment, food, marketing…" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-receipt">Receipt Link (Optional)</Label>
            <Input id="expense-receipt" name="receiptUrl" type="url" autoComplete="off" placeholder="https://drive.google.com/…" value={form.receiptUrl} onChange={(event) => setForm((current) => ({ ...current, receiptUrl: event.target.value }))} />
          </div>
          <Button type="submit" disabled={loading || !form.budgetId} className="w-full">{loading ? "Submitting…" : "Submit Expense"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
