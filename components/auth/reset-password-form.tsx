"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is incomplete or has expired. Request a new one.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Use at least 8 characters with one letter and one number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message || "This reset link is invalid or has expired.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("The password service is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center text-white">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10">
          <CheckCircle2 className="h-7 w-7 text-cyan-300" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">Password updated</h2>
          <p className="mt-2 text-sm text-slate-400">Your new password is ready. Sign in to continue your journey.</p>
        </div>
        <Button asChild className="h-12 w-full bg-white font-bold text-slate-950 hover:bg-violet-100">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Secure reset</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white">Choose a new password</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">Make it memorable, unique, and at least eight characters long.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-slate-300">New password</Label>
          <div className="relative">
            <Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" className="h-12 border-white/10 bg-black/30 pr-11 text-white focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-slate-300">Confirm password</Label>
          <Input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" className="h-12 border-white/10 bg-black/30 text-white focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20" />
        </div>

        {error && <div role="alert" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

        <Button type="submit" className="h-12 w-full bg-white font-bold text-slate-950 hover:bg-violet-100" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Updating…</> : "Update password"}
        </Button>
      </form>

      {!token && <p className="text-center text-sm text-slate-500"><Link href="/forgot-password" className="font-bold text-white hover:text-violet-200">Request a new reset link</Link></p>}
    </div>
  );
}
