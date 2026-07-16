"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      toast.error(err.message || "Failed to upload image");
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
      toast.error("Name and Background Image are required");
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
      toast.success("Template saved successfully");
      router.push("/admin/certificates");
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 space-y-6">
        <Card>
          <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Workshop Completion" required />
            </div>
            
            <div className="space-y-2">
              <Label>Link to Event (Optional)</Label>
              <select value={eventId} onChange={e => setEventId(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="none">-- No Event --</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Background Image</Label>
              <div className="flex items-center gap-4 mt-2">
                <label className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload background"}
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dynamic Fields</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => addField('USER_NAME')}>+ Name</Button>
              <Button size="sm" variant="outline" onClick={() => addField('ISSUE_DATE')}>+ Date</Button>
              <Button size="sm" variant="outline" onClick={() => addField('CERT_ID')}>+ ID</Button>
              <Button size="sm" variant="outline" onClick={() => addField('EVENT_NAME')}>+ Event Name</Button>
            </div>
            
            {fields.map((f, idx) => (
              <div key={f.id} className="p-3 border rounded text-sm space-y-2 bg-muted/30">
                <div className="flex justify-between items-center font-medium">
                  {f.type.replace('_', ' ')}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeField(f.id)}>×</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X (%)</Label>
                    <Input type="number" value={f.x} onChange={e => updateField(f.id, { x: Number(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Y (%)</Label>
                    <Input type="number" value={f.y} onChange={e => updateField(f.id, { y: Number(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <Input type="number" value={f.fontSize} onChange={e => updateField(f.id, { fontSize: Number(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input type="color" value={f.color} onChange={e => updateField(f.id, { color: e.target.value })} className="h-7 p-0 px-1 text-xs w-full" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-8 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Preview</h2>
          <Button onClick={handleSave} disabled={isSaving || !name || !backgroundUrl}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Template
          </Button>
        </div>
        
        <div className="w-full aspect-[1.414/1] bg-muted/20 border-2 border-dashed rounded-lg relative overflow-hidden flex items-center justify-center">
          {backgroundUrl ? (
            <img src={backgroundUrl} alt="Certificate Background" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          ) : (
            <span className="text-muted-foreground">Upload a background image (A4 Landscape aspect ratio recommended)</span>
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
        <p className="text-xs text-muted-foreground">Tip: In this version, adjust X and Y coordinates manually using the fields panel on the left.</p>
      </div>
    </div>
  );
}
