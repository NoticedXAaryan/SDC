"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  type: z.enum(["hackathon", "workshop", "seminar", "social", "competition"]).default("workshop"),
  visibility: z.enum(["public", "private", "unlisted", "members_only", "invite_only"]).default("public"),
  description: z.string().optional(),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  capacity: z.number().min(0),
  isPaid: z.boolean(),
  price: z.number().min(0),
  forms: z.array(z.object({
    id: z.string(),
    type: z.string(),
    question: z.string().min(1, "Question is required"),
    required: z.boolean(),
    options: z.string().optional() // Stored as comma separated in UI
  })),
  certificateTemplateId: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function CreateEventWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, trigger, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      slug: "",
      type: "workshop",
      visibility: "public",
      description: "",
      coverImage: "",
      startsAt: "",
      endsAt: "",
      location: "",
      capacity: 0,
      isPaid: false,
      price: 0,
      forms: [],
      certificateTemplateId: "",
    },
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "forms",
  });

  const watchIsPaid = watch("isPaid");
  const formData = watch();

  const handleNext = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof EventFormValues)[] = [];
    if (step === 1) fieldsToValidate = ["title", "slug", "type", "visibility", "description", "startsAt", "endsAt", "location", "coverImage"];
    if (step === 2) fieldsToValidate = ["capacity", "isPaid", "price"];
    if (step === 3) fieldsToValidate = ["forms"];
    if (step === 4) fieldsToValidate = ["certificateTemplateId"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep(s => Math.min(s + 1, 5));
  };
  
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      // Transform forms string options to array
      const payload = {
        ...data,
        forms: data.forms.map(f => ({
          ...f,
          options: f.options ? f.options.split(",").map(o => o.trim()) : []
        }))
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

        <form className="py-4 border-t border-b border-border min-h-[400px]">
          {step === 1 && (
            <FormLayout>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <TextInput label="Title" {...field} placeholder="Event Title" />
                      {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message}</span>}
                    </div>
                  )}
                />
                <Controller
                  name="slug"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <TextInput label="Slug" {...field} placeholder="event-slug" />
                      {errors.slug && <span className="text-red-500 text-xs mt-1">{errors.slug.message}</span>}
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Selector 
                      label="Event Type" 
                      value={field.value} 
                      onChange={field.onChange}
                      options={[
                        { value: "workshop", label: "Workshop" },
                        { value: "hackathon", label: "Hackathon" },
                        { value: "seminar", label: "Seminar" },
                        { value: "social", label: "Social" },
                        { value: "competition", label: "Competition" },
                      ]}
                    />
                  )}
                />
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <Selector 
                      label="Visibility" 
                      value={field.value} 
                      onChange={field.onChange}
                      options={[
                        { value: "public", label: "Public" },
                        { value: "private", label: "Private" },
                        { value: "unlisted", label: "Unlisted" },
                        { value: "members_only", label: "Members Only" },
                        { value: "invite_only", label: "Invite Only" },
                      ]}
                    />
                  )}
                />
              </div>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea label="Description" {...field} value={field.value || ""} placeholder="Event description..." />
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="startsAt"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <TextInput type={"datetime-local" as any} label="Start Time" {...field} />
                      {errors.startsAt && <span className="text-red-500 text-xs mt-1">{errors.startsAt.message}</span>}
                    </div>
                  )}
                />
                <Controller
                  name="endsAt"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <TextInput type={"datetime-local" as any} label="End Time" {...field} />
                      {errors.endsAt && <span className="text-red-500 text-xs mt-1">{errors.endsAt.message}</span>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextInput label="Location" {...field} value={field.value || ""} placeholder="Venue or Meet link" />
                )}
              />
              <Controller
                name="coverImage"
                control={control}
                render={({ field }) => (
                  <div>
                    <TextInput label="Cover Image URL" {...field} value={field.value || ""} placeholder="https://..." />
                    {errors.coverImage && <span className="text-red-500 text-xs mt-1">{errors.coverImage.message}</span>}
                  </div>
                )}
              />
            </FormLayout>
          )}

          {step === 2 && (
            <FormLayout>
              <Controller
                name="capacity"
                control={control}
                render={({ field }) => (
                  <TextInput 
                    type={"number" as any}
                    label="Total Capacity" 
                    value={field.value.toString()}
                    onChange={v => field.onChange(parseInt(v) || 0)}
                    description="Set to 0 for unlimited."
                  />
                )}
              />
              <Controller
                name="isPaid"
                control={control}
                render={({ field }) => (
                  <CheckboxInput label="This is a paid event" value={field.value} onChange={field.onChange} />
                )}
              />
              {watchIsPaid && (
                <div className="border-l-2 border-blue-500 pl-4 mt-2 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-r-md">
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <TextInput 
                        type={"number" as any}
                        label="Price (INR)" 
                        value={field.value.toString()}
                        onChange={v => field.onChange(parseFloat(v) || 0)}
                      />
                    )}
                  />
                </div>
              )}
            </FormLayout>
          )}

          {step === 3 && (
            <VStack gap={6}>
              <HStack justify="between" align="center">
                <Text weight="medium">Custom Registration Questions</Text>
                <Button type="button" variant="secondary" size="sm" onClick={() => append({ id: crypto.randomUUID(), type: "text", question: "", required: false, options: "" })} label="+ Add Field" />
              </HStack>
              {fields.length === 0 ? (
                <div className="text-center p-8 bg-muted/20 border rounded-lg text-sm text-muted-foreground">
                  No custom fields added. Default fields (Name, Email, Phone) will be automatically collected.
                </div>
              ) : (
                <VStack gap={4}>
                  {fields.map((field, idx) => (
                    <Card key={field.id} padding={4} className="relative bg-muted/10 border-muted">
                      <div className="absolute top-2 right-2">
                        <IconButton
                          variant="ghost" 
                          icon={<X className="w-4 h-4 text-red-500" />} 
                          label="Remove field"
                          onClick={() => remove(idx)}
                        />
                      </div>
                      <FormLayout>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <Controller
                              name={`forms.${idx}.question`}
                              control={control}
                              render={({ field: f }) => (
                                <div>
                                  <TextInput label="Question Label" {...f} placeholder="e.g. T-Shirt Size" />
                                  {errors.forms?.[idx]?.question && <span className="text-red-500 text-xs mt-1">{errors.forms[idx].question.message}</span>}
                                </div>
                              )}
                            />
                          </div>
                          <div>
                            <Controller
                              name={`forms.${idx}.type`}
                              control={control}
                              render={({ field: f }) => (
                                <Selector 
                                  label="Type"
                                  value={f.value} 
                                  onChange={f.onChange}
                                  options={[
                                    { value: "text", label: "Short Text" },
                                    { value: "textarea", label: "Long Text" },
                                    { value: "dropdown", label: "Dropdown" },
                                  ]}
                                />
                              )}
                            />
                          </div>
                        </div>
                        {formData.forms[idx]?.type === "dropdown" && (
                          <Controller
                            name={`forms.${idx}.options`}
                            control={control}
                            render={({ field: f }) => (
                              <TextInput label="Options (comma separated)" {...f} value={f.value || ""} placeholder="Option 1, Option 2" />
                            )}
                          />
                        )}
                        <Controller
                          name={`forms.${idx}.required`}
                          control={control}
                          render={({ field: f }) => (
                            <CheckboxInput label="Required field" value={f.value} onChange={f.onChange} />
                          )}
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
              <Controller
                name="certificateTemplateId"
                control={control}
                render={({ field }) => (
                  <TextInput label="Link Certificate Template" {...field} value={field.value || ""} description="Select a template to automatically issue certificates." placeholder="Template ID (optional)" />
                )}
              />
            </FormLayout>
          )}

          {step === 5 && (
            <VStack gap={4}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border p-6 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Title:</span> <span className="font-medium">{formData.title || "—"}</span>
                <span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{formData.type}</span>
                <span className="text-muted-foreground">Visibility:</span> <span className="font-medium capitalize">{formData.visibility.replace("_", " ")}</span>
                <span className="text-muted-foreground">Starts:</span> <span className="font-medium">{formData.startsAt ? new Date(formData.startsAt).toLocaleString() : "—"}</span>
                <span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{formData.capacity || "Unlimited"}</span>
                <span className="text-muted-foreground">Price:</span> <span className="font-medium">{formData.isPaid ? `₹${formData.price}` : "Free"}</span>
                <span className="text-muted-foreground">Custom Fields:</span> <span className="font-medium">{formData.forms?.length || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 p-4 rounded-md">
                By clicking publish, this event will be submitted for review. Once approved by an admin, it will go live on the dashboard.
              </p>
            </VStack>
          )}
        </form>

        <HStack justify="between" align="center">
          <Button variant="secondary" onClick={handlePrev} isDisabled={step === 1} label="Back" />
          {step < 5 ? (
            <Button onClick={handleNext} label="Continue" />
          ) : (
            <Button onClick={handleSubmit(onSubmit)} isDisabled={isSubmitting} label={isSubmitting ? "Publishing..." : "Publish Event"} />
          )}
        </HStack>
      </VStack>
    </Card>
  );
}
