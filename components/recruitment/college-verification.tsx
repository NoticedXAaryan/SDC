"use client";
import { useState } from "react";
import { COLLEGE_EMAIL_DOMAIN, collegeDetailsSchema } from "@/lib/college-policy";

export function CollegeVerification({ onVerified, onBack }: { onVerified: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [collegeName, setCollegeName] = useState("Parul University, Goa");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function act(action: "send" | "verify") {
    setError(""); setMessage("");
    if (action === "send") {
      const parsed = collegeDetailsSchema.safeParse({ email, enrollmentNumber, collegeName });
      if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    }
    setPending(true);
    try {
      const response = await fetch("/api/users/me/college-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, email, enrollmentNumber, collegeName, code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't verify your college email.");
      if (data.verified) onVerified();
      else { setSent(true); setMessage("Code sent. Check your college inbox; it expires in 10 minutes."); }
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't verify your college email. Try again."); }
    finally { setPending(false); }
  }
  return <form className="club-questionnaire" onSubmit={event => { event.preventDefault(); void act(sent ? "verify" : "send"); }}>
    <span className="club-eyebrow">Before the questions · College email</span>
    <h2 className="mt-4">Let's confirm your college address.</h2>
    <p className="club-field-help mt-4 mb-7">We'll send a code to your @{COLLEGE_EMAIL_DOMAIN} inbox. Your sign-in email stays the same. A reviewer will check the enrollment details you provide.</p>
    <fieldset disabled={pending} className="space-y-5">
      {sent ? <><p className="club-field-help">Code sent to <strong>{email}</strong>.</p><div className="club-field"><label htmlFor="college-code">Verification code</label><input id="college-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></div><div className="flex flex-wrap gap-5"><button type="button" className="club-text-link" onClick={() => void act("send")}>Resend code</button><button type="button" className="club-text-link" onClick={() => { setSent(false); setCode(""); setError(""); }}>Change college details</button></div></> : <>
        <div className="club-field"><label htmlFor="college-email">College email</label><input id="college-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={`you@${COLLEGE_EMAIL_DOMAIN}`} required /></div>
        <div className="club-field"><label htmlFor="enrollment-number">Enrollment number</label><input id="enrollment-number" value={enrollmentNumber} onChange={event => setEnrollmentNumber(event.target.value)} minLength={4} maxLength={50} required /></div>
        <div className="club-field"><label htmlFor="college-name">College name</label><input id="college-name" value={collegeName} onChange={event => setCollegeName(event.target.value)} minLength={3} maxLength={150} required /></div>
      </>}
    </fieldset>
    {error && <p role="alert" className="club-form-error mt-4">{error}</p>}{message && <p role="status" className="club-form-success mt-4">{message}</p>}
    <div className="club-question-actions"><button type="button" className="club-button club-button-secondary" onClick={onBack} disabled={pending}>Back</button><button className="club-button" disabled={pending}>{pending ? "Please wait…" : sent ? "Verify and continue" : "Send verification code"}</button></div>
    <p className="club-field-help mt-5">Can't access your college inbox? Contact a club admin for help. You can still use your participant account.</p>
  </form>;
}
