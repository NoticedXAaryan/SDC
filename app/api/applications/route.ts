import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { formTemplates } from "@/lib/db/schema";
import { getCurrentUser, checkEmergencyFreeze } from "@/lib/dal/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq, desc } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { submitApplication } from "@/lib/services/applications";
import { enrollmentFields, recruitmentFieldsSchema, validateRecruitmentAnswers } from "@/lib/recruitment-form";
import { requireCollegeVerification } from "@/lib/services/college-verification";

export const POST = withApiHandler(async (req: NextRequest) => {
  const rl = await checkRateLimit(req, "apply");
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await checkEmergencyFreeze(session?.user?.role as string);

  const body = await req.json();

  // 0. Honeypot check
  if (body.honeypot) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // 1. Turnstile validation
  const { validateTurnstile } = await import("@/lib/turnstile");
  const turnstileValid = body.status === "draft" || await validateTurnstile(body.turnstileToken || req.headers.get("x-turnstile-token"));
  if (!turnstileValid) {
    return NextResponse.json({ error: "Invalid captcha token" }, { status: 400 });
  }

  // Validate against active form template
  const [activeForm] = await db.select().from(formTemplates).where(eq(formTemplates.isActive, true)).orderBy(desc(formTemplates.updatedAt)).limit(1);

  if (!activeForm) {
    return NextResponse.json({ error: "No active application cycle found" }, { status: 400 });
  }

  if (body.applicationCycle && body.applicationCycle !== activeForm.cycleName) return NextResponse.json({ error: "The recruitment round changed. Reload the form before submitting." }, { status: 409 });
  {
    const parsed = recruitmentFieldsSchema.safeParse(activeForm.fields);
    if (!parsed.success) return NextResponse.json({ error: "This form needs an update. Contact a club admin." }, { status: 503 });
    if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) return NextResponse.json({ error: "Complete the application questions." }, { status: 400 });
    const fields = enrollmentFields(parsed.data);
    const error = validateRecruitmentAnswers(body.status === "draft" ? fields.map(field => ({ ...field, required: false })) : fields, body.answers);
    if (error) return NextResponse.json({ error }, { status: 400 });
    // Store only configured questions, not arbitrary client-supplied metadata.
    body.answers = Object.fromEntries(fields.filter(field => body.answers[field.id] !== undefined).map(field => [field.id, body.answers[field.id]]));
    if (body.status !== "draft") await requireCollegeVerification(session.user.id);
  }

  try {
    const rawData = { ...body, applicationCycle: activeForm.cycleName, isDraft: body.status === "draft" };
    const responseBody = await submitApplication(session as any, rawData);

    return NextResponse.json(responseBody);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
