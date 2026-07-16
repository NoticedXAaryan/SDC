"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useFieldArray, useForm } from "react-hook-form";
import { Trash, Plus, GripVertical, Settings2, Save, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type FormTemplate = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "closed" | "archived";
  settings: {
    allowExternal: boolean;
    requireLogin: boolean;
    allowMultiple: boolean;
    autoFillProfile: boolean;
    quotaPerUser: number;
    quotaPerForm: number;
    collegeDomainOnly: boolean;
  };
  fields: any[];
};

export default function FormBuilderClient({ initialTemplates }: { initialTemplates: FormTemplate[] }) {
  const [templates, setTemplates] = useState<FormTemplate[]>(initialTemplates);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      settings: {
        allowExternal: false,
        requireLogin: true,
        allowMultiple: false,
        autoFillProfile: true,
        quotaPerUser: 1,
        quotaPerForm: 1000,
        collegeDomainOnly: true,
      },
      fields: [] as any[]
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "fields"
  });

  const onSubmit = async (data: any) => {
    try {
      const isEditing = editingIndex !== null;
      const url = isEditing ? `/api/admin/forms/${templates[editingIndex].id}` : "/api/admin/forms";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      
      if (isEditing) {
        const newTemplates = [...templates];
        newTemplates[editingIndex] = saved;
        setTemplates(newTemplates);
      } else {
        setTemplates([saved, ...templates]);
      }
      
      toast.success("Form saved successfully");
      setEditingIndex(null);
      reset({ title: "", description: "", status: "draft", settings: { allowExternal: false, requireLogin: true, allowMultiple: false, autoFillProfile: true, quotaPerUser: 1, quotaPerForm: 1000, collegeDomainOnly: true }, fields: [] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save form");
    }
  };

  const editTemplate = (index: number) => {
    setEditingIndex(index);
    const t = templates[index];
    reset({
      title: t.title,
      description: t.description || "",
      status: t.status,
      settings: t.settings,
      fields: t.fields.map(f => ({
        ...f,
        options: f.options ? f.options.join(", ") : ""
      }))
    });
  };

  const settingsWatch = watch("settings");

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Existing Forms</CardTitle>
            <CardDescription>Manage and edit your form templates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map((t, idx) => (
              <div key={t.id} className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors flex justify-between items-start cursor-pointer" onClick={() => editTemplate(idx)}>
                <div>
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] mr-2 ${t.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-secondary text-secondary-foreground'}`}>
                      {t.status}
                    </span>
                    {t.fields.length} questions
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">No forms created yet.</div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => { setEditingIndex(null); reset({ title: "", description: "", status: "draft", settings: { allowExternal: false, requireLogin: true, allowMultiple: false, autoFillProfile: true, quotaPerUser: 1, quotaPerForm: 1000, collegeDomainOnly: true }, fields: [] }); }}>
              <Plus className="w-4 h-4 mr-2" /> Create New Form
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="md:col-span-8">
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{editingIndex !== null ? "Edit Form" : "Create Form"}</CardTitle>
                <CardDescription>Configure your form settings and questions.</CardDescription>
              </div>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" /> Save Form
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-6">
                <div className="grid gap-2">
                  <Label>Form Title</Label>
                  <Input {...register("title")} placeholder="e.g. 2026 Recruitment App" required />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input {...register("description")} placeholder="Brief description of this form..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <select {...register("status")} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-b pb-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Settings2 className="w-5 h-5" /> Settings
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Login</Label>
                      <p className="text-xs text-muted-foreground">User must be signed in</p>
                    </div>
                    <Switch 
                      checked={settingsWatch.requireLogin} 
                      onCheckedChange={(c: any) => setValue("settings.requireLogin", c)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow External</Label>
                      <p className="text-xs text-muted-foreground">Allow non-college users</p>
                    </div>
                    <Switch 
                      checked={settingsWatch.allowExternal} 
                      onCheckedChange={(c: any) => setValue("settings.allowExternal", c)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-fill Profile</Label>
                      <p className="text-xs text-muted-foreground">Skip irrelevant questions (name, email)</p>
                    </div>
                    <Switch 
                      checked={settingsWatch.autoFillProfile} 
                      onCheckedChange={(c: any) => setValue("settings.autoFillProfile", c)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Multiple</Label>
                      <p className="text-xs text-muted-foreground">User can submit multiple times</p>
                    </div>
                    <Switch 
                      checked={settingsWatch.allowMultiple} 
                      onCheckedChange={(c: any) => setValue("settings.allowMultiple", c)} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Quota Per User</Label>
                    <Input type="number" {...register("settings.quotaPerUser", { valueAsNumber: true })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Submissions (Form Quota)</Label>
                    <Input type="number" {...register("settings.quotaPerForm", { valueAsNumber: true })} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="w-5 h-5" /> Fields
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => append({ id: crypto.randomUUID(), type: "short_text", label: "", required: false })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Field
                  </Button>
                </div>

                {fields.map((field, index) => {
                  const typeWatch = watch(`fields.${index}.type`);
                  return (
                    <Card key={field.id} className="relative bg-muted/20">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 grid gap-2">
                            <Label>Question Label</Label>
                            <Input {...register(`fields.${index}.label`)} placeholder="e.g. Why do you want to join?" required />
                          </div>
                          <div className="w-1/3 grid gap-2">
                            <Label>Field Type</Label>
                            <select {...register(`fields.${index}.type`)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                              <option value="short_text">Short Text</option>
                              <option value="long_text">Paragraph</option>
                              <option value="email">Email</option>
                              <option value="number">Number</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="checkbox">Multiple Choice (Checkbox)</option>
                              <option value="file">File Upload</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" {...register(`fields.${index}.required`)} /> Required
                            </label>
                            
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Auto-fill Key (optional)</Label>
                              <Input {...register(`fields.${index}.autoFillKey`)} placeholder="e.g. name, email, year" className="h-7 text-xs w-32" />
                            </div>
                          </div>

                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>

                        {(typeWatch === "dropdown" || typeWatch === "checkbox") && (
                          <div className="grid gap-2 border-t pt-4 mt-2">
                            <Label>Options</Label>
                            <Input 
                              placeholder="Comma separated options (e.g. Option 1, Option 2)" 
                              {...register(`fields.${index}.options`)}
                            />
                            <p className="text-[10px] text-muted-foreground">Separate options with commas. Upon saving they will be parsed.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                {fields.length === 0 && (
                  <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    No fields added yet. Click 'Add Field' to start building your form.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
