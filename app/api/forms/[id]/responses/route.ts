import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formResponses } from "@/lib/db/schema";
import { requireSession, requireRole } from "@/lib/dal/auth";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await req.json();
  const session = await requireSession();
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

  if (!settings.allowExternal && !user) {
    throw new AuthorizationError("Login required");
  }

  if (settings.collegeDomainOnly && user && !user.email?.endsWith("college.edu.in")) {
    return NextResponse.json({ error: "College domain only" }, { status: 403 });
  }

  // Rate Limiting
  const rateLimit = await checkRateLimit(req as any, `form_submit_${id}`);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Quota Logic
  if (user && !settings.allowMultiple) {
    const existingResponses = await db.query.formResponses.findMany({
      where: and(
        eq(formResponses.formId, id),
        eq(formResponses.userId, user.id)
      ),
    });

    const quotaPerUser = settings.quotaPerUser || 1;
    if (existingResponses.length >= quotaPerUser) {
      return NextResponse.json({ error: `You have reached the maximum allowed submissions (${quotaPerUser})` }, { status: 429 });
    }
  }

  // Insert response
  const [response] = await db.insert(formResponses).values({
    formId: id,
    userId: user?.id,
    answers: body.answers,
  }).returning();

  return NextResponse.json({ success: true, responseId: response.id });
});

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await requireRole(["admin", "owner", "lead"]);

  const responses = await db.query.formResponses.findMany({
    where: eq(formResponses.formId, id),
    orderBy: (fr, { desc }) => desc(fr.createdAt),
  });

  return NextResponse.json({ responses });
}, { requireRateLimit: false });
