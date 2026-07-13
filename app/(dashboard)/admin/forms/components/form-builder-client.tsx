"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// I will just use standard HTML structure with tailwind for simplicity if components aren't exact, but I know typical shadcn:
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useFieldArray, useForm } from "react-hook-form";
import { Trash, Plus, GripVertical } from "lucide-react";

type FormTemplate = {
  id: string;
  cycleName: string;
  isActive: boolean;
  fields: any[];
};

export default function FormBuilderClient({ initialTemplates }: { initialTemplates: FormTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      cycleName: "",
      isActive: false,
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
      reset({ cycleName: "", isActive: false, fields: [] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save form");
    }
  };

  const editTemplate = (index: number) => {
    setEditingIndex(index);
    reset(templates[index]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Existing Forms</h2>
        {templates.map((t, idx) => (
          <div key={t.id} className="p-4 border rounded-lg bg-card flex justify-between items-center">
            <div>
              <div className="font-medium">{t.cycleName}</div>
              <div className="text-sm text-muted-foreground">{t.fields.length} questions {t.isActive ? "• Active" : ""}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => editTemplate(idx)}>Edit</Button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => { setEditingIndex(null); reset({ cycleName: "", isActive: false, fields: [] }); }}>
          Create New Form
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <h2 className="font-semibold text-lg mb-4">{editingIndex !== null ? "Edit Form" : "New Form"}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Cycle Name</label>
            <Input {...register("cycleName")} placeholder="e.g. 2026-Fall-Recruitment" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("isActive")} id="isActive" />
            <label htmlFor="isActive" className="text-sm">Set as active form</label>
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="font-medium text-sm border-b pb-2">Questions</h3>
            {fields.map((field, index) => {
              const typeWatch = watch(`fields.${index}.type`);
              return (
                <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/50">
                  <div className="flex gap-2">
                    <Input {...register(`fields.${index}.question` as const)} placeholder="Question Text" className="flex-1" required />
                    <select {...register(`fields.${index}.type` as const)} className="border rounded-md px-2 text-sm">
                      <option value="text">Short Answer</option>
                      <option value="textarea">Paragraph</option>
                      <option value="radio">Multiple Choice</option>
                      <option value="checkbox">Checkboxes</option>
                      <option value="file">File Upload</option>
                      <option value="url">Link/URL</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" {...register(`fields.${index}.required` as const)} /> Required
                    </label>
                  </div>

                  {(typeWatch === "radio" || typeWatch === "checkbox") && (
                    <div>
                      <Input 
                        placeholder="Comma separated options" 
                        onChange={(e) => {
                          const opts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          setValue(`fields.${index}.options` as const, opts);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Separate options with commas</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => append({ id: crypto.randomUUID(), type: "text", question: "", required: false })}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
            <Button type="submit">Save Form</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
