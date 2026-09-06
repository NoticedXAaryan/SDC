import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formResponses, formFields } from "@/lib/db/schema";
import { getCurrentUser, requireRole } from "@/lib/dal/auth";
import { eq, and, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";
import { buildResponseSchema, isUniversityEmail } from "@/lib/forms/response-validation";
import { FORM_DESIGNER_ROLES } from "@/lib/domain/forms";
import { isFormFieldVisible } from "@/lib/forms/visibility";

export const POST = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await req.json();
  const session = await getCurrentUser();
  const user = session?.user;

  const [form] = await db.query.forms.findMany({
    where: eq(forms.id, id),
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.status !== "published") {
    return NextResponse.json({ error: "Form is not accepting responses" }, { status: 400 });
  }

  const settings = form.settings as any;

  if ((settings.requireLogin || !settings.allowExternal) && !user) {
    throw new AuthorizationError("Login required");
  }

  if (settings.collegeDomainOnly && (!user || !isUniversityEmail(user.email))) {
    return NextResponse.json({ error: "College domain only" }, { status: 403 });
  }

  // Fetch form fields to build dynamic Zod schema
  const fields = await db.query.formFields.findMany({
    where: eq(formFields.formId, id),
  });

  const submittedAnswers = body?.answers && typeof body.answers === "object" ? body.answers : {};
  const visibleFields = fields.filter((field) =>
    !["section_break", "image"].includes(field.type) && isFormFieldVisible(field, submittedAnswers)
  );
  const dynamicSchema = buildResponseSchema(visibleFields);
  const visibleAnswers = Object.fromEntries(
    visibleFields
      .filter((field) => Object.prototype.hasOwnProperty.call(submittedAnswers, field.id))
      .map((field) => [field.id, submittedAnswers[field.id]]),
  );
  const parsed = dynamicSchema.safeParse(visibleAnswers);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }

  // Rate Limiting
  const rateLimit = await checkRateLimit(req as any, `form_submit_${id}`);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const quotaPerForm = Math.max(1, Number(settings.quotaPerForm) || 1000);
  const quotaPerUser = settings.allowMultiple
    ? Math.max(1, Number(settings.quotaPerUser) || 1)
    : 1;

  const result = await db.transaction(async (tx) => {
    // Serialize quota checks for a form so concurrent submissions cannot overshoot.
    await tx.execute(sql`select id from ${forms} where id = ${id} for update`);
    const [formCount] = await tx.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(formResponses).where(eq(formResponses.formId, id));
    if (formCount.count >= quotaPerForm) return { error: "Form submission quota reached", status: 409 } as const;

    if (user) {
      const [userCount] = await tx.select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(formResponses)
        .where(and(eq(formResponses.formId, id), eq(formResponses.userId, user.id)));
      if (userCount.count >= quotaPerUser) {
        return { error: `You have reached the maximum allowed submissions (${quotaPerUser})`, status: 409 } as const;
      }
    }

    const [response] = await tx.insert(formResponses).values({
      formId: id,
      userId: user?.id,
      answers: parsed.data,
    }).returning();
    return { response } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, responseId: result.response.id });
}, { requireAuth: false });

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await requireRole([...FORM_DESIGNER_ROLES]);

  const responses = await db.query.formResponses.findMany({
    where: eq(formResponses.formId, id),
    orderBy: (fr, { desc }) => desc(fr.createdAt),
  });

  return NextResponse.json({ responses });
}, { requireRateLimit: false });
