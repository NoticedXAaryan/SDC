"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isFormFieldVisible } from "@/lib/forms/visibility";

type FormField = {
  id: string;
  type: "short_text" | "long_text" | "email" | "number" | "dropdown" | "checkbox" | "file" | "date" | "rating" | "section_break" | "image";
  label: string;
  required: boolean | null;
  options: unknown;
  order: number;
  visibilityRules?: unknown;
};

type FormSettings = {
  thankYouMessage?: string;
  redirectUrl?: string | null;
  theme?: { accentColor?: string };
};

export function FormResponseClient({
  formId,
  fields,
  settings,
  initialAnswers,
  acceptingResponses,
}: {
  formId: string;
  fields: FormField[];
  settings: FormSettings;
  initialAnswers: Record<string, unknown>;
  acceptingResponses: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const visibleFields = useMemo(
    () => [...fields]
      .sort((left, right) => left.order - right.order)
      .filter((field) => isFormFieldVisible(field, answers)),
    [answers, fields],
  );

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  function toggleChoice(fieldId: string, choice: string, checked: boolean) {
    setAnswers((current) => {
      const selected = Array.isArray(current[fieldId]) ? current[fieldId] as string[] : [];
      return {
        ...current,
        [fieldId]: checked
          ? [...new Set([...selected, choice])]
          : selected.filter((value) => value !== choice),
      };
    });
  }

  async function uploadFile(fieldId: string, file: File) {
    setUploadingFieldId(fieldId);
    try {
      const payload = new FormData();
      payload.set("fieldId", fieldId);
      payload.set("file", file);
      const response = await fetch(`/api/forms/${formId}/upload`, { method: "POST", body: payload });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "File upload failed");
      setAnswer(fieldId, result.url);
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File upload failed");
    } finally {
      setUploadingFieldId(null);
    }
  }

  async function submitResponse(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const visibleAnswers = Object.fromEntries(
        visibleFields
          .filter((field) => Object.prototype.hasOwnProperty.call(answers, field.id))
          .map((field) => [field.id, answers[field.id]]),
      );
      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: visibleAnswers }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "The form could not be submitted");

      setSubmitted(true);
      if (settings.redirectUrl) {
        const destination = new URL(settings.redirectUrl, window.location.origin);
        if (destination.origin === window.location.origin) {
          window.setTimeout(() => router.push(`${destination.pathname}${destination.search}${destination.hash}`), 900);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The form could not be submitted");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center" role="status">
        <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-500" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Response received</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {settings.thankYouMessage || "Thank you for submitting!"}
        </p>
        <Button className="mt-6" variant="outline" asChild><Link href="/forms">Back to Forms</Link></Button>
      </div>
    );
  }

  return (
    <form onSubmit={submitResponse} className="space-y-6">
      {visibleFields.map((field) => {
        const inputId = `form-field-${field.id}`;
        const options = Array.isArray(field.options)
          ? field.options.filter((option): option is string => typeof option === "string")
          : [];

        if (field.type === "section_break") {
          return <h2 key={field.id} className="border-b pb-2 pt-4 text-lg font-semibold">{field.label}</h2>;
        }
        if (field.type === "image") {
          let imageUrl: string | null = null;
          try {
            const candidate = new URL(field.label);
            imageUrl = ["http:", "https:"].includes(candidate.protocol) ? candidate.toString() : null;
          } catch {
            imageUrl = null;
          }
          return imageUrl ? <img key={field.id} src={imageUrl} alt="Form illustration" width={1200} height={600} loading="lazy" className="max-h-80 w-full rounded-xl object-cover" /> : null;
        }

        return (
          <fieldset key={field.id} className="space-y-2">
            <Label htmlFor={inputId}>
              {field.label}{field.required ? <span aria-hidden="true" className="text-destructive"> *</span> : null}
            </Label>

            {field.type === "long_text" ? (
              <Textarea id={inputId} name={field.id} autoComplete="off" required={Boolean(field.required)} value={String(answers[field.id] ?? "")} onChange={(event) => setAnswer(field.id, event.target.value)} />
            ) : field.type === "dropdown" || field.type === "rating" ? (
              <Select name={field.id} value={String(answers[field.id] ?? "")} onValueChange={(value) => setAnswer(field.id, field.type === "rating" ? Number(value) : value)} required={Boolean(field.required)}>
                <SelectTrigger id={inputId} className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {(field.type === "rating" ? ["1", "2", "3", "4", "5"] : options).map((option) => (
                    <SelectItem key={option} value={option}>{field.type === "rating" ? `${option} / 5` : option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "checkbox" ? (
              <div className="space-y-2" id={inputId}>
                {options.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={field.id}
                      checked={Array.isArray(answers[field.id]) && (answers[field.id] as string[]).includes(option)}
                      onChange={(event) => toggleChoice(field.id, option, event.target.checked)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : field.type === "file" ? (
              <div className="space-y-2">
                <Input
                  id={inputId}
                  name={field.id}
                  type="file"
                  required={Boolean(field.required) && !answers[field.id]}
                  accept={options.length > 0 ? options.join(",") : ".pdf,.png,.jpg,.jpeg,.webp"}
                  disabled={uploadingFieldId === field.id}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(field.id, file);
                  }}
                />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {uploadingFieldId === field.id ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Upload className="h-3 w-3" aria-hidden="true" />}
                  {answers[field.id] ? "Upload complete" : "PDF or image, up to 10 MB"}
                </p>
              </div>
            ) : (
              <Input
                id={inputId}
                name={field.id}
                type={field.type === "short_text" ? "text" : field.type}
                autoComplete={field.type === "email" ? "email" : "off"}
                spellCheck={field.type === "email" ? false : undefined}
                required={Boolean(field.required)}
                value={String(answers[field.id] ?? "")}
                onChange={(event) => setAnswer(field.id, field.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)}
              />
            )}
          </fieldset>
        );
      })}

      {!acceptingResponses ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          Preview mode — publish this form before collecting responses.
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={!acceptingResponses || submitting || uploadingFieldId !== null} style={{ backgroundColor: settings.theme?.accentColor }}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {submitting ? "Submitting…" : "Submit response"}
      </Button>
    </form>
  );
}
