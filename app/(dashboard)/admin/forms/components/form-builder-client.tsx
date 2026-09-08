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
import {
  builderValuesToPayload,
  DEFAULT_FORM_VALUES,
  templateToBuilderValues,
  validateBuilderValues,
  type FormBuilderValues,
  type FormField,
  type FormTemplate,
} from "./form-builder-contract";

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

  const { control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FormBuilderValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields"
  });

  const onSubmit = async (data: FormBuilderValues) => {
    const validationError = validateBuilderValues(data);
    if (validationError) {
      error(validationError);
      return;
    }

    try {
      const isEditing = editingIndex !== null;
      const url = isEditing ? `/api/forms/${templates[editingIndex].id}` : "/api/forms";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(builderValuesToPayload(data))
      });

      if (!res.ok) {
        const responseBody = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(responseBody?.error || `Failed to save form (${res.status})`);
      }
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
      reset(DEFAULT_FORM_VALUES);
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Failed to save form");
    }
  };

  const editTemplate = (index: number) => {
    setEditingIndex(index);
    reset(templateToBuilderValues(templates[index]));
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
                <button
                  type="button"
                  key={t.id} 
                  className={`w-full p-3 text-left border rounded-xl bg-card hover:bg-accent/50 transition-colors flex justify-between items-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${editingIndex === idx ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
                  onClick={() => editTemplate(idx)}
                  aria-pressed={editingIndex === idx}
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
                </button>
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
                reset(DEFAULT_FORM_VALUES);
              }} 
            />
          </VStack>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card padding={6}>
            <VStack gap={6}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              </div>
              
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
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                  <HStack justify="between" align="center">
                    <VStack gap={0}>
                      <Text weight="medium" className="text-sm">College Domain Only</Text>
                      <Text type="supporting" className="text-xs">Restrict responses to Parul University accounts</Text>
                    </VStack>
                    <Switch
                      label="College Domain Only"
                      value={settingsWatch.collegeDomainOnly}
                      onChange={(c) => setValue("settings.collegeDomainOnly", c, { shouldValidate: true })}
                    />
                  </HStack>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
                  <TextInput
                    htmlName="quotaPerUser"
                    label="Quota Per User"
                    type="text"
                    value={settingsWatch.quotaPerUser?.toString() || "1"}
                    onChange={(val) => setValue("settings.quotaPerUser", Number.parseInt(val, 10) || 1, { shouldValidate: true })}
                  />
                  <TextInput
                    htmlName="quotaPerForm"
                    label="Max Submissions (Form Quota)"
                    type="text"
                    value={settingsWatch.quotaPerForm?.toString() || "1000"}
                    onChange={(val) => setValue("settings.quotaPerForm", Number.parseInt(val, 10) || 1, { shouldValidate: true })}
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
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                              <TextInput
                                htmlName={`fields.${index}.label`}
                                label="Question Label"
                                value={watch(`fields.${index}.label`)}
                                onChange={(val) => setValue(`fields.${index}.label`, val, { shouldValidate: true })}
                                placeholder="e.g. Why do you want to join?"
                                isRequired
                              />
                            </div>
                            <div>
                              <Selector
                                htmlName={`fields.${index}.type`}
                                label="Field Type"
                                options={FIELD_TYPE_OPTIONS}
                                value={typeWatch}
                                onChange={(val) => setValue(`fields.${index}.type`, val as FormField["type"], { shouldValidate: true })}
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                            </div>

                            <button type="button" onClick={() => remove(index)} aria-label={`Remove field ${index + 1}`} className="inline-flex min-h-11 min-w-11 items-center justify-center self-end rounded-md text-red-500 hover:bg-red-500/10 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:self-auto">
                              <Trash aria-hidden="true" className="w-4 h-4" />
                            </button>
                          </div>

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
