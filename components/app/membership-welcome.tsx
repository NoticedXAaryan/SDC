"use client";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
export function MembershipWelcome() {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (dismissed) return null;
  async function dismiss() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/users/me/membership-welcome", { method: "POST" });
      if (!response.ok) throw new Error();
      setDismissed(true);
    } catch { setError("Couldn't dismiss this message. Please try again."); }
    finally { setPending(false); }
  }
  return <section className="club-welcome-notice" aria-label="Membership approved">
    <BadgeCheck size={26} aria-hidden="true" />
    <div><h2 role="status">Congratulations! You are a member now.</h2><p>Your membership has been approved. You're ready for member-only events and the club community.</p>
      <Link href="/events" className="club-text-link">Explore events</Link>
      {error && <p role="alert">{error}</p>}
    </div>
    <button className="club-button club-button-secondary" disabled={!hydrated || pending} onClick={dismiss}>{pending ? "Saving…" : "Got it"}</button>
  </section>;
}
