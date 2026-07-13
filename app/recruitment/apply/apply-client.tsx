"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type FieldDef = {
  id: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "file" | "url";
  question: string;
  options?: string[];
  required: boolean;
};

type FormTemplate = {
  id: string;
  cycleName: string;
  fields: FieldDef[];
};

export default function ApplyClient({ activeForm }: { activeForm: FormTemplate }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<any>({
    defaultValues: {},
    mode: "onChange",
  });

  const fields = activeForm.fields;

  useEffect(() => {
    const savedDraft = localStorage.getItem(`sdc_draft_${activeForm.cycleName}`);
    if (savedDraft) {
      try {
        form.reset(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse draft");
      }
    }
  }, [form, activeForm.cycleName]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(`sdc_draft_${activeForm.cycleName}`, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form, activeForm.cycleName]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: data,
          status: "applied",
          applicationCycle: activeForm.cycleName,
          // Extract specific fields if they exist to match schema
          linkedinUrl: data.linkedinUrl || null,
          githubUrl: data.githubUrl || null,
          portfolioUrl: data.portfolioUrl || null,
          resumeUrl: data.resumeUrl || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit application");
      }

      localStorage.removeItem(`sdc_draft_${activeForm.cycleName}`);
      toast.success("Application submitted successfully!");
      router.push("/recruitment/success");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: form.getValues(),
          status: "draft",
          applicationCycle: activeForm.cycleName,
        }),
      });
      toast.success("Draft saved.");
    } catch (e: any) {
      toast.error("Failed to save draft");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Join SDC - {activeForm.cycleName}</CardTitle>
          <CardDescription>Please fill out all the required fields below.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {fields.map((field) => (
                <FormField key={field.id} control={form.control} name={field.id} render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.question} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                      {field.type === "textarea" ? (
                        <Textarea {...formField} value={formField.value || ""} className="min-h-[100px]" required={field.required} />
                      ) : field.type === "radio" || field.type === "checkbox" ? (
                        <Select onValueChange={formField.onChange} defaultValue={formField.value} required={field.required}>
                          <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                          <SelectContent>
                            {field.options?.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input type={field.type === "url" ? "url" : "text"} {...formField} value={formField.value || ""} required={field.required} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
              <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Application"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
