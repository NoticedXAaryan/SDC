import { RegisterForm } from "@/components/auth/register-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function RegisterPage() {
  return (
    <AuthLayout
      heading="Join the club"
      subheading="Create your account to become part of the Student Developer Club community."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
