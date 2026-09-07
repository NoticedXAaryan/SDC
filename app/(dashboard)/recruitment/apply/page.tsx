import Link from "next/link";
import { db } from "@/lib/db";
import { applications, formTemplates } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requirePageSession } from "@/lib/dal/auth";
import { isClubMember } from "@/lib/membership";
import { recruitmentFieldsSchema } from "@/lib/recruitment-form";
import { MembershipForm } from "@/components/recruitment/membership-form";
import { PageHeader } from "@/components/astryx/page-header";
import { describeApplicationStatus } from "@/lib/domain/application-status";

export default async function RecruitmentApplyPage() {
  const { user } = await requirePageSession("/recruitment/apply");
  const [form] = await db.select().from(formTemplates).where(eq(formTemplates.isActive, true)).orderBy(desc(formTemplates.updatedAt)).limit(1);
  const [application] = form ? await db.select({ status: applications.status, answers: applications.answers }).from(applications).where(and(eq(applications.userId, user.id), eq(applications.applicationCycle, form.cycleName))).limit(1) : [];
  const parsed = form ? recruitmentFieldsSchema.safeParse(form.fields) : null;
  const status = application ? describeApplicationStatus(application.status) : null;
  return <div className="mx-auto max-w-2xl">
    <PageHeader title="Apply for membership" description="Tell us what you enjoy and how you'd like to contribute." />
    {isClubMember(user.role) ? <div className="club-settings-panel"><h2>You're already a club member.</h2><p className="club-field-help">You don't need to apply again.</p><Link className="club-text-link" href="/dashboard">Back to your home</Link></div> :
      !user.emailVerified ? <div className="club-settings-panel"><h2>Verify your email first</h2><p className="club-field-help">Confirm your address before sending an application.</p><Link className="club-text-link" href="/verify-email?callbackUrl=%2Frecruitment%2Fapply">Verify email</Link></div> :
      !form ? <div className="club-settings-panel"><h2>Applications are currently closed.</h2><p className="club-field-help">The next form will appear here when the club opens recruitment. You can still join public events.</p><Link className="club-text-link" href="/events">Explore events</Link></div> :
      application && application.status !== "draft" ? <div className="club-settings-panel"><span className="club-status">{status?.label}</span><h2 className="mt-4">Your application is with the club.</h2><p className="club-field-help mt-2">{status?.description}</p><Link className="club-text-link" href="/dashboard">Track your application</Link></div> :
      parsed?.success ? <MembershipForm fields={parsed.data} cycle={form.cycleName} initialAnswers={{ fullName: user.name, email: user.email, ...(application?.answers || {}) as Record<string, unknown> }} hasDraft={application?.status === "draft"} /> :
      <div className="club-settings-panel"><h2>This application form needs an update.</h2><p className="club-field-help">Please contact a club admin or check back later. Your account is ready to use.</p></div>}
  </div>;
}
