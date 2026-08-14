import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Student Developer Club",
  description: "Sign in to the SDC Portal",
};

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Welcome to SDC"
      subheading="Sign in to access your dashboard and manage your club activities."
    >
      <LoginForm />
    </AuthLayout>
  );
}
