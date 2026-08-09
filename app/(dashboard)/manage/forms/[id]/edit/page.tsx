"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Card } from "@astryxdesign/core/Card";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Plus, Trash, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/astryx/toast-provider";
import { suggestAutoFillKey } from "@/lib/forms/autoFill";
import { PageHeader } from "@/components/app/page-header";
import { AdvancedFormBuilder } from "@/components/forms/advanced-form-builder";

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then(r => r.json())
      .then(d => { setForm(d); setLoading(false); })
      .catch(() => error("Error loading form"));
  }, [id, error]);

  const saveForm = async () => {
    const res = await fetch(`/api/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      success("Form saved");
      router.push("/manage/forms");
    } else {
      error("Failed to save");
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
        info(`Auto-fill suggested for ${value}`);
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
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <PageHeader 
        title="Edit Form" 
        description="Design your custom form"
        primaryAction={
          <Button onClick={saveForm} icon={<Save className="h-4 w-4" />} label="Save Form" variant="primary" />
        }
      />
      <AdvancedFormBuilder form={form} setForm={setForm} />
    </div>
  );
}
