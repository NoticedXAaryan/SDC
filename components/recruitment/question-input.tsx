"use client";
import { useState } from "react";
import { type RecruitmentField, resumeAnswerSchema } from "@/lib/recruitment-form";

export function QuestionInput({ field, answer, cycle, disabled, onChange, onBusy, onError, invalid }: {
  field: RecruitmentField; answer: unknown; cycle: string; disabled: boolean; invalid: boolean;
  onChange: (value: unknown) => void; onBusy: (busy: boolean) => void; onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const id = `application-${field.id}`;
  const value = typeof answer === "string" ? answer : "";
  const shared = { id, disabled, "aria-labelledby": "question-title", "aria-describedby": invalid ? "question-help application-error" : "question-help", "aria-invalid": invalid, required: !!field.required };
  const options = (field.options || []).map(option => typeof option === "string" ? { label: option, value: option } : option);
  if (field.type === "file") {
    const resume = resumeAnswerSchema.safeParse(answer);
    return <div className="club-resume-upload">
      {resume.success && <div className="club-resume-receipt"><span>Attached: <strong>{resume.data.name}</strong> · {Math.ceil(resume.data.size / 1024)} KB</span><a className="club-text-link" href={`/api/applications/resume/${resume.data.id}`}>Download résumé</a><button type="button" className="club-button club-button-secondary" disabled={disabled} onClick={() => onChange(null)}>Remove from application</button></div>}
      <input {...shared} type="file" accept="application/pdf,.pdf" required={false} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file) return;
        if (!file.size || file.size > 2 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf")) { onError("Choose a PDF smaller than 2 MB."); return; }
        setUploading(true); onBusy(true); onError("");
        try {
          const data = new FormData(); data.set("file", file); data.set("cycle", cycle);
          const response = await fetch("/api/applications/resume", { method: "POST", body: data });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Couldn't upload your résumé.");
          const parsed = resumeAnswerSchema.parse(result); onChange(parsed);
        } catch (error) { onError(error instanceof Error ? error.message : "Couldn't upload your résumé. Try again."); }
        finally { setUploading(false); onBusy(false); }
      }} />
      {uploading && <p role="status">Uploading your résumé…</p>}
    </div>;
  }
  if (field.type === "textarea") return <textarea {...shared} value={value} rows={6} maxLength={5000} placeholder={field.placeholder || "Take your time. A few specific sentences help us get to know you."} onChange={event => onChange(event.target.value)} />;
  if (["select", "radio"].includes(field.type)) return <select {...shared} value={value} onChange={event => onChange(event.target.value)}><option value="">Choose an option</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  if (field.type === "multiselect") return <fieldset disabled={disabled} aria-describedby={shared["aria-describedby"]}><legend className="sr-only">{field.label || field.question}</legend>{options.map(option => <label className="club-question-choice" key={option.value}><input type="checkbox" checked={Array.isArray(answer) && answer.includes(option.value)} onChange={event => { const selected = Array.isArray(answer) ? answer as string[] : []; onChange(event.target.checked ? [...selected, option.value] : selected.filter(item => item !== option.value)); }} />{option.label}</label>)}</fieldset>;
  if (field.type === "checkbox") return <label className="club-question-choice"><input {...shared} type="checkbox" checked={answer === true} onChange={event => onChange(event.target.checked)} />I confirm</label>;
  return <input {...shared} type={field.type} value={value} maxLength={5000} placeholder={field.placeholder} autoComplete={field.id === "fullName" ? "name" : field.type === "email" ? "email" : "off"} onChange={event => onChange(event.target.value)} />;
}

export function AnswerSummary({ answer, field }: { answer: unknown; field: RecruitmentField }) {
  const resume = resumeAnswerSchema.safeParse(answer);
  if (field.type === "file" && resume.success) return <a className="club-text-link" href={`/api/applications/resume/${resume.data.id}`}>{resume.data.name}</a>;
  if (answer === true) return <>Confirmed</>;
  if (answer == null || answer === "" || answer === false || (Array.isArray(answer) && !answer.length)) return <span className="club-field-help">Not provided</span>;
  const options = field.options?.map(option => typeof option === "string" ? { label: option, value: option } : option);
  const label = (value: unknown) => options?.find(option => option.value === value)?.label || String(value);
  return <>{Array.isArray(answer) ? answer.map(label).join(", ") : label(answer)}</>;
}
