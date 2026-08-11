"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // @ts-expect-error - better-auth type inference issue
      const { data, error } = await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        setError(error.message || "Something went wrong.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Reset your password"
      subheading="We'll send you a link to reset your password and get back into your account."
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Forgot password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">Check your email</h4>
                <p className="text-sm mt-1">
                  If an account exists with this email, a password reset link has been sent.
                </p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full h-11">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input 
                id="forgot-email" 
                type="email" 
                placeholder="name@paruluniversity.ac.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link 
                href="/login" 
                className="font-medium text-foreground hover:underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
