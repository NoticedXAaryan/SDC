"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";

interface RejectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reasonCode: string, reasonNote: string) => void;
  title?: string;
  description?: string;
}

const REASON_CODES = [
  { value: "INCOMPLETE_PROFILE", label: "Incomplete profile / missing resume" },
  { value: "SKILL_MISMATCH", label: "Skill mismatch for this role" },
  { value: "EXPERIENCE", label: "Experience criteria not met" },
  { value: "PLAGIARISM", label: "Plagiarism / AI generated" },
  { value: "DEADLINE", label: "Applied after deadline" },
  { value: "OTHER", label: "Other - custom reason" }
];

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <FormLayout>
            <Selector
              htmlName="reasonCode"
              label="Reason Code"
              options={REASON_CODES}
              value={reasonCode}
              onChange={setReasonCode}
              isRequired
            />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-[-12px] z-10 relative px-1">
                {/* Visual alignment with TextArea label */}
                <span /> 
                <button 
                  type="button"
                  className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  onClick={handleGenerateAI}
                  disabled={!reasonCode || isGenerating}
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  Draft with AI
                </button>
              </div>
              <TextArea 
                htmlName="reasonNote"
                label="Additional Notes (Optional)"
                value={reasonNote} 
                onChange={setReasonNote} 
                placeholder="Provide more context..."
              />
            </div>
            
            <div className="flex justify-end pt-2 gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                label="Cancel" 
                onClick={() => onOpenChange(false)} 
              />
              <Button 
                type="button" 
                variant="destructive" 
                label="Reject" 
                onClick={handleConfirm} 
                isDisabled={!reasonCode} 
              />
            </div>
          </FormLayout>
        </div>
      </DialogContent>
    </Dialog>
  );
}
