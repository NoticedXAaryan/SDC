"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Badge } from "@astryxdesign/core/Badge";
import { useToast } from "@/components/astryx/toast-provider";
import { useFieldArray, useForm } from "react-hook-form";
import { Trash, Plus, Settings2, Save, FileText } from "lucide-react";

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

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" }
];

const FIELD_TYPE_OPTIONS = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Multiple Choice (Checkbox)" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date" }
];

export default function FormBuilderClient({ initialTemplates }: { initialTemplates: FormTemplate[] }) {
  const [templates, setTemplates] = useState<FormTemplate[]>(initialTemplates);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { success, error } = useToast();

  const { register, control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
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
      
      success("Form saved successfully");
      setEditingIndex(null);
      reset({ title: "", description: "", status: "draft", settings: { allowExternal: false, requireLogin: true, allowMultiple: false, autoFillProfile: true, quotaPerUser: 1, quotaPerForm: 1000, collegeDomainOnly: true }, fields: [] });
    } catch (e: any) {
      error(e.message || "Failed to save form");
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

  const formValues = watch();
  const settingsWatch = formValues.settings;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Text weight="bold" className="text-xl">Existing Forms</Text>
              <Text type="supporting" className="text-sm">Manage and edit your form templates.</Text>
            </VStack>
            
            <VStack gap={3}>
              {templates.map((t, idx) => (
                <div 
                  key={t.id} 
                  className={`p-3 border rounded-xl bg-card hover:bg-accent/50 transition-colors flex justify-between items-start cursor-pointer ${editingIndex === idx ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`} 
                  onClick={() => editTemplate(idx)}
                >
                  <VStack gap={1}>
                    <Text weight="medium" className="text-sm">{t.title}</Text>
                    <HStack gap={2} align="center" className="mt-1">
                      <Badge 
                        variant={t.status === 'published' ? 'success' : 'neutral'}
                        label={t.status}
                      />
                      <Text type="supporting" className="text-xs">{t.fields.length} questions</Text>
                    </HStack>
                  </VStack>
                </div>
              ))}
              {templates.length === 0 && (
                <Text type="supporting" className="text-sm text-center py-4">No forms created yet.</Text>
              )}
            </VStack>
            
            <Button 
              className="w-full justify-center" 
              variant="ghost" 
              label="Create New Form"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => { 
                setEditingIndex(null); 
                reset({ title: "", description: "", status: "draft", settings: { allowExternal: false, requireLogin: true, allowMultiple: false, autoFillProfile: true, quotaPerUser: 1, quotaPerForm: 1000, collegeDomainOnly: true }, fields: [] }); 
              }} 
            />
          </VStack>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <form onSubmit={handleSubmit(onSubmit as any)}>
          <Card padding={6}>
            <VStack gap={6}>
              <HStack justify="between" align="center">
                <VStack gap={1}>
                  <Text weight="bold" className="text-xl">{editingIndex !== null ? "Edit Form" : "Create Form"}</Text>
                  <Text type="supporting" className="text-sm">Configure your form settings and questions.</Text>
                </VStack>
                <Button 
                  type="submit" 
                  variant="primary" 
                  label="Save Form"
                  icon={<Save className="w-4 h-4" />}
                  isDisabled={isSubmitting}
                />
              </HStack>
              
              <div className="space-y-4 border-b border-border pb-6">
                <FormLayout>
                  <TextInput
                    htmlName="title"
                    label="Form Title"
                    value={formValues.title}
                    onChange={(val) => setValue("title", val, { shouldValidate: true })}
                    placeholder="e.g. 2026 Recruitment App"
                    isRequired
                  />
                  <TextInput
                    htmlName="description"
                    label="Description"
                    value={formValues.description || ""}
                    onChange={(val) => setValue("description", val, { shouldValidate: true })}
                    placeholder="Brief description of this form..."
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Selector
                      htmlName="status"
                      label="Status"
                      options={STATUS_OPTIONS}
                      value={formValues.status}
                      onChange={(val) => setValue("status", val as any, { shouldValidate: true })}
                    />
                  </div>
                </FormLayout>
              </div>

              <div className="space-y-6 border-b border-border pb-6">
                <HStack gap={2} align="center" className="text-lg font-semibold">
                  <Settings2 className="w-5 h-5" /> 
                  <Text weight="semibold">Settings</Text>
                </HStack>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <HStack justify="between" align="center">
                    <VStack gap={0}>
                      <Text weight="medium" className="text-sm">Require Login</Text>
                      <Text type="supporting" className="text-xs">User must be signed in</Text>
                    </VStack>
                    <Switch 
                      label="Require Login"
                      value={settingsWatch.requireLogin} 
                      onChange={(c) => setValue("settings.requireLogin", c, { shouldValidate: true })} 
                    />
                  </HStack>

                  <HStack justify="between" align="center">
                    <VStack gap={0}>
                      <Text weight="medium" className="text-sm">Allow External</Text>
                      <Text type="supporting" className="text-xs">Allow non-college users</Text>
                    </VStack>
                    <Switch 
                      label="Allow External"
                      value={settingsWatch.allowExternal} 
                      onChange={(c) => setValue("settings.allowExternal", c, { shouldValidate: true })} 
                    />
                  </HStack>

                  <HStack justify="between" align="center">
                    <VStack gap={0}>
                      <Text weight="medium" className="text-sm">Auto-fill Profile</Text>
                      <Text type="supporting" className="text-xs">Skip irrelevant questions (name, email)</Text>
                    </VStack>
                    <Switch 
                      label="Auto-fill Profile"
                      value={settingsWatch.autoFillProfile} 
                      onChange={(c) => setValue("settings.autoFillProfile", c, { shouldValidate: true })} 
                    />
                  </HStack>

                  <HStack justify="between" align="center">
                    <VStack gap={0}>
                      <Text weight="medium" className="text-sm">Allow Multiple</Text>
                      <Text type="supporting" className="text-xs">User can submit multiple times</Text>
                    </VStack>
                    <Switch 
                      label="Allow Multiple"
                      value={settingsWatch.allowMultiple} 
                      onChange={(c) => setValue("settings.allowMultiple", c, { shouldValidate: true })} 
                    />
                  </HStack>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <TextInput
                    htmlName="quotaPerUser"
                    label="Quota Per User"
                    type="text"
                    value={settingsWatch.quotaPerUser?.toString() || "1"}
                    onChange={(val) => setValue("settings.quotaPerUser", parseInt(val) || 1, { shouldValidate: true })}
                  />
                  <TextInput
                    htmlName="quotaPerForm"
                    label="Max Submissions (Form Quota)"
                    type="text"
                    value={settingsWatch.quotaPerForm?.toString() || "1000"}
                    onChange={(val) => setValue("settings.quotaPerForm", parseInt(val) || 1000, { shouldValidate: true })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <HStack justify="between" align="center">
                  <HStack gap={2} align="center" className="text-lg font-semibold">
                    <FileText className="w-5 h-5" /> 
                    <Text weight="semibold">Fields</Text>
                  </HStack>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    label="Add Field"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => append({ id: crypto.randomUUID(), type: "short_text", label: "", required: false })}
                  />
                </HStack>

                <VStack gap={4}>
                  {fields.map((field, index) => {
                    const typeWatch = watch(`fields.${index}.type`);
                    return (
                      <Card key={field.id} padding={4} className="bg-muted/20">
                        <VStack gap={4}>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <TextInput
                                htmlName={`fields.${index}.label`}
                                label="Question Label"
                                value={watch(`fields.${index}.label`)}
                                onChange={(val) => setValue(`fields.${index}.label`, val, { shouldValidate: true })}
                                placeholder="e.g. Why do you want to join?"
                                isRequired
                              />
                            </div>
                            <div className="w-1/3">
                              <Selector
                                htmlName={`fields.${index}.type`}
                                label="Field Type"
                                options={FIELD_TYPE_OPTIONS}
                                value={typeWatch}
                                onChange={(val) => setValue(`fields.${index}.type`, val, { shouldValidate: true })}
                              />
                            </div>
                          </div>
                          
                          <HStack justify="between" align="center" className="pt-2">
                            <HStack gap={4}>
                              <HStack gap={2} align="center">
                                <Switch 
                                  label="Required"
                                  value={watch(`fields.${index}.required`)} 
                                  onChange={(val) => setValue(`fields.${index}.required`, val, { shouldValidate: true })}
                                />
                                <Text weight="medium" className="text-sm">Required</Text>
                              </HStack>
                              
                              <HStack gap={2} align="center">
                                <Text type="supporting" className="text-xs">Auto-fill Key (optional)</Text>
                                <div className="w-32">
                                  <TextInput
                                    htmlName={`fields.${index}.autoFillKey`}
                                    label="Auto-fill Key"
                                    value={watch(`fields.${index}.autoFillKey`) || ""}
                                    onChange={(val) => setValue(`fields.${index}.autoFillKey`, val, { shouldValidate: true })}
                                    placeholder="e.g. name, email"
                                  />
                                </div>
                              </HStack>
                            </HStack>

                            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2">
                              <Trash className="w-4 h-4" />
                            </button>
                          </HStack>

                          {(typeWatch === "dropdown" || typeWatch === "checkbox") && (
                            <div className="border-t border-border pt-4 mt-2">
                              <TextInput 
                                htmlName={`fields.${index}.options`}
                                label="Options"
                                placeholder="Comma separated options (e.g. Option 1, Option 2)" 
                                value={watch(`fields.${index}.options`) || ""}
                                onChange={(val) => setValue(`fields.${index}.options`, val, { shouldValidate: true })}
                              />
                              <Text type="supporting" className="text-[10px] mt-1">Separate options with commas. Upon saving they will be parsed.</Text>
                            </div>
                          )}
                        </VStack>
                      </Card>
                    );
                  })}
                </VStack>
                
                {fields.length === 0 && (
                  <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">
                    <Text type="supporting">No fields added yet. Click 'Add Field' to start building your form.</Text>
                  </div>
                )}
              </div>
            </VStack>
          </Card>
        </form>
      </div>
    </div>
  );
}
