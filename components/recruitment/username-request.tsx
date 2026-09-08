"use client";
import { useState } from "react";
import { UsernameField } from "@/components/auth/username-field";
import { usernameError } from "@/lib/username-policy";
export function UsernameRequest({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return <details className="mt-6"><summary className="club-text-link cursor-pointer">Review your username request</summary><form className="space-y-4 mt-3" onSubmit={async event => {
    event.preventDefault(); setError(""); setMessage("");
    const validation = usernameError(value); if (validation) { setError(validation); return; }
    setPending(true);
    try {
      const response = await fetch("/api/users/me/username", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't update your request.");
      setMessage("Username request updated. It becomes permanent only after approval.");
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't update your request."); }
    finally { setPending(false); }
  }}><p className="club-field-help">If your requested username becomes unavailable, choose another here. Your other submitted answers stay unchanged.</p><UsernameField value={value} onChange={setValue} disabled={pending} />{error && <p role="alert" className="club-form-error">{error}</p>}{message && <p role="status" className="club-form-success">{message}</p>}<button className="club-button" disabled={pending}>{pending ? "Updating…" : "Update username request"}</button></form></details>;
}
