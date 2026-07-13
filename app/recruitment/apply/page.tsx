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
import { applicationSchema, type ApplicationValues } from "@/lib/validations/application";
import { toast } from "sonner";

const steps = [
  { id: "step1", title: "Basic Info" },
  { id: "step2", title: "Professional Links" },
  { id: "step3", title: "Skills & Interests" },
  { id: "step4", title: "Availability" }
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      course: "",
      phone: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
      resumeUrl: "",
      skills: [],
      teamPreference: "",
      whyJoin: "",
      priorExperience: "",
      availability: "",
      status: "draft"
    },
    mode: "onChange",
  });

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
    const fieldsToValidate: any[] = [];
    if (currentStep === 0) fieldsToValidate.push("fullName", "email", "course", "phone");
    if (currentStep === 1) fieldsToValidate.push("linkedinUrl", "githubUrl", "portfolioUrl", "resumeUrl");
    if (currentStep === 2) fieldsToValidate.push("skills", "teamPreference", "whyJoin", "priorExperience");
    if (currentStep === 3) fieldsToValidate.push("availability");

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      // Save draft to backend when moving forward
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form.getValues(), status: "draft", applicationCycle: "2026-odd-sem" }),
        });
      } catch (e) {
        // non-blocking
      }
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: ApplicationValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        status: "applied",
        applicationCycle: "2026-odd-sem"
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
              
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="course" render={({ field }) => (
                    <FormItem><FormLabel>Course & Year</FormLabel><FormControl><Input placeholder="B.Tech CS, 2nd Year" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+1234567890" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                    <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/username" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="githubUrl" render={({ field }) => (
                    <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input placeholder="https://github.com/username" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                    <FormItem><FormLabel>Portfolio URL (Optional)</FormLabel><FormControl><Input placeholder="https://mywebsite.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="resumeUrl" render={({ field }) => (
                    <FormItem><FormLabel>Resume Link (Optional, Google Drive / Dropbox)</FormLabel><FormControl><Input placeholder="https://drive.google.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="teamPreference" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="skills" render={({ field }) => (
                    <FormItem><FormLabel>Skills (comma separated)</FormLabel><FormControl><Input placeholder="React, Node.js, Figma" onChange={(e) => field.onChange(e.target.value.split(',').map(s=>s.trim()))} value={field.value?.join(', ')} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="whyJoin" render={({ field }) => (
                    <FormItem><FormLabel>Why do you want to join SDC?</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="Your motivation..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="priorExperience" render={({ field }) => (
                    <FormItem><FormLabel>Prior Experience / Projects</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="Tell us about what you have built or done before..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="availability" render={({ field }) => (
                    <FormItem><FormLabel>Weekly Time Commitment</FormLabel><FormControl><Input placeholder="e.g. 10 hours/week, mostly evenings" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}

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
