"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type FormField = { id: string; type: string; question: string; required: boolean; options?: string[] };

export function RegisterButton({ eventId, forms, isWaitlist }: { eventId: string; forms?: FormField[]; isWaitlist?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  const router = useRouter();
  const handleRegister = async () => {
    if (forms?.length) {
      // Validate required fields
      const missing = forms.find(f => f.required && !formResponses[f.id]);
      if (missing) {
        toast.error("Validation Error", { description: `Please fill out "${missing.question}"` });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formResponses })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.status === "waitlist" ? "Added to Waitlist" : "Registration Successful", { 
          description: data.message 
        });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to register", { description: data.error });
      }
    } catch (error) {
      toast.error("Network Error", { description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const buttonText = isWaitlist ? "Join Waitlist" : "Register Now";

  if (!forms || forms.length === 0) {
    return (
      <Button onClick={handleRegister} disabled={loading} className="w-full">
        {loading ? "Processing..." : buttonText}
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        {buttonText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Registration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {forms.map(field => (
            <div key={field.id} className="space-y-2">
              <Label>{field.question} {field.required && <span className="text-red-500">*</span>}</Label>
              {field.type === "text" && (
                <Input 
                  value={formResponses[field.id] || ""} 
                  onChange={e => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                />
              )}
              {field.type === "textarea" && (
                <Textarea 
                  value={formResponses[field.id] || ""} 
                  onChange={e => setFormResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                />
              )}
              {field.type === "dropdown" && field.options && (
                <Select 
                  value={formResponses[field.id] || ""} 
                  onValueChange={v => { if (v) setFormResponses(prev => ({ ...prev, [field.id]: v })) }}
                >
                  <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRegister} disabled={loading}>
            {loading ? "Processing..." : "Complete Registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
