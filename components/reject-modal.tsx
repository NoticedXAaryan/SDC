"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";

interface RejectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reasonCode: string, reasonNote: string) => void;
  title?: string;
  description?: string;
}

export function RejectModal({ isOpen, onOpenChange, onConfirm, title = "Reject Request", description = "Please provide a reason for rejection." }: RejectModalProps) {
  const [reasonCode, setReasonCode] = useState<string>("");
  const [reasonNote, setReasonNote] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!reasonCode) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-rejection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonCode, context: description })
      });
      if (res.ok) {
        const data = await res.json();
        setReasonNote(data.note);
      }
    } catch (e) {
      console.error("AI Generation failed", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!reasonCode) return;
    onConfirm(reasonCode, reasonNote);
    onOpenChange(false);
    setReasonCode("");
    setReasonNote("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason Code</Label>
            <Select value={reasonCode} onValueChange={(val: any) => setReasonCode(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOMPLETE_PROFILE">Incomplete profile / missing resume</SelectItem>
                <SelectItem value="SKILL_MISMATCH">Skill mismatch for this role</SelectItem>
                <SelectItem value="EXPERIENCE">Experience criteria not met</SelectItem>
                <SelectItem value="PLAGIARISM">Plagiarism / AI generated</SelectItem>
                <SelectItem value="DEADLINE">Applied after deadline</SelectItem>
                <SelectItem value="OTHER">Other - custom reason</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Additional Notes (Optional)</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-primary" 
                onClick={handleGenerateAI}
                disabled={!reasonCode || isGenerating}
                type="button"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                Draft with AI
              </Button>
            </div>
            <Textarea 
              value={reasonNote} 
              onChange={e => setReasonNote(e.target.value)} 
              placeholder="Provide more context..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reasonCode}>Reject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
