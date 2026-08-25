import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | Student Developer Club",
  description: "Choose a new password for your SDC account.",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const rawToken = (await searchParams).token;
  const token = typeof rawToken === "string" ? rawToken : undefined;

  return (
    <AuthLayout heading="Return to orbit" subheading="Secure your account and get back to building with the community.">
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}
