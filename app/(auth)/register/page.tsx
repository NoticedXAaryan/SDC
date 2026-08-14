import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Student Developer Club",
  description: "Join the Student Developer Club portal.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      heading="Join the Club"
      subheading="Create your account to connect with other developers and access exclusive resources."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
