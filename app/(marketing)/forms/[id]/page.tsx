"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { getAutoFillValue } from "@/lib/forms/autoFill";
import { useRouter } from "next/navigation";

export default function FillFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [form, setForm] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          toast.error(d.error);
        } else {
          setForm(d);
          // initialize auto-fills
          if (session?.user && d.settings?.autoFillProfile) {
            const initialAnswers: Record<string, any> = {};
            d.fields.forEach((f: any) => {
              if (f.autoFillKey) {
                const val = getAutoFillValue(session.user, f.autoFillKey);
                if (val) initialAnswers[f.id] = val;
              }
            });
            setAnswers(initialAnswers);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error loading form");
        setLoading(false);
      });
  }, [id, session]);

  if (isPending || loading) return <div className="text-center py-20">Loading form...</div>;

  if (!form) return <div className="text-center py-20 text-red-500">Form not found or unavailable</div>;

  if (form.status !== "published") return <div className="text-center py-20">This form is currently closed.</div>;

  // External / Login checks handled mostly by API but good to block early
  if (!form.settings.allowExternal && !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-xl font-bold">College Login Required</h2>
        <p className="text-muted-foreground">This form requires you to log in with your college account.</p>
        <Button onClick={() => router.push(`/login?callbackUrl=/forms/${id}`)}>Log In</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // validate required
    const missing = form.fields.find((f: any) => f.required && !answers[f.id]);
    if (missing) {
      toast.error(`"${missing.label}" is required`);
      setSubmitting(false);
      return;
    }

    const res = await fetch(`/api/forms/${id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers })
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("Response submitted successfully!");
      setAnswers({});
      router.push("/dashboard");
    } else {
      toast.error(data.error || "Failed to submit");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{form.title}</CardTitle>
          {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field: any) => {
              const isAutoFilled = session?.user && field.autoFillKey && answers[field.id] === getAutoFillValue(session.user, field.autoFillKey);
              
              return (
                <div key={field.id} className="space-y-2">
                  <Label className="text-base">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  
                  {isAutoFilled ? (
                    <div className="space-y-1">
                      <Input value={answers[field.id] || ""} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Auto-filled from your profile</p>
                    </div>
                  ) : field.type === "long_text" ? (
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={answers[field.id] || ""}
                      onChange={e => setAnswers({...answers, [field.id]: e.target.value})}
                    />
                  ) : field.type === "dropdown" ? (
                    <Select value={answers[field.id] || ""} onValueChange={v => setAnswers({...answers, [field.id]: v})}>
                      <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                      value={answers[field.id] || ""}
                      onChange={e => setAnswers({...answers, [field.id]: e.target.value})}
                    />
                  )}
                </div>
              );
            })}
            
            <Button type="submit" className="w-full mt-8" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Response"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
