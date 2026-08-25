import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Login | Student Developer Club",
  description: "Sign in to the SDC Portal",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = sanitizeAuthRedirect((await searchParams).callbackUrl);

  return (
    <AuthLayout
      heading="Welcome to SDC"
      subheading="Sign in to access your dashboard and manage your club activities."
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
