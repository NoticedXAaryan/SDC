"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      
      if (result.error) {
        setError(result.error.message || "Failed to send reset link");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center text-white">
        <div className="flex justify-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 p-3">
            <CheckCircle2 className="h-6 w-6 text-cyan-300" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
          <p className="text-sm text-slate-400">
            If an account exists for <span className="font-medium text-white">{email}</span>, a reset link is on its way.
          </p>
        </div>
        <Button variant="outline" className="w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" asChild>
          <Link href="/login">Return to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Account recovery</p>
        <h2 className="text-3xl font-black tracking-[-0.03em] text-white">Reset your access</h2>
        <p className="text-sm text-slate-400">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-slate-300">Email</Label>
          <Input 
            id="reset-email" 
            type="email" 
            placeholder="name@paruluniversity.ac.in" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus-visible:border-violet-400/60 focus-visible:ring-violet-400/20"
            autoComplete="email"
          />
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="h-12 w-full bg-white font-bold text-slate-950 hover:bg-violet-100" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link 
          href="/login" 
          className="font-bold text-white transition-colors hover:text-violet-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
