"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useToast } from "@/components/astryx/toast-provider";

type CertificateEvent = { id: string; title: string };

export function CertificateBuilderClient({ events }: { events: CertificateEvent[] }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("none");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Upload failed");
      setBackgroundUrl(payload.url);
      success("Background uploaded");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Failed to upload background");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !backgroundUrl) {
      error("Template name and a PDF background are required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/certificates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          eventId: eventId === "none" ? null : eventId,
          backgroundUrl,
          fields: [[]],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to create template");
      success("Template created. Add fields in the visual designer.");
      router.push(`/admin/certificates/${payload.template.id}`);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Failed to create template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card padding={6} className="lg:col-span-4">
        <VStack gap={4}>
          <Text weight="bold" className="text-xl">Template setup</Text>
          <TextInput htmlName="name" label="Template name" value={name} onChange={setName} placeholder="Workshop completion" isRequired />
          <Selector
            htmlName="event"
            label="Link to event (optional)"
            options={[{ value: "none", label: "No event" }, ...events.map((event) => ({ value: event.id, label: event.title }))]}
            value={eventId}
            onChange={setEventId}
          />
          <div className="space-y-2">
            <Text weight="medium" className="text-sm">Base PDF</Text>
            <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted/50">
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : "Upload PDF"}
              <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} disabled={uploading || saving} />
            </label>
          </div>
          <Button variant="primary" label={saving ? "Creating…" : "Create and open designer"} onClick={handleSave} isDisabled={saving || uploading || !name.trim() || !backgroundUrl} />
        </VStack>
      </Card>
      <Card padding={6} className="lg:col-span-8">
        <VStack gap={3}>
          <Text weight="bold" className="text-xl">Visual designer</Text>
          <Text type="supporting">After creating the template, the full PDF designer opens automatically. Add recipient, event, date, certificate ID, and verification QR fields there.</Text>
          <div className="flex min-h-80 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center">
            <Text type="supporting">{backgroundUrl ? "PDF uploaded and ready" : "Upload a landscape certificate PDF to continue"}</Text>
          </div>
        </VStack>
      </Card>
    </div>
  );
}
