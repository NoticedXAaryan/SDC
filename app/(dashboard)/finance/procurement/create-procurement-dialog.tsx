"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function CreateProcurementDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", estimatedCost: "" });
  const router = useRouter();

  const handleSubmit = async () => {
    if (!form.title || !form.description) return toast.error("Missing fields");
    setLoading(true);
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast.success("Procurement requested");
      setOpen(false);
      setForm({ title: "", description: "", estimatedCost: "" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary/10 text-primary hover:bg-primary/20"><Plus className="w-4 h-4 mr-2"/> Request Procurement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Procurement Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input 
            placeholder="Title (e.g. 10x Monitors)" 
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
          />
          <Input 
            placeholder="Description" 
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
          />
          <Input 
            type="number" 
            placeholder="Estimated Cost (Optional)" 
            value={form.estimatedCost}
            onChange={e => setForm({...form, estimatedCost: e.target.value})}
          />
          <Button onClick={handleSubmit} disabled={loading} className="w-full">Submit Request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
