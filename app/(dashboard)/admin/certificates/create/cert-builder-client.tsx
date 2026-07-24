"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { useToast } from "@/components/astryx/toast-provider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Field = {
  id: string;
  type: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

export function CertificateBuilderClient({ events }: { events: any[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState<string>("none");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const { success, error } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setBackgroundUrl(data.url);
    } catch (err: any) {
      error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addField = (type: string) => {
    setFields([...fields, {
      id: crypto.randomUUID(),
      type,
      x: 50,
      y: 50,
      fontSize: 24,
      color: "#000000"
    }]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    if (!name || !backgroundUrl) {
      error("Name and Background Image are required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/certificates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          eventId: eventId === "none" ? null : eventId,
          backgroundUrl,
          fields
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      success("Template saved successfully");
      router.push("/admin/certificates");
    } catch (err: any) {
      error(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const eventOptions = [
    { value: "none", label: "-- No Event --" },
    ...events.map(ev => ({ value: ev.id, label: ev.title }))
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <Card padding={6}>
          <VStack gap={4}>
            <Text weight="bold" className="text-xl">Template Details</Text>
            
            <TextInput
              htmlName="name"
              label="Template Name"
              value={name}
              onChange={setName}
              placeholder="e.g. Workshop Completion"
              isRequired
            />
            
            <Selector
              htmlName="event"
              label="Link to Event (Optional)"
              options={eventOptions}
              value={eventId}
              onChange={setEventId}
            />

            <div className="space-y-2">
              <Text weight="medium" className="text-sm">Background Image</Text>
              <div className="mt-2">
                <label className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-muted/50 h-10 px-4 py-2 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer w-full'}`}>
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload background"}
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={4}>
            <Text weight="bold" className="text-xl">Dynamic Fields</Text>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" label="+ Name" onClick={() => addField('USER_NAME')} />
              <Button size="sm" variant="ghost" label="+ Date" onClick={() => addField('ISSUE_DATE')} />
              <Button size="sm" variant="ghost" label="+ ID" onClick={() => addField('CERT_ID')} />
              <Button size="sm" variant="ghost" label="+ Event Name" onClick={() => addField('EVENT_NAME')} />
            </div>
            
            {fields.map((f, idx) => (
              <div key={f.id} className="p-3 border border-border rounded-lg space-y-3 bg-muted/30">
                <HStack justify="between" align="center">
                  <Text weight="medium" className="text-sm">{f.type.replace('_', ' ')}</Text>
                  <button onClick={() => removeField(f.id)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                </HStack>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    htmlName={`x-${f.id}`}
                    label="X (%)"
                    type="text"
                    value={f.x.toString()}
                    onChange={(val) => updateField(f.id, { x: Number(val) })}
                  />
                  <TextInput
                    htmlName={`y-${f.id}`}
                    label="Y (%)"
                    type="text"
                    value={f.y.toString()}
                    onChange={(val) => updateField(f.id, { y: Number(val) })}
                  />
                  <TextInput
                    htmlName={`size-${f.id}`}
                    label="Font Size"
                    type="text"
                    value={f.fontSize.toString()}
                    onChange={(val) => updateField(f.id, { fontSize: Number(val) })}
                  />
                  <TextInput
                    htmlName={`color-${f.id}`}
                    label="Color"
                    type="text"
                    value={f.color}
                    onChange={(val) => updateField(f.id, { color: val })}
                  />
                </div>
              </div>
            ))}
          </VStack>
        </Card>
      </div>
      
      <div className="lg:col-span-8 space-y-4">
        <HStack justify="between" align="center">
          <Text weight="bold" className="text-xl">Preview</Text>
          <Button 
            variant="primary" 
            label={isSaving ? "Saving..." : "Save Template"}
            onClick={handleSave} 
            isDisabled={isSaving || !name || !backgroundUrl} 
          />
        </HStack>
        
        <div className="w-full aspect-[1.414/1] bg-muted/20 border-2 border-dashed border-border rounded-lg relative overflow-hidden flex items-center justify-center">
          {backgroundUrl ? (
            <img src={backgroundUrl} alt="Certificate Background" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          ) : (
            <Text type="supporting">Upload a background image (A4 Landscape aspect ratio recommended)</Text>
          )}
          
          {fields.map(f => (
            <div 
              key={f.id}
              className="absolute border border-blue-500 bg-blue-500/10 cursor-move text-center whitespace-nowrap px-2 py-1 transform -translate-x-1/2 -translate-y-1/2 select-none"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                fontSize: `${f.fontSize}px`,
                color: f.color
              }}
            >
              [{f.type}]
            </div>
          ))}
        </div>
        <Text type="supporting" className="text-xs">Tip: In this version, adjust X and Y coordinates manually using the fields panel on the left.</Text>
      </div>
    </div>
  );
}
