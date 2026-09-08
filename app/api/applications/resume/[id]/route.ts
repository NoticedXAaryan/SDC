import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationDocuments, applications, user } from "@/lib/db/schema";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler, NotFoundError } from "@/lib/api-wrapper";
import { RECRUITMENT_REVIEWER_ROLES } from "@/lib/services/applications";
import { resumeAnswerSchema } from "@/lib/recruitment-form";

export const GET = withApiHandler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;
  const [document] = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, id)).limit(1);
  if (!document) throw new NotFoundError("Résumé not found.");
  if (document.userId !== session.user.id) {
    const [viewer] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
    const [application] = await db.select({ status: applications.status, answers: applications.answers }).from(applications).where(and(eq(applications.userId, document.userId), eq(applications.applicationCycle, document.cycle))).limit(1);
    const attached = Object.values(application?.answers || {}).some(value => { const parsed = resumeAnswerSchema.safeParse(value); return parsed.success && parsed.data.id === id; });
    if (!RECRUITMENT_REVIEWER_ROLES.includes(viewer?.role as typeof RECRUITMENT_REVIEWER_ROLES[number]) || !application || application.status === "draft" || !attached) throw new NotFoundError("Résumé not found.");
  }
  return new NextResponse(new Uint8Array(Buffer.from(document.content, "base64")), { headers: {
    "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${encodeURIComponent(document.name)}`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox",
  } });
});
