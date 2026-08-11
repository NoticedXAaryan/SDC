"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button, TextInput, Text, VStack, HStack } from "@astryxdesign/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const result = await signIn.email({
        email,
        password,
      });
      
      if (result.error) {
        setError(result.error.message || "Failed to login");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack gap={8}>
      {/* Header */}
      <VStack gap={2}>
        <Text as="h2" weight="bold" className="text-2xl tracking-tight">Sign in</Text>
        <Text type="supporting" className="text-sm">
          Enter your credentials to access the club portal.
        </Text>
      </VStack>

      {/* Google OAuth */}
      <Button 
        type="button" 
        variant="secondary" 
        className="w-full"
        onClick={async () => {
          await signIn.social({
            provider: "google",
            callbackURL: "/dashboard"
          });
        }}
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        }
        label="Continue with Google"
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <VStack gap={2}>
          <TextInput 
            id="login-email" 
            label="Email"
            type="email" 
            placeholder="name@paruluniversity.ac.in" 
            value={email}
            onChange={(val) => setEmail(val)}
            isRequired
          />
        </VStack>

        <VStack gap={2}>
          <HStack justify="between" className="w-full">
            <Text type="supporting" className="text-sm font-medium">Password</Text>
            <Link 
              href="/forgot-password" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </HStack>
          <TextInput 
            id="login-password" 
            label="Password"
            isLabelHidden={true}
            type="password" 
            value={password}
            onChange={(val) => setPassword(val)}
            isRequired
          />
        </VStack>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isDisabled={loading} label={loading ? "Signing in..." : "Sign in"} icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined} />
      </form>

      {/* Footer */}
      <Text className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link 
          href="/register" 
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Create one
        </Link>
      </Text>
    </VStack>
  );
}
