"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogHeader, TextInput, HStack, VStack, Text } from "@astryxdesign/core";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function CreateTemplateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a template name");
      return;
    }
    if (!file) {
      toast.error("Please select a base PDF file");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload PDF
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Failed to upload file");
      }
      
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.url;

      // 2. Create Template
      const templateRes = await fetch("/api/certificates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          basePdf: fileUrl 
        }),
      });

      if (!templateRes.ok) {
        const err = await templateRes.json();
        throw new Error(err.error || "Failed to create template");
      }

      const templateData = await templateRes.json();
      
      toast.success("Template created successfully");
      setIsOpen(false);
      setName("");
      setFile(null);
      
      // Redirect to the designer
      router.push(`/lead/certificates/templates/${templateData.id}/edit`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button 
        variant="primary" 
        onClick={() => setIsOpen(true)}
        icon={<Plus className="w-4 h-4" />}
        label="Create New Template"
      />
      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <form onSubmit={handleCreate}>
          <DialogHeader title="Create Certificate Template" />
          <VStack gap={4} className="py-4">
            <Text type="supporting" className="text-sm">
              Upload a base PDF to use as the background for your certificate template.
            </Text>
            
            <TextInput 
              id="name" 
              label="Template Name"
              placeholder="e.g. Winner Certificate" 
              value={name} 
              onChange={val => setName(val)} 
              isDisabled={isLoading}
            />
            
            {/* Astryx TextInput doesn't natively support type="file" well, but we can pass input props if needed. 
                Using a native input here with styling or passing type="file" to TextInput. 
                Wait, Astryx has FileInput exported from index.ts! I will use standard input for simplicity. */}
            <VStack gap={2}>
              <Text type="supporting" className="text-sm font-medium">Base PDF File</Text>
              <input 
                id="pdf" 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </VStack>
          </VStack>
          <HStack gap={2} justify="end">
            <Button type="submit" isDisabled={isLoading} label={isLoading ? "Creating..." : "Create Template"} icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined} />
          </HStack>
        </form>
      </Dialog>
    </>
  );
}
