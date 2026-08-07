"use client";

import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token && !success) {
      setError("Invalid or missing reset token.");
    }
  }, [token, success]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      });

      if (error) {
        setError(error.message || "Failed to reset password. The link may have expired.");
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
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Password reset complete</h2>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully updated.
          </p>
        </div>
        <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-6 rounded-lg flex flex-col items-center justify-center gap-3">
          <CheckCircle2 className="w-10 h-10" />
          <h4 className="font-semibold text-lg">Success!</h4>
          <p className="text-sm text-center">You can now sign in with your new password.</p>
        </div>
        <Button className="w-full h-11" onClick={() => router.push('/login')}>
          Proceed to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>
      
      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input 
            id="new-password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token}
            className="h-11"
            autoComplete="new-password"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Confirm Password</Label>
          <Input 
            id="confirm-new-password" 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token}
            className="h-11"
            autoComplete="new-password"
          />
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={loading || !token}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset password"
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
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      heading="Set a new password"
      subheading="Choose a strong password to secure your account."
    >
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
