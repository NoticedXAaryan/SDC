"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <Card>
      <CardHeader>
        <CardTitle>
          {step === 1 && "Step 1: Basic Details"}
          {step === 2 && "Step 2: Ticketing & Capacity"}
          {step === 3 && "Step 3: Registration Form Builder"}
          {step === 4 && "Step 4: Certificate Settings"}
          {step === 5 && "Step 5: Review & Publish"}
        </CardTitle>
        <CardDescription>
          Progress: {step}/5
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => updateForm("title", e.target.value)} placeholder="Event Title" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={e => updateForm("slug", e.target.value)} placeholder="event-slug" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => updateForm("description", e.target.value)} placeholder="Event description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="datetime-local" value={formData.startsAt} onChange={e => updateForm("startsAt", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="datetime-local" value={formData.endsAt} onChange={e => updateForm("endsAt", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formData.location} onChange={e => updateForm("location", e.target.value)} placeholder="Venue or Meet link" />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input value={formData.coverImage} onChange={e => updateForm("coverImage", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Total Capacity</Label>
              <Input type="number" min="0" value={formData.capacity} onChange={e => updateForm("capacity", parseInt(e.target.value) || 0)} />
              <p className="text-xs text-muted-foreground">Set to 0 for unlimited.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isPaid" checked={formData.isPaid} onCheckedChange={c => updateForm("isPaid", c)} />
              <Label htmlFor="isPaid">This is a paid event</Label>
            </div>
            {formData.isPaid && (
              <div className="space-y-2 border-l-2 pl-4 ml-2">
                <Label>Price (INR)</Label>
                <Input type="number" min="0" value={formData.price} onChange={e => updateForm("price", parseFloat(e.target.value) || 0)} />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Label>Custom Registration Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFormField}>+ Add Field</Button>
            </div>
            {formData.forms.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 border rounded-lg text-sm text-muted-foreground">
                No custom fields added. Default fields (Name, Email, Phone) will be automatically collected.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.forms.map((field, idx) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/10 relative">
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500" 
                      onClick={() => setFormData(prev => ({ ...prev, forms: prev.forms.filter((_, i) => i !== idx) }))}>&times;</Button>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Question Label</Label>
                        <Input value={field.question} onChange={e => {
                          const newForms = [...formData.forms];
                          newForms[idx].question = e.target.value;
                          updateForm("forms", newForms);
                        }} placeholder="e.g. T-Shirt Size" />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={field.type} onValueChange={v => {
                          if (!v) return;
                          const newForms = [...formData.forms];
                          newForms[idx].type = v;
                          updateForm("forms", newForms);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Short Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {field.type === "dropdown" && (
                      <div className="space-y-2">
                        <Label>Options (comma separated)</Label>
                        <Input value={(field.options || []).join(",")} onChange={e => {
                           const newForms = [...formData.forms];
                           newForms[idx].options = e.target.value.split(",");
                           updateForm("forms", newForms);
                        }} placeholder="S, M, L, XL" />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`req-${idx}`} checked={field.required} onCheckedChange={c => {
                         const newForms = [...formData.forms];
                         newForms[idx].required = !!c;
                         updateForm("forms", newForms);
                      }} />
                      <Label htmlFor={`req-${idx}`}>Required field</Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Label>Link Certificate Template</Label>
            <p className="text-sm text-muted-foreground">Select a template to automatically issue certificates upon event completion.</p>
            <Input value={formData.certificateTemplateId} onChange={e => updateForm("certificateTemplateId", e.target.value)} placeholder="Template ID (optional)" />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review & Publish</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border p-4 rounded-lg bg-muted/10">
              <span className="text-muted-foreground">Title:</span> <span className="font-medium">{formData.title}</span>
              <span className="text-muted-foreground">Starts:</span> <span className="font-medium">{formData.startsAt}</span>
              <span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{formData.capacity || "Unlimited"}</span>
              <span className="text-muted-foreground">Price:</span> <span className="font-medium">{formData.isPaid ? `₹${formData.price}` : "Free"}</span>
              <span className="text-muted-foreground">Custom Fields:</span> <span className="font-medium">{formData.forms.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              By clicking publish, this event will be submitted for review. Once approved by an admin, it will go live on the dashboard.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1}>Back</Button>
        {step < 5 ? (
          <Button onClick={handleNext}>Continue</Button>
        ) : (
          <Button onClick={submitEvent} disabled={isSubmitting}>{isSubmitting ? "Publishing..." : "Publish Event"}</Button>
        )}
      </CardFooter>
    </Card>
  );
}
