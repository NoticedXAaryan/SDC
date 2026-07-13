"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { recruitmentFormSchema } from "@/lib/constants/recruitment-schema";



export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<any>({
    defaultValues: {},
    mode: "onChange",
  });

  const steps = recruitmentFormSchema;

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("sdc_application_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        form.reset(parsed);
      } catch (e) {
        console.error("Failed to parse draft");
      }
    }
  }, [form]);

  // Save draft to localStorage on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("sdc_application_draft", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const nextStep = async () => {
    const currentStepData = steps[currentStep];
    const fieldsToValidate = currentStepData.fields.map(f => f.id);

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      // Save draft to backend when moving forward
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: form.getValues(), status: "draft", applicationCycle: "2026-odd-sem" }),
        });
      } catch (e) {
        // non-blocking
      }
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        answers: data,
        status: "applied",
        applicationCycle: "2026-odd-sem",
        // Map specific fields if they exist in the dynamic form
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
        resumeUrl: data.resumeUrl,
        skills: data.skills ? (typeof data.skills === "string" ? data.skills.split(",").map((s: string) => s.trim()) : data.skills) : [],
        teamPreference: data.teamPreference,
        whyJoin: data.whyJoin,
        priorExperience: data.priorExperience,
        availability: data.availability,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit application");
      }

      localStorage.removeItem("sdc_application_draft");
      toast.success("Application submitted successfully!");
      router.push("/recruitment/success");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Join SDC</CardTitle>
          <CardDescription>Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              
              {steps[currentStep].fields.map((field) => (
                <FormField key={field.id} control={form.control} name={field.id} render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                      {field.type === "textarea" ? (
                        <Textarea placeholder={field.placeholder} {...formField} value={formField.value || ""} className="min-h-[100px]" />
                      ) : field.type === "select" ? (
                        <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                          <SelectTrigger><SelectValue placeholder={field.placeholder || "Select an option"} /></SelectTrigger>
                          <SelectContent>
                            {field.options?.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input type={field.type} placeholder={field.placeholder} {...formField} value={formField.value || ""} />
                      )}
                    </FormControl>
                    {field.description && <p className="text-[0.8rem] text-muted-foreground">{field.description}</p>}
                    <FormMessage />
                  </FormItem>
                )} />
              ))}

            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                Previous
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>Next</Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
