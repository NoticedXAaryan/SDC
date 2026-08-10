"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

export function ClubSettingsForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    // Mock save delay
    await new Promise(r => setTimeout(r, 600));
    toast.success("Settings Saved", { description: "Club settings have been updated." });
    setIsSaving(false);
  };

  return (
    <VStack gap={6}>
      <div className="space-y-6 pt-4">
        <div className="grid gap-2 max-w-md">
          <TextInput label="Club Name" value="Student Developer Club" isDisabled />
        </div>
        <div className="grid gap-2 max-w-md">
          <TextInput 
            label="Custom Domain" 
            value={domain} 
            onChange={(val) => setDomain(val)}
            placeholder="e.g. members.sdc.org" 
          />
        </div>
        <div className="grid gap-2 max-w-md">
          <TextInput 
            label="Global API Key (Resend, etc)" 
            value={apiKey}
            onChange={(val) => setApiKey(val)}
            type="password" 
            placeholder="sk_test_..." 
          />
        </div>
      </div>
      
      <div className="pt-4 border-t border-border">
        <div onClick={handleSave} className="inline-block">
            <Button label={isSaving ? "Saving..." : "Save Changes"} variant="primary" isDisabled={isSaving} />
        </div>
      </div>
    </VStack>
  );
}
