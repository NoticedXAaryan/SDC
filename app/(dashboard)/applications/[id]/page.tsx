import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, formTemplates, user, collegeIdentities } from "@/lib/db/schema";
import { requirePageSession, type SDCRole } from "@/lib/dal/auth";
import { RECRUITMENT_REVIEWER_ROLES } from "@/lib/services/applications";
import { enrollmentFields, recruitmentFieldsSchema, resumeAnswerSchema } from "@/lib/recruitment-form";
import { describeApplicationStatus } from "@/lib/domain/application-status";
import { PageHeader } from "@/components/astryx/page-header";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePageSession(`/applications/${id}`);
  const [viewer] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!session.user.emailVerified || !RECRUITMENT_REVIEWER_ROLES.includes(viewer?.role as SDCRole)) redirect("/dashboard");
  const [application] = await db.select({ userId: user.id, answers: applications.answers, cycle: applications.applicationCycle, status: applications.status, name: user.name, email: user.email })
    .from(applications).innerJoin(user, eq(applications.userId, user.id)).where(and(eq(applications.id, id), ne(applications.status, "draft"))).limit(1);
  if (!application) notFound();
  const [template] = await db.select({ fields: formTemplates.fields }).from(formTemplates).where(eq(formTemplates.cycleName, application.cycle)).orderBy(desc(formTemplates.updatedAt)).limit(1);
  const parsed = recruitmentFieldsSchema.safeParse(template?.fields);
  const fields = parsed.success ? enrollmentFields(parsed.data) : [];
  const [college] = await db.select({ email: collegeIdentities.collegeEmail, verifiedAt: collegeIdentities.verifiedAt, enrollmentNumber: collegeIdentities.enrollmentNumber, collegeName: collegeIdentities.collegeName }).from(collegeIdentities).where(eq(collegeIdentities.userId, application.userId)).limit(1);
  return <div className="mx-auto max-w-3xl">
    <Link href="/applications" className="club-text-link mb-4">← Back to applications</Link>
    <PageHeader title={application.name} description={`${application.email} · ${application.cycle}`} />
    <section className="club-settings-panel">
      <span className="club-status">{describeApplicationStatus(application.status).label}</span>
      {college?.verifiedAt && <div className="club-question-note mt-5"><strong>College email verified</strong><p>{college.email}</p>{college.enrollmentNumber && <p>Enrollment: {college.enrollmentNumber} · {college.collegeName}</p>}<p>Email ownership is verified. Enrollment details are applicant-provided and need your review.</p></div>}
      <h2 className="mt-5">Application answers</h2>
      <dl className="club-answer-review">{Object.entries(application.answers || {}).map(([key, value]) => {
        const field = fields.find(item => item.id === key);
        const resume = resumeAnswerSchema.safeParse(value);
        const text = value === true ? "Confirmed" : value == null || value === false || value === "" ? "Not provided" : Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : JSON.stringify(value);
        return <div key={key}><dt>{field?.label || field?.question || key}</dt><dd>{resume.success ? <a className="club-text-link" href={`/api/applications/resume/${resume.data.id}`}>Download résumé · {resume.data.name}</a> : text}</dd></div>;
      })}</dl>
      <p className="club-field-help">Return to the recruitment board to schedule an interview or record a decision.</p>
    </section>
  </div>;
}
