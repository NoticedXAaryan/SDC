"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@/components/astryx/toast-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, CheckCircle2 } from "lucide-react";

export function SubmitAchievementDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { error, success } = useToast();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error("File must be less than 10MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const data = await res.json();
      setProofUrl(data.url);
      success("File uploaded successfully!");
    } catch (err: any) {
      error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (title.length < 5) {
      error("Title must be at least 5 characters");
      return;
    }
    if (description.length < 10) {
      error("Description must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, proofUrl: proofUrl || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit achievement");
      }

      success("Achievement submitted successfully!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setProofUrl("");
      router.refresh();
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<div />}>
        <Button label="Submit Achievement" variant="primary" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Achievement</DialogTitle>
          <DialogDescription>
            Upload a certificate (PDF/Image) or report a new milestone to earn points.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="pt-4">
          <FormLayout>
            <TextInput
              label="Title"
              htmlName="title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. 1st Place at Hackathon"
              isRequired
            />
            <TextArea
              label="Description"
              htmlName="description"
              value={description}
              onChange={setDescription}
              placeholder="Describe what you did..."
              isRequired
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Proof of Achievement</label>
              
              <div className="flex flex-col gap-3">
                {proofUrl ? (
                  <div className="flex items-center gap-2 p-3 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-md">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <Text className="text-sm truncate flex-1">{proofUrl.split("/").pop()}</Text>
                    <button 
                      type="button" 
                      onClick={() => setProofUrl("")}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <TextInput
                        label=""
                        htmlName="proofUrl"
                        type="text"
                        value={proofUrl}
                        onChange={setProofUrl}
                        placeholder="Paste URL or upload file..."
                      />
                    </div>
                    <div className="pt-1">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileUpload}
                      />
                      <Button 
                        type="button"
                        variant="secondary"
                        label={uploading ? "..." : ""}
                        icon={uploading ? undefined : <UploadCloud className="w-4 h-4" />}
                        onClick={() => fileInputRef.current?.click()}
                        isDisabled={uploading}
                      />
                    </div>
                  </div>
                )}
                <Text type="supporting" className="text-xs">
                  Upload a PDF/Image (Max 10MB) or provide a public link.
                </Text>
              </div>
            </div>

            <div className="flex justify-end pt-2 mt-4">
              <Button 
                type="submit" 
                label={loading ? "Submitting..." : "Submit"} 
                variant="primary" 
                isDisabled={loading || uploading} 
              />
            </div>
          </FormLayout>
        </form>
      </DialogContent>
    </Dialog>
  );
}
