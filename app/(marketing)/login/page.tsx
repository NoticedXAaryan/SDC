import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to access your club dashboard, events, certificates, and more."
    >
      <LoginForm />
    </AuthLayout>
  );
}
