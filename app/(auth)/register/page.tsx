import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { Metadata } from "next";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Register | Student Developer Club",
  description: "Join the Student Developer Club portal.",
};

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const callbackUrl = sanitizeAuthRedirect((await searchParams).callbackUrl);

  return (
    <AuthLayout
      heading="Join the Club"
      subheading="Create your account to connect with other developers and access exclusive resources."
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
