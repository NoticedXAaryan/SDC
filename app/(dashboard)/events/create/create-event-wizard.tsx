"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Card, 
  Button, 
  Heading, 
  Text, 
  HStack, 
  VStack, 
  Badge,
  TextInput,
  TextArea,
  CheckboxInput,
  Selector,
  FormLayout,
  IconButton
} from "@astryxdesign/core";
import { X } from "lucide-react";

export function CreateEventWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "technical",
    description: "",
    coverImage: "",
    startsAt: "",
    endsAt: "",
    location: "",
    capacity: 0,
    isPaid: false,
    price: 0,
    forms: [] as { id: string; type: string; question: string; required: boolean; options?: string[] }[],
    certificateTemplateId: "",
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFormField = () => {
    setFormData(prev => ({
      ...prev,
      forms: [...prev.forms, { id: crypto.randomUUID(), type: "text", question: "", required: false }]
    }));
  };

  const submitEvent = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create event");
      
      toast.success("Event Created", { description: "Your event has been published successfully." });
      router.push("/events");
      router.refresh();
    } catch (e) {
      toast.error("Error", { description: "Failed to create event. Please check inputs." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding={6} className="max-w-3xl mx-auto">
      <VStack gap={6}>
        <VStack gap={1}>
          <HStack justify="between" align="center">
            <Heading level={2} className="font-semibold text-2xl">
              {step === 1 && "Basic Details"}
              {step === 2 && "Ticketing & Capacity"}
              {step === 3 && "Registration Form Builder"}
              {step === 4 && "Certificate Settings"}
              {step === 5 && "Review & Publish"}
            </Heading>
            <Badge variant="blue" label={`Step ${step} of 5`} />
          </HStack>
          <Text type="supporting">
            {step === 1 && "Start by providing the essential information about your event."}
            {step === 2 && "Configure attendee limits and pricing structures."}
            {step === 3 && "Customize the data you collect during registration."}
            {step === 4 && "Link a certificate template for automated issuance."}
            {step === 5 && "Review all details before publishing."}
          </Text>
        </VStack>

        <div className="py-4 border-t border-b border-border min-h-[400px]">
          {step === 1 && (
            <FormLayout>
              <div className="grid grid-cols-2 gap-4">
                <TextInput 
                  label="Title" 
                  htmlName="title"
                  value={formData.title} 
                  onChange={v => updateForm("title", v)} 
                  placeholder="Event Title" 
                />
                <TextInput 
                  label="Slug" 
                  htmlName="slug"
                  value={formData.slug} 
                  onChange={v => updateForm("slug", v)} 
                  placeholder="event-slug" 
                />
              </div>
              <TextArea 
                label="Description" 
                htmlName="description"
                value={formData.description} 
                onChange={v => updateForm("description", v)} 
                placeholder="Event description..." 
              />
              <div className="grid grid-cols-2 gap-4">
                <TextInput 
                  type="text" 
                  label="Start Time" 
                  htmlName="startsAt"
                  value={formData.startsAt} 
                  onChange={v => updateForm("startsAt", v)} 
                  placeholder="YYYY-MM-DDTHH:MM"
                />
                <TextInput 
                  type="text" 
                  label="End Time" 
                  htmlName="endsAt"
                  value={formData.endsAt} 
                  onChange={v => updateForm("endsAt", v)} 
                  placeholder="YYYY-MM-DDTHH:MM"
                />
              </div>
              <TextInput 
                label="Location" 
                htmlName="location"
                value={formData.location} 
                onChange={v => updateForm("location", v)} 
                placeholder="Venue or Meet link" 
              />
              <TextInput 
                label="Cover Image URL" 
                htmlName="coverImage"
                value={formData.coverImage} 
                onChange={v => updateForm("coverImage", v)} 
                placeholder="https://..." 
              />
            </FormLayout>
          )}

          {step === 2 && (
            <FormLayout>
              <TextInput 
                type="text"
                label="Total Capacity" 
                htmlName="capacity"
                value={formData.capacity.toString()} 
                onChange={v => updateForm("capacity", parseInt(v) || 0)} 
                description="Set to 0 for unlimited."
              />
              <CheckboxInput 
                label="This is a paid event" 
                htmlName="isPaid"
                value={formData.isPaid} 
                onChange={v => updateForm("isPaid", v)} 
              />
              {formData.isPaid && (
                <div className="border-l-2 border-blue-500 pl-4 ml-2 mt-4 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-r-md">
                  <TextInput 
                    type="text"
                    label="Price (INR)" 
                    htmlName="price"
                    value={formData.price.toString()} 
                    onChange={v => updateForm("price", parseFloat(v) || 0)} 
                  />
                </div>
              )}
            </FormLayout>
          )}

          {step === 3 && (
            <VStack gap={6}>
              <HStack justify="between" align="center">
                <Text weight="medium">Custom Registration Questions</Text>
                <Button type="button" variant="secondary" size="sm" onClick={addFormField} label="+ Add Field" />
              </HStack>
              {formData.forms.length === 0 ? (
                <div className="text-center p-8 bg-muted/20 border rounded-lg text-sm text-muted-foreground">
                  No custom fields added. Default fields (Name, Email, Phone) will be automatically collected.
                </div>
              ) : (
                <VStack gap={4}>
                  {formData.forms.map((field, idx) => (
                    <Card key={field.id} padding={4} className="relative bg-muted/10 border-muted">
                      <div className="absolute top-2 right-2">
                        <IconButton
                          variant="ghost" 
                          icon={<X className="w-4 h-4 text-red-500" />} 
                          label="Remove field"
                          onClick={() => setFormData(prev => ({ ...prev, forms: prev.forms.filter((_, i) => i !== idx) }))}
                        />
                      </div>
                      <FormLayout>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <TextInput 
                              label="Question Label" 
                              htmlName={`question-${idx}`}
                              value={field.question} 
                              onChange={v => {
                                const newForms = [...formData.forms];
                                newForms[idx].question = v;
                                updateForm("forms", newForms);
                              }} 
                              placeholder="e.g. T-Shirt Size" 
                            />
                          </div>
                          <div>
                            <Selector 
                              label="Type"
                              value={field.type} 
                              onChange={v => {
                                if (!v) return;
                                const newForms = [...formData.forms];
                                newForms[idx].type = v;
                                updateForm("forms", newForms);
                              }}
                              options={[
                                { value: "text", label: "Short Text" },
                                { value: "textarea", label: "Long Text" },
                                { value: "dropdown", label: "Dropdown" },
                              ]}
                            />
                          </div>
                        </div>
                        {field.type === "dropdown" && (
                          <TextInput 
                            label="Options (comma separated)" 
                            htmlName={`options-${idx}`}
                            value={(field.options || []).join(",")} 
                            onChange={v => {
                               const newForms = [...formData.forms];
                               newForms[idx].options = v.split(",");
                               updateForm("forms", newForms);
                            }} 
                            placeholder="S, M, L, XL" 
                          />
                        )}
                        <CheckboxInput 
                          label="Required field" 
                          htmlName={`required-${idx}`}
                          value={field.required} 
                          onChange={v => {
                             const newForms = [...formData.forms];
                             newForms[idx].required = v;
                             updateForm("forms", newForms);
                          }} 
                        />
                      </FormLayout>
                    </Card>
                  ))}
                </VStack>
              )}
            </VStack>
          )}

          {step === 4 && (
            <FormLayout>
              <TextInput 
                label="Link Certificate Template" 
                htmlName="templateId"
                description="Select a template to automatically issue certificates upon event completion."
                value={formData.certificateTemplateId} 
                onChange={v => updateForm("certificateTemplateId", v)} 
                placeholder="Template ID (optional)" 
              />
            </FormLayout>
          )}

          {step === 5 && (
            <VStack gap={4}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border p-6 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Title:</span> <span className="font-medium">{formData.title || "—"}</span>
                <span className="text-muted-foreground">Starts:</span> <span className="font-medium">{formData.startsAt ? (isNaN(new Date(formData.startsAt).getTime()) ? "Invalid Date" : new Date(formData.startsAt).toLocaleString()) : "—"}</span>
                <span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{formData.capacity || "Unlimited"}</span>
                <span className="text-muted-foreground">Price:</span> <span className="font-medium">{formData.isPaid ? `₹${formData.price}` : "Free"}</span>
                <span className="text-muted-foreground">Custom Fields:</span> <span className="font-medium">{formData.forms.length}</span>
              </div>
              <p className="text-sm text-muted-foreground bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 p-4 rounded-md">
                By clicking publish, this event will be submitted for review. Once approved by an admin, it will go live on the dashboard.
              </p>
            </VStack>
          )}
        </div>

        <HStack justify="between" align="center">
          <Button variant="secondary" onClick={handlePrev} isDisabled={step === 1} label="Back" />
          {step < 5 ? (
            <Button onClick={handleNext} label="Continue" />
          ) : (
            <Button onClick={submitEvent} isDisabled={isSubmitting} label={isSubmitting ? "Publishing..." : "Publish Event"} />
          )}
        </HStack>
      </VStack>
    </Card>
  );
}
