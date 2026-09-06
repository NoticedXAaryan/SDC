import Link from "next/link";
import { ArrowRight, CalendarDays, UserRound, Check } from "lucide-react";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";
import { requirePageSession } from "@/lib/dal/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { redirect } from "next/navigation";

export const metadata = { title: "Welcome to SDC", description: "Choose your next step." };
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const { user } = await requirePageSession("/setup");
  const callbackUrl = sanitizeAuthRedirect((await searchParams).callbackUrl);
  if (!user.emailVerified) redirect(`/verify-email?callbackUrl=${encodeURIComponent(`/setup?callbackUrl=${encodeURIComponent(callbackUrl)}`)}`);
  return <AuthLayout>
    <div className="space-y-6">
      <span className="club-step-done"><Check size={18} aria-hidden="true" /></span>
      <div><p className="club-eyebrow">You're in</p><h1 className="text-3xl font-semibold tracking-tight text-white">Welcome to the club.</h1><p className="mt-3 text-sm text-slate-300">Your account is ready. Start with an event, or take a minute to introduce yourself.</p></div>
      <Link href={callbackUrl} className="club-button w-full">{callbackUrl === "/dashboard" ? "Go to my home" : "Continue where I left off"}<ArrowRight size={16} aria-hidden="true" /></Link>
      <div className="club-onboarding-links">
        <Link href="/events"><CalendarDays size={20} aria-hidden="true" /><span>Find your first event<small>Explore upcoming workshops and meetups.</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
        <Link href="/settings"><UserRound size={20} aria-hidden="true" /><span>Set up your profile<small>Add your username and interests.</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
      <p className="text-sm text-slate-400">A club account lets you register for public events. Joining the organizing team is a separate application.</p>
    </div>
  </AuthLayout>;
}
