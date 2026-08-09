"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Card } from "@astryxdesign/core/Card";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";

import { Plus, Trash, GripVertical, Settings, Eye, Palette, GitBranch } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { suggestAutoFillKey } from "@/lib/forms/autoFill";

const FIELD_TYPES = [
  { label: "Short Text", value: "short_text" },
  { label: "Long Text", value: "long_text" },
  { label: "Email", value: "email" },
  { label: "Number", value: "number" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Checkbox", value: "checkbox" },
  { label: "File Upload", value: "file" },
  { label: "Date", value: "date" },
  { label: "Rating", value: "rating" },
  { label: "Section Break", value: "section_break" },
  { label: "Image Block", value: "image" }
];

function SortableFieldCard({ field, index, updateField, removeField }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id || index.toString() });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group mb-4">
      <Card padding={6} className={isDragging ? "border-primary shadow-lg" : ""}>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-30 hover:opacity-100 p-2" {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5" />
        </div>
        
        <VStack gap={4} className="pl-6">
          <HStack gap={4} justify="between" align="start">
            <div className="flex-1">
              <TextInput 
                label={field.type === "section_break" ? "Section Title" : field.type === "image" ? "Image URL" : "Question / Label"}
                value={field.label} 
                onChange={v => updateField(index, "label", v)} 
                placeholder={field.type === "image" ? "https://..." : "Enter text here"}
              />
            </div>
            <div className="w-48">
              <Selector
                label="Type"
                value={field.type}
                onChange={v => updateField(index, "type", v)}
                options={FIELD_TYPES}
              />
            </div>
          </HStack>
          
          {field.type === "dropdown" && (
            <TextInput 
              label="Options (comma separated)"
              value={field.options?.join(", ") || ""}
              onChange={v => updateField(index, "options", v.split(",").map((s:string) => s.trim()))}
              placeholder="Option 1, Option 2, Option 3"
            />
          )}
          
          {field.type === "file" && (
            <TextInput 
              label="Allowed Extensions (comma separated)"
              value={field.options?.join(", ") || ".pdf, .png, .jpg"}
              onChange={v => updateField(index, "options", v.split(",").map((s:string) => s.trim()))}
            />
          )}

          {field.type !== "section_break" && field.type !== "image" && (
            <HStack gap={6} align="center" className="pt-4 border-t border-border mt-2">
              <Switch 
                label="Required"
                value={field.required} 
                onChange={v => updateField(index, "required", v)} 
              />
              <div className="flex-1">
                <TextInput 
                  label="Auto-fill Key (optional)"
                  value={field.autoFillKey || ""} 
                  onChange={v => updateField(index, "autoFillKey", v)} 
                  placeholder="e.g. user.email" 
                  size="sm"
                />
              </div>
            </HStack>
          )}
        </VStack>
      </Card>
      
      <Button 
        label="Remove Question"
        isIconOnly
        variant="destructive" 
        onClick={() => removeField(index)}
        icon={<Trash className="h-4 w-4" />}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

