import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Student Developer Club",
  description: "Reset your password for the SDC Portal",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      heading="Reset Password"
      subheading="Get back into your account and continue your journey with the club."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
