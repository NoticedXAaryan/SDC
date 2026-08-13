"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function SubmitExpenseDialog({ budgets, onSubmitted }: { budgets: any[], onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ eventId: "", amount: "", category: "general" });

  const handleSubmit = async () => {
    if (!form.eventId || !form.amount) return toast.error("Missing fields");
    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success("Expense submitted");
      setOpen(false);
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary/10 text-primary hover:bg-primary/20"><Plus className="w-4 h-4 mr-2"/> Submit Expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit New Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={form.eventId} 
            onChange={e => setForm({...form, eventId: e.target.value})}
          >
            <option value="">Select Event Budget</option>
            {budgets.map(b => (
              <option key={b.eventId} value={b.eventId}>{b.eventId.slice(0, 8)} - ₹{b.allocated}</option>
            ))}
          </select>
          <Input 
            type="number" 
            placeholder="Amount" 
            value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
          />
          <Input 
            placeholder="Category (e.g., marketing, equipment)" 
            value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}
          />
          <Button onClick={handleSubmit} disabled={loading} className="w-full">Submit Expense</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
