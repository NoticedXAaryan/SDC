"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FillFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [form, setForm] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Form not found");
        const data = await res.json();
        setForm(data.form);
        setFields(data.fields);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/forms");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${resolvedParams.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Validation failed");
      }
      
      toast.success("Form submitted successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <Skeleton className="w-full h-[150px] rounded-xl" />
        <Skeleton className="w-full h-[60px] rounded-xl" />
        <Skeleton className="w-full h-[60px] rounded-xl" />
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.sort((a, b) => a.order - b.order).map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === "short_text" && (
                  <Input 
                    required={field.required}
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({...answers, [field.id]: e.target.value})}
                  />
                )}
                
                {field.type === "long_text" && (
                  <Textarea 
                    required={field.required}
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({...answers, [field.id]: e.target.value})}
                  />
                )}
                
                {field.type === "email" && (
                  <Input 
                    type="email"
                    required={field.required}
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({...answers, [field.id]: e.target.value})}
                  />
                )}

                {field.type === "number" && (
                  <Input 
                    type="number"
                    required={field.required}
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({...answers, [field.id]: Number(e.target.value)})}
                  />
                )}
              </div>
            ))}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
