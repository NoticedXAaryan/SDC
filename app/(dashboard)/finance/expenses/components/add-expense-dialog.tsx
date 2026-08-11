"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogHeader, TextInput, Selector, HStack, VStack, Text, Icon } from "@astryxdesign/core";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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

  const budgetOptions = budgets.map(b => ({
    label: b.eventTitle || "General Budget",
    value: b.id,
  }));

  return (
    <>
      <Button 
        variant="primary" 
        icon={<Plus className="w-4 h-4" />}
        label="Submit Expense"
        onClick={() => setOpen(true)}
      />
      <Dialog isOpen={open} onOpenChange={(val: boolean) => setOpen(val)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader title="Submit New Expense" />
          <VStack gap={4} className="py-4">
            <Text type="supporting" className="text-sm">
              Submit an expense for reimbursement against an event budget.
            </Text>
            
            <Selector
              label="Event Budget"
              value={budgetId}
              onChange={(val) => setBudgetId(val || "")}
              options={budgetOptions}
              placeholder="Select budget..."
            />
            
            <HStack gap={4} className="w-full">
              <TextInput 
                id="amount" 
                label="Amount (₹)"
                value={amount} 
                onChange={val => setAmount(val)} 
                isRequired
                placeholder="1500" 
              />
              <TextInput 
                id="category" 
                label="Category"
                value={category} 
                onChange={val => setCategory(val)} 
                isRequired
                placeholder="e.g. Food, Logistics" 
              />
            </HStack>
            
            <TextInput 
              id="receipt" 
              label="Receipt URL (Optional)"
              value={receiptUrl} 
              onChange={val => setReceiptUrl(val)} 
              placeholder="https://drive.google.com/..." 
            />
          </VStack>
          <HStack gap={2} justify="end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} isDisabled={loading} label="Cancel" />
            <Button type="submit" isDisabled={loading || !budgetId} label={loading ? "Submitting..." : "Submit"} />
          </HStack>
        </form>
      </Dialog>
    </>
  );
}
