"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3, FileText } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { type RecruitmentField, validateRecruitmentAnswers } from "@/lib/recruitment-form";
import { useHydrated } from "@/lib/use-hydrated";
import { AnswerSummary, QuestionInput } from "./question-input";

export function MembershipForm({ fields, cycle, initialAnswers = {}, hasDraft = false }: { fields: RecruitmentField[]; cycle: string; initialAnswers?: Record<string, unknown>; hasDraft?: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [answers, setAnswers] = useState(initialAnswers);
  const [step, setStep] = useState(-1);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [challenge, setChallenge] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const review = step === fields.length;
  const field = fields[step];
  const disabled = !hydrated || pending || uploading;
  const minutes = Math.max(3, Math.ceil(fields.reduce((seconds, item) => seconds + (item.type === "textarea" ? 75 : item.type === "file" ? 45 : 15), 0) / 60));
  useEffect(() => { if (step >= 0) heading.current?.focus(); }, [step]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function go(next: number) { setError(""); setStep(next); }
  function next() {
    const invalid = validateRecruitmentAnswers([field], answers);
    if (invalid) { setError(invalid); return; }
    go(editing ? fields.length : step + 1); setEditing(false);
  }
  async function save(draft: boolean) {
    setError("");
    if (!draft) {
      const invalidIndex = fields.findIndex(item => validateRecruitmentAnswers([item], answers));
      if (invalidIndex >= 0) { go(invalidIndex); setError(validateRecruitmentAnswers([fields[invalidIndex]], answers) || "Check your answer."); return; }
    }
    setPending(true);
    try {
      const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, applicationCycle: cycle, status: draft ? "draft" : "applied", turnstileToken: token, honeypot }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't save your application.");
      setDirty(false);
      if (draft) { router.push("/dashboard"); router.refresh(); }
      else { setStep(fields.length + 1); }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't save your application. Your answers are still here; try again.");
      setToken(""); setChallenge(value => value + 1);
    } finally { setPending(false); }
  }
  if (step > fields.length) return <section className="club-questionnaire club-question-intro">
    <span className="club-question-icon"><Check aria-hidden="true" /></span>
    <h2 ref={heading} tabIndex={-1}>Your application is with the club.</h2>
    <p>Thanks for telling us about yourself. A reviewer will read your answers and may invite you for a conversation. You can track the decision from your home.</p>
    <p className="club-field-help">You're an applicant now. Membership begins when your application is approved.</p>
    <a href="/dashboard" className="club-button">Track my application <ArrowRight size={17} aria-hidden="true" /></a>
  </section>;
  if (step === -1) return <section className="club-questionnaire club-question-intro">
    <span className="club-eyebrow">SDC / MEMBERSHIP</span>
    <h2>Let's get to know you.</h2>
    <p>This is a conversation about your interests, your experience, and what you'd like to do with the club. You don't need an impressive portfolio to start.</p>
    <div className="club-question-facts"><span><Clock3 size={18} aria-hidden="true" />About {minutes}–{minutes + 3} minutes</span><span><FileText size={18} aria-hidden="true" />{fields.length} questions, one at a time</span></div>
    <div className="club-question-note"><strong>Before you begin</strong><p>Have any project or profile links ready{fields.some(item => item.type === "file") ? ", plus your résumé as a PDF if you have one" : ""}. You can go back, skip optional questions, and review everything before sending.</p><p>Use “Save and exit” to keep a draft in your account. Your application reaches the reviewers when you submit it.</p></div>
    <button type="button" className="club-button" disabled={disabled} onClick={() => go(0)}>{hasDraft ? "Continue my application" : "I'm ready"}<ArrowRight size={17} aria-hidden="true" /></button>
    <span className="club-field-help">Submitting starts a review; it doesn't automatically grant membership.</span>
  </section>;
  return <form noValidate className="club-questionnaire" onSubmit={event => { event.preventDefault(); if (!disabled) { if (review) { if (!siteKey || token) void save(false); } else next(); } }}>
    <div className="club-honeypot" aria-hidden="true"><label>Website<input value={honeypot} onChange={event => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
    <div className="club-question-topline"><span>{review ? "Final check" : `Question ${step + 1} of ${fields.length}`}</span><button type="button" className="club-text-link" disabled={disabled} onClick={() => void save(true)}>{pending ? "Saving…" : "Save and exit"}</button></div>
    <progress className="club-question-progress" max={fields.length} value={Math.min(step, fields.length)} aria-label="Application progress" />
    {review ? <section className="club-question-body">
      <h2 ref={heading} tabIndex={-1}>Does this look like you?</h2><p className="club-field-help">Check your answers before sending them to the recruitment team.</p>
      <dl className="club-answer-review">{fields.map((item, index) => <div key={item.id}><dt>{item.label || item.question}<button type="button" className="club-text-link" disabled={disabled} onClick={() => { setEditing(true); go(index); }} aria-label={`Edit: ${item.label || item.question}`}>Edit</button></dt><dd><AnswerSummary field={item} answer={answers[item.id]} /></dd></div>)}</dl>
      {siteKey && <Turnstile key={challenge} siteKey={siteKey} onSuccess={setToken} onExpire={() => setToken("")} onError={() => { setToken(""); setError("The security check couldn't load. Please try again."); }} />}
      <p className="club-field-help">Only authorized recruitment reviewers can read your submitted application. They'll review it and may arrange an interview before a membership decision.</p>
    </section> : <section className="club-question-body club-field" key={field.id}>
      <span className="club-eyebrow">{field.required ? "Required" : "Optional · you can skip this"}</span>
      <h2 ref={heading} id="question-title" tabIndex={-1}>{field.label || field.question}</h2>
      <p id="question-help" className="club-field-help">{field.description || "Answer in your own words."}</p>
      <QuestionInput key={field.id} field={field} answer={answers[field.id]} cycle={cycle} disabled={disabled} invalid={!!error} onBusy={setUploading} onError={setError} onChange={value => { setAnswers(previous => ({ ...previous, [field.id]: value })); setDirty(true); setError(""); }} />
    </section>}
    {error && <p id="application-error" role="alert" className="club-form-error">{error}</p>}
    <div className="club-question-actions"><button type="button" className="club-button club-button-secondary" disabled={disabled} onClick={() => { setEditing(false); go(step - 1); }}><ArrowLeft size={16} aria-hidden="true" />Back</button>
      <button className="club-button" disabled={disabled || review && !!siteKey && !token}>{pending ? "Saving…" : review ? "Submit application" : editing ? "Back to review" : step === fields.length - 1 ? "Review my answers" : "Next"}<ArrowRight size={16} aria-hidden="true" /></button>
    </div>
  </form>;
}
