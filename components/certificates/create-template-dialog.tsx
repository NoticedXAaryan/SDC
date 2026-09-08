"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface CertificateEventContext {
  id: string;
  title: string;
}

export function CreateTemplateDialog({ event }: { event?: CertificateEventContext }) {
  const defaultName = event ? `${event.title} certificate` : "";
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(defaultName);
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
          eventId: event?.id,
          backgroundUrl: fileUrl,
        }),
      });

      if (!templateRes.ok) {
        const err = await templateRes.json();
        throw new Error(err.error || "Failed to create template");
      }

      const templateData = await templateRes.json();
      
      toast.success("Template created successfully");
      setIsOpen(false);
      setName(defaultName);
      setFile(null);
      
      // Redirect to the designer
      router.push(`/lead/certificates/templates/${templateData.template.id}/edit`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button className="flex gap-2" />}>
        <Plus className="w-4 h-4" />
        {event ? "Create event template" : "Create new template"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Certificate Template</DialogTitle>
          <DialogDescription>
            {event
              ? `Create and attach the certificate design for ${event.title}.`
              : "Upload a base PDF to use as the background for your certificate template."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Winner Certificate" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf">Approved base PDF</Label>
            <Input 
              id="pdf" 
              type="file" 
              accept="application/pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                event ? "Create and attach template" : "Create template"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
