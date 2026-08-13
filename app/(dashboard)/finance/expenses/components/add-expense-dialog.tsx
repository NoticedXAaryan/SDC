"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddExpenseDialog({ budgets }: { budgets: { id: string; eventTitle: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [budgetId, setBudgetId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetId || !amount || !category) return;

    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId,
          amount: parseFloat(amount),
          category,
          receiptUrl: receiptUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit expense");
      }

      toast.success("Expense submitted successfully");
      setOpen(false);
      
      setBudgetId("");
      setAmount("");
      setCategory("");
      setReceiptUrl("");
      
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"><Plus className="w-4 h-4 mr-2" /> Submit Expense</div>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit New Expense</DialogTitle>
            <DialogDescription>
              Submit an expense for reimbursement against an event budget.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="budget">Event Budget</Label>
              <Select value={budgetId} onValueChange={(val) => setBudgetId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget..." />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.eventTitle || "General Budget"}</SelectItem>
                  ))}
                  {budgets.length === 0 && <SelectItem value="none" disabled>No budgets available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="1500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Food, Logistics" />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="receipt">Receipt URL (Optional)</Label>
              <Input id="receipt" type="url" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !budgetId}>{loading ? "Submitting..." : "Submit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
