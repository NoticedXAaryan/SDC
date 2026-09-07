import Link from "next/link";
import { ArrowRight, CalendarDays, UserRound, Check, UsersRound } from "lucide-react";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";
import { requirePageSession } from "@/lib/dal/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";

export const metadata = { title: "Welcome to SDC", description: "Your guide to participating and joining the club." };
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const { user } = await requirePageSession("/setup");
  const callbackUrl = sanitizeAuthRedirect((await searchParams).callbackUrl);
  if (!user.emailVerified) redirect(`/verify-email?callbackUrl=${encodeURIComponent(`/setup?callbackUrl=${encodeURIComponent(callbackUrl)}`)}`);
  return <AuthLayout>
    <div className="space-y-6">
      <span className="club-step-done"><Check size={18} aria-hidden="true" /></span>
      <div><p className="club-eyebrow">Your account is ready</p><h1 className="text-3xl font-semibold tracking-tight">Find your place at SDC.</h1><p className="mt-3 club-field-help">Start as a participant. Explore public workshops and meetups, register for events, and keep your passes and issued certificates together.</p></div>
      <section className="club-guide-panel" aria-labelledby="joining-heading">
        <h2 id="joining-heading">How membership works</h2>
        <ol className="club-guide-steps">
          <li><strong>Apply when you're ready</strong><p>Fill in the current membership form with your interests and what you'd like to contribute.</p></li>
          <li><strong>The club reviews your application</strong><p>The team verifies your details and may arrange an interview. Your dashboard shows progress and notifications explain any next step.</p></li>
          <li><strong>Get approved and join</strong><p>Membership starts after approval. An admin can also grant it directly. Email verification alone does not make you a member.</p></li>
        </ol>
        <p className="club-field-help">Members can join member-only events and see community usernames. Team responsibilities and management tools depend on your assigned role.</p>
      </section>
      <form action={completeOnboarding} className="space-y-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <button name="destination" value="apply" className="club-button w-full"><UsersRound size={17} aria-hidden="true" />Apply for membership<ArrowRight size={16} aria-hidden="true" /></button>
        <button name="destination" value="continue" className="club-button club-button-secondary w-full">{callbackUrl === "/dashboard" ? "Go to my home" : "Continue where I left off"}</button>
      </form>
      <div className="club-onboarding-links">
        <Link href="/events"><CalendarDays size={20} aria-hidden="true" /><span>Explore events<small>Membership isn't needed for public events.</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
        <Link href="/settings"><UserRound size={20} aria-hidden="true" /><span>Your profile<small>Review your username and account.</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
      <p className="club-field-help">No need to decide now. You can return to this guide from your dashboard.</p>
    </div>
  </AuthLayout>;
}
