"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { authClient, signOut } from "@/lib/auth-client";

export function VerifyEmailForm({ email, callbackUrl, deliveryEnabled, invalidLink }: {
  email: string; callbackUrl: string; deliveryEnabled: boolean; invalidLink: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"send" | "check" | "signout" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: "send" | "check" | "signout") {
    setPending(action);
    setError("");
    setMessage("");
    try {
      if (action === "send") {
        const result = await authClient.sendVerificationEmail({ email, callbackURL: `/verify-email?callbackUrl=${encodeURIComponent(callbackUrl)}` });
        if (result.error) throw new Error(result.error.message || "We couldn’t send the email. Please try again.");
        setMessage("A new verification link is on its way. Check your inbox and spam folder.");
      } else if (action === "check") {
        const result = await authClient.getSession({ query: { disableCookieCache: true } });
        if (result.error) throw new Error("We couldn’t check your account. Please try again.");
        if (!result.data) {
          router.replace(`/login?callbackUrl=${encodeURIComponent(`/verify-email?callbackUrl=${encodeURIComponent(callbackUrl)}`)}`);
        } else if (result.data.user.emailVerified) {
          router.replace(callbackUrl);
          router.refresh();
        } else {
          setMessage("Your email is still waiting for verification. Open the link in your latest email, then try again.");
        }
      } else {
        const result = await signOut();
        if (result.error) throw new Error("We couldn’t sign you out. Please try again.");
        router.replace("/login");
        router.refresh();
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong. Please try again.");
    } finally { setPending(null); }
  }

  return <div className="space-y-6">
    <span className="club-step-done"><Mail size={22} aria-hidden="true" /></span>
    <div>
      <p className="club-eyebrow">One more step</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Verify your email</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">Open the verification link sent to <strong className="break-all text-white">{email}</strong>. This confirms where we should send your event passes and account updates.</p>
    </div>
    {invalidLink && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">This verification link has expired or is invalid. Request a new link below.</p>}
    {!deliveryEnabled && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">Email delivery is currently unavailable. Your account has been saved. You can explore public events and return here when delivery is restored.</p>}
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <p role="status" aria-live="polite" className="text-sm text-slate-300">{message}</p>
    <div className="space-y-3">
      <button type="button" className="club-button w-full" onClick={() => run("check")} disabled={Boolean(pending)}>{pending === "check" ? "Checking…" : "I’ve verified my email"}</button>
      <button type="button" className="club-button club-button-secondary w-full" onClick={() => run("send")} disabled={Boolean(pending) || !deliveryEnabled}>{pending === "send" ? "Sending…" : "Resend verification email"}</button>
    </div>
    <p className="text-sm text-slate-400">Links expire after one hour. Check your spam folder if the email hasn’t arrived.</p>
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <Link href="/events" className="text-violet-200 underline underline-offset-4">Explore public events</Link>
      <button type="button" className="min-h-11 text-slate-300 underline underline-offset-4" disabled={Boolean(pending)} onClick={() => run("signout")}>Sign out</button>
    </div>
  </div>;
}
