"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  callbackUrl?: string;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09A6.9 6.9 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A10.9 10.9 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function RegisterForm({ callbackUrl = "/dashboard" }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const passwordChecks = useMemo(() => [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "one letter", valid: /[A-Za-z]/.test(password) },
    { label: "one number", valid: /\d/.test(password) },
  ], [password]);
  const passwordIsValid = passwordChecks.every((check) => check.valid);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!passwordIsValid) {
      setError("Choose a password that meets all requirements.");
      return;
    }
    if (hasTurnstile && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof signUp.email>[0] & { turnstileToken?: string } = {
        name: name.trim(),
        email: email.trim(),
        password,
        ...(turnstileToken ? { turnstileToken } : {}),
      };
      const result = await signUp.email(payload);

      if (result.error) {
        setError(result.error.message || "We could not create your account. Please try again.");
        return;
      }

      const setupUrl = callbackUrl === "/dashboard"
        ? "/setup"
        : `/setup?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      router.replace(setupUrl);
      router.refresh();
    } catch {
      setError("The registration service is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setSocialLoading(true);
    setError("");
    try {
      const result = await signIn.social({ provider: "google", callbackURL: callbackUrl });
      if (result?.error) setError(result.error.message || "Google sign-up could not be started.");
    } catch {
      setError("Google sign-up could not be started. Please try again.");
      setSocialLoading(false);
    }
  };

  const loginHref = callbackUrl === "/dashboard"
    ? "/login"
    : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Open membership</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white">Create your builder ID</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">One account for workshops, projects, passes, and your SDC journey.</p>
      </div>

      <Button type="button" variant="outline" className="h-12 w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" onClick={handleGoogleRegister} disabled={loading || socialLoading}>
        {socialLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
        <span className="h-px flex-1 bg-white/10" />or use email<span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="register-name" className="text-slate-300">Full name</Label>
            <Input id="register-name" placeholder="Your full name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" className="h-12 border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="register-email" className="text-slate-300">Email</Label>
            <Input id="register-email" type="email" placeholder="name@paruluniversity.ac.in" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" inputMode="email" className="h-12 border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="register-password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input id="register-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" className="h-12 border-white/10 bg-black/30 pr-11 text-white focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1" aria-label="Password requirements">
              {passwordChecks.map((check) => (
                <span key={check.label} className={`inline-flex items-center gap-1 text-[11px] ${check.valid ? "text-cyan-300" : "text-slate-600"}`}>
                  <Check size={11} aria-hidden="true" />{check.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {hasTurnstile && (
          <div className="flex justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-2">
            <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
          </div>
        )}

        {error && (
          <div role="alert" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}
          </div>
        )}

        <Button type="submit" className="h-12 w-full bg-white font-bold text-slate-950 hover:bg-violet-100" disabled={loading || socialLoading || (hasTurnstile && !turnstileToken)}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Creating account…</> : <>Create account<ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">Already a member?{" "}<Link href={loginHref} className="font-bold text-white transition-colors hover:text-violet-200">Sign in</Link></p>
      <p className="text-center text-[11px] leading-relaxed text-slate-600">By creating an account, you agree to our <Link href="/terms" className="text-slate-400 hover:text-white">Terms</Link> and <Link href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</Link>.</p>
    </div>
  );
}
