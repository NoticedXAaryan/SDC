import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formResponses, formFields } from "@/lib/db/schema";
import { requireSession, requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";
import { z } from "zod";

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

  // Fetch form fields to build dynamic Zod schema
  const fields = await db.query.formFields.findMany({
    where: eq(formFields.formId, id),
  });

  const schemaShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny = z.any();
    switch (field.type) {
      case "short_text":
      case "long_text":
      case "dropdown":
        fieldSchema = z.string();
        break;
      case "email":
        fieldSchema = z.string().email();
        break;
      case "number":
      case "rating":
        fieldSchema = z.number();
        break;
      case "checkbox":
        fieldSchema = z.boolean();
        break;
      case "date":
        fieldSchema = z.string().datetime().or(z.string()); // loose date check
        break;
      default:
        fieldSchema = z.any();
    }
    
    if (field.required) {
      schemaShape[field.id] = fieldSchema;
    } else {
      schemaShape[field.id] = fieldSchema.optional();
    }
  }

  const dynamicSchema = z.object(schemaShape).passthrough();
  const parsed = dynamicSchema.safeParse(body.answers);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
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

  // Insert response using strictly validated data
  const [response] = await db.insert(formResponses).values({
    formId: id,
    userId: user?.id,
    answers: parsed.data,
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
