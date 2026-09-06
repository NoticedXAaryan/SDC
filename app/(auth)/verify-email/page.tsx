import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { requirePageSession } from "@/lib/dal/auth";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";
import { hasEmailDelivery } from "@/lib/auth-policy";

export const metadata = { title: "Verify your email | Student Developer Club" };

export default async function VerifyEmailPage({ searchParams }: {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = sanitizeAuthRedirect(params.callbackUrl);
  const callbackUrl = requested.startsWith("/verify-email") ? "/dashboard" : requested;
  const { user } = await requirePageSession(`/verify-email?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (user.emailVerified) redirect(callbackUrl);
  return <AuthLayout><VerifyEmailForm email={user.email} callbackUrl={callbackUrl} deliveryEnabled={hasEmailDelivery(process.env)} invalidLink={Boolean(params.error)} /></AuthLayout>;
}
