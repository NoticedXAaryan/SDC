"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { suggestAutoFillKey } from "@/lib/forms/autoFill";

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then(r => r.json())
      .then(d => { setForm(d); setLoading(false); })
      .catch(() => toast.error("Error loading form"));
  }, [id]);

  const saveForm = async () => {
    const res = await fetch(`/api/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success("Form saved");
      router.push("/manage/forms");
    } else {
      toast.error("Failed to save");
    }
  };

  const addField = () => {
    setForm({
      ...form,
      fields: [...(form.fields || []), { type: "short_text", label: "New Question", required: false }]
    });
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...form.fields];
    newFields[index][key] = value;

    if (key === "label") {
      const suggested = suggestAutoFillKey(value);
      if (suggested && !newFields[index].autoFillKey) {
        newFields[index].autoFillKey = suggested;
        toast.info(`Auto-fill suggested for ${value}`);
      }
    }

    setForm({ ...form, fields: newFields });
  };

  const removeField = (index: number) => {
    setForm({
      ...form,
      fields: form.fields.filter((_: any, i: number) => i !== index)
    });
  };

  if (loading || !form) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Form</h2>
        <Button onClick={saveForm}><Save className="mr-2 h-4 w-4" /> Save Form</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Form Title</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="text-lg font-bold" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {form.fields?.map((field: any, index: number) => (
              <Card key={index} className="relative group">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Question</Label>
                      <Input value={field.label} onChange={e => updateField(index, "label", e.target.value)} />
                    </div>
                    <div className="w-48 space-y-2">
                      <Label>Type</Label>
                      <Select value={field.type} onValueChange={v => updateField(index, "type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short_text">Short Text</SelectItem>
                          <SelectItem value="long_text">Long Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={field.required} onCheckedChange={v => updateField(index, "required", v)} />
                      <Label>Required</Label>
                    </div>
                    <div className="flex-1">
                      <Label className="mr-2">Auto-fill Key (optional)</Label>
                      <Input className="h-8 text-sm" value={field.autoFillKey || ""} onChange={e => updateField(index, "autoFillKey", e.target.value)} placeholder="e.g. user.email" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="text-red-500">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" className="w-full border-dashed" onClick={addField}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label>Allow External Users</Label>
                  <Switch checked={form.settings.allowExternal} onCheckedChange={v => setForm({...form, settings: {...form.settings, allowExternal: v}})} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>College Domain Only</Label>
                  <Switch checked={form.settings.collegeDomainOnly} onCheckedChange={v => setForm({...form, settings: {...form.settings, collegeDomainOnly: v}})} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Allow Multiple Submissions</Label>
                  <Switch checked={form.settings.allowMultiple} onCheckedChange={v => setForm({...form, settings: {...form.settings, allowMultiple: v}})} />
                </div>

                <div className="space-y-2">
                  <Label>Quota per User</Label>
                  <Input type="number" min="1" value={form.settings.quotaPerUser} onChange={e => setForm({...form, settings: {...form.settings, quotaPerUser: parseInt(e.target.value)}})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