export function AdvancedFormBuilder({ form, setForm }: { form: any, setForm: any }) {
  const [activeTab, setActiveTab] = useState<"build"|"theme"|"logic"|"preview" | "settings">("build");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = form.fields.findIndex((f: any, i: number) => (f.id || i.toString()) === active.id);
      const newIndex = form.fields.findIndex((f: any, i: number) => (f.id || i.toString()) === over.id);
      
      const newFields = arrayMove(form.fields, oldIndex, newIndex);
      // Update order property
      const orderedFields = newFields.map((f: any, idx: number) => ({ ...f, order: idx }));
      setForm({ ...form, fields: orderedFields });
    }
  };

  const addField = () => {
    setForm({
      ...form,
      fields: [...(form.fields || []), { id: crypto.randomUUID(), type: "short_text", label: "New Question", required: false, order: form.fields?.length || 0 }]
    });
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...form.fields];
    newFields[index][key] = value;

    if (key === "label" && newFields[index].type !== "section_break" && newFields[index].type !== "image") {
      const suggested = suggestAutoFillKey(value);
      if (suggested && !newFields[index].autoFillKey) {
        newFields[index].autoFillKey = suggested;
      }
    }
    setForm({ ...form, fields: newFields });
  };

  const removeField = (index: number) => {
    setForm({ ...form, fields: form.fields.filter((_: any, i: number) => i !== index) });
  };
  
  const updateSettings = (key: string, value: any) => {
    setForm({ ...form, settings: { ...form.settings, [key]: value } });
  };

  const updateTheme = (key: string, value: any) => {
    setForm({ ...form, settings: { ...form.settings, theme: { ...form.settings?.theme, [key]: value } } });
  };

  const addLogicRule = (fieldIndex: number) => {
    const newFields = [...form.fields];
    const rules = newFields[fieldIndex].visibilityRules || { showIf: [] };
    rules.showIf.push({ fieldId: "", operator: "equals", value: "" });
    newFields[fieldIndex].visibilityRules = rules;
    setForm({ ...form, fields: newFields });
  };

  const updateLogicRule = (fieldIndex: number, ruleIndex: number, key: string, value: any) => {
    const newFields = [...form.fields];
    newFields[fieldIndex].visibilityRules.showIf[ruleIndex][key] = value;
    setForm({ ...form, fields: newFields });
  };

  const removeLogicRule = (fieldIndex: number, ruleIndex: number) => {
    const newFields = [...form.fields];
    newFields[fieldIndex].visibilityRules.showIf.splice(ruleIndex, 1);
    if (newFields[fieldIndex].visibilityRules.showIf.length === 0) {
      delete newFields[fieldIndex].visibilityRules;
    }
    setForm({ ...form, fields: newFields });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Simple Tabs */}
        <div className="flex space-x-1 border-b border-border mb-6">
          {[
            { id: "build", label: "Builder", icon: <Settings className="w-4 h-4 mr-2" /> },
            { id: "theme", label: "Theme", icon: <Palette className="w-4 h-4 mr-2" /> },
            { id: "logic", label: "Logic", icon: <GitBranch className="w-4 h-4 mr-2" /> },
            { id: "preview", label: "Preview", icon: <Eye className="w-4 h-4 mr-2" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "build" && (
          <div className="space-y-6">
            <Card padding={6}>
              <VStack gap={4}>
                <TextInput 
                  label="Form Title"
                  value={form.title} 
                  onChange={v => setForm({...form, title: v})} 
                  className="text-lg font-bold" 
                />
                <TextInput 
                  label="Description"
                  value={form.description || ""} 
                  onChange={v => setForm({...form, description: v})} 
                />
              </VStack>
            </Card>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={form.fields?.map((f:any, i:number) => f.id || i.toString()) || []} strategy={verticalListSortingStrategy}>
                {form.fields?.map((field: any, index: number) => (
                  <SortableFieldCard 
                    key={field.id || index.toString()} 
                    field={field} 
                    index={index} 
                    updateField={updateField} 
                    removeField={removeField} 
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            <Button 
              variant="secondary" 
              className="w-full border-dashed py-8 bg-transparent hover:bg-muted/50" 
              onClick={addField}
              icon={<Plus className="h-4 w-4" />}
              label="Add New Block"
            />
          </div>
        )}

        {activeTab === "theme" && (
          <Card padding={6}>
            <VStack gap={6}>
              <Heading level={3}>Theme & Branding</Heading>
              <TextInput 
                label="Accent Color (Hex)"
                value={form.settings?.theme?.accentColor || "#3b82f6"} 
                onChange={v => updateTheme("accentColor", v)}
                placeholder="#3b82f6"
              />
              <Selector
                label="Font Family"
                value={form.settings?.theme?.fontFamily || "Inter"}
                onChange={v => updateTheme("fontFamily", v)}
                options={[{label: "Inter", value: "Inter"}, {label: "Roboto", value: "Roboto"}, {label: "Serif", value: "Georgia"}]}
              />
              <TextInput 
                label="Background Image URL"
                value={form.settings?.theme?.backgroundImage || ""} 
                onChange={v => updateTheme("backgroundImage", v)}
                placeholder="https://..."
              />
              <div className="border-t border-border pt-6 mt-2">
                <Heading level={4} className="mb-4">Submission Flow</Heading>
                <TextInput 
                  label="Custom Thank You Message"
                  value={form.settings?.thankYouMessage || "Thank you for submitting!"} 
                  onChange={v => updateSettings("thankYouMessage", v)}
                />
                <TextInput 
                  label="Redirect URL on Success (optional)"
                  value={form.settings?.redirectUrl || ""} 
                  onChange={v => updateSettings("redirectUrl", v)}
                  placeholder="https://example.com"
                />
              </div>
            </VStack>
          </Card>
        )}

        {activeTab === "logic" && (
          <Card padding={6}>
            <VStack gap={6}>
              <Heading level={3}>Form Logic</Heading>
              <Text type="supporting">Branching logic allows you to hide or show fields based on previous answers.</Text>
              
              <div className="space-y-6">
                {form.fields?.map((field: any, index: number) => {
                  if (index === 0 || field.type === "section_break" || field.type === "image") return null;
                  
                  const priorFields = form.fields.slice(0, index).filter((f:any) => f.type === "dropdown" || f.type === "short_text" || f.type === "checkbox");
                  if (priorFields.length === 0) return null;

                  return (
                    <div key={field.id || index} className="p-4 border border-border rounded-lg bg-muted/10 space-y-4">
                      <HStack justify="between" align="center">
                        <Text weight="medium">Field: {field.label || "Untitled"}</Text>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          icon={<Plus className="w-3 h-3" />}
                          label="Add Rule"
                          onClick={() => addLogicRule(index)}
                        />
                      </HStack>
                      
                      {field.visibilityRules?.showIf?.map((rule: any, ruleIdx: number) => (
                        <HStack gap={4} align="center" key={ruleIdx} className="bg-background p-3 rounded-md border border-border">
                          <Text className="text-sm">Show if</Text>
                          <Selector
                            label="Target Field"
                            isLabelHidden
                            htmlName={`logic-field-${ruleIdx}`}
                            value={rule.fieldId}
                            onChange={v => updateLogicRule(index, ruleIdx, "fieldId", v)}
                            options={priorFields.map((f:any) => ({ label: f.label || "Untitled", value: f.id || "" }))}
                          />
                          <Selector
                            label="Operator"
                            isLabelHidden
                            htmlName={`logic-operator-${ruleIdx}`}
                            value={rule.operator}
                            onChange={v => updateLogicRule(index, ruleIdx, "operator", v)}
                            options={[{label: "Equals", value: "equals"}, {label: "Not Equals", value: "not_equals"}]}
                          />
                          <TextInput
                            label="Value"
                            value={rule.value}
                            onChange={v => updateLogicRule(index, ruleIdx, "value", v)}
                            placeholder="Value..."
                          />
                          <Button 
                            label="Remove Rule"
                            isIconOnly
                            variant="ghost" 
                            icon={<Trash className="w-4 h-4 text-red-500" />}
                            onClick={() => removeLogicRule(index, ruleIdx)}
                          />
                        </HStack>
                      ))}
                    </div>
                  );
                })}
                
                {(!form.fields || form.fields.length < 2) && (
                  <Text className="text-muted-foreground italic">Add more fields to create logic rules.</Text>
                )}
              </div>
            </VStack>
          </Card>
        )}

        {activeTab === "preview" && (
          <Card padding={8} className="bg-muted/5 border-2 border-border shadow-inner min-h-[500px]">
             {/* Live Preview renders the public form component. For now just standard fields */}
             <div className="max-w-xl mx-auto space-y-6 p-6 bg-background rounded-xl border border-border shadow-sm">
               <Heading level={2} style={{ color: form.settings?.theme?.accentColor }}>{form.title}</Heading>
               {form.description && <Text type="supporting">{form.description}</Text>}
               <div className="space-y-6 pt-4">
                 {form.fields?.map((f:any, i:number) => (
                   <div key={i}>
                     {f.type === "section_break" ? (
                       <div className="border-t border-border pt-6 mt-6">
                         <Heading level={4}>{f.label}</Heading>
                       </div>
                     ) : f.type === "image" ? (
                       <div className="w-full h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground border border-border">
                         Image: {f.label}
                       </div>
                     ) : (
                       <div className="space-y-2">
                         <Text weight="medium">{f.label} {f.required && <span className="text-red-500">*</span>}</Text>
                         <div className="h-10 rounded-md border border-input bg-background w-full opacity-50 cursor-not-allowed"></div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
          </Card>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card padding={6}>
          <VStack gap={6}>
            <Selector
              label="Status"
              value={form.status}
              onChange={v => setForm({...form, status: v})}
              options={[
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
                { label: "Closed", value: "closed" }
              ]}
            />
            <div className="border-t border-border pt-6">
              <VStack gap={4}>
                <Heading level={4}>Settings</Heading>
                
                <HStack justify="between" align="center">
                  <Text>Allow External Users</Text>
                  <Switch 
                    label="Allow External Users"
                    isLabelHidden
                    value={form.settings?.allowExternal || false} 
                    onChange={v => updateSettings("allowExternal", v)} 
                  />
                </HStack>
                <HStack justify="between" align="center">
                  <Text>College Domain Only</Text>
                  <Switch 
                    label="College Domain Only"
                    isLabelHidden
                    value={form.settings?.collegeDomainOnly || false} 
                    onChange={v => updateSettings("collegeDomainOnly", v)} 
                  />
                </HStack>
                <HStack justify="between" align="center">
                  <Text>Allow Multiple Entries</Text>
                  <Switch 
                    label="Allow Multiple Entries"
                    isLabelHidden
                    value={form.settings?.allowMultiple || false} 
                    onChange={v => updateSettings("allowMultiple", v)} 
                  />
                </HStack>
                <TextInput 
                  label="Quota per User"
                  value={form.settings?.quotaPerUser?.toString() || "1"} 
                  onChange={v => updateSettings("quotaPerUser", parseInt(v) || 1)} 
                />
              </VStack>
            </div>
          </VStack>
        </Card>
      </div>
    </div>
  );
}
