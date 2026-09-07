"use client";
import { useEffect, useState } from "react";
import { usernameError } from "@/lib/username-policy";

export function UsernameField({ value, onChange, currentValue = "", disabled = false }: {
  value: string; onChange: (value: string) => void; currentValue?: string; disabled?: boolean;
}) {
  const [result, setResult] = useState<{ value: string; message: string } | null>(null);
  const validation = value ? usernameError(value) : null;
  const changed = value !== currentValue;
  useEffect(() => {
    if (!value || usernameError(value) || value === currentValue) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check?u=${encodeURIComponent(value)}`, { signal: controller.signal });
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ value, message: response.ok ? data.message : data.error || "Availability could not be checked. Try again shortly." });
      } catch {
        if (!controller.signal.aborted) setResult({ value, message: "Availability could not be checked. You can still try saving." });
      }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, currentValue]);
  return <div className="club-field">
    <label htmlFor="account-username">Username</label>
    <div className="club-username-input"><span aria-hidden="true">@</span><input id="account-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" disabled={disabled} value={value} onChange={event => onChange(event.target.value.toLowerCase())} aria-describedby="username-help username-result" aria-invalid={!!validation} /></div>
    <p id="username-help" className="club-field-help">3–20 letters, numbers, or underscores. Other people can see your username only if they are club members.</p>
    <p id="username-result" className="club-field-help" role="status">{validation || (changed && value ? result?.value === value ? result.message : "Checking availability…" : "You can always see your own username in Settings.")}</p>
  </div>;
}
