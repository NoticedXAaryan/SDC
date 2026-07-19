import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formFields } from "@/lib/db/schema";
import { requireAdmin, requireSession } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";

const fieldSchema = z.object({
  type: z.enum(["short_text", "long_text", "email", "number", "dropdown", "checkbox", "file", "date", "rating"]),
  label: z.string().min(1),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  autoFillKey: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "closed", "archived"]).default("draft"),
  settings: z.object({
    allowExternal: z.boolean().default(false),
    requireLogin: z.boolean().default(true),
    allowMultiple: z.boolean().default(false),
    autoFillProfile: z.boolean().default(true),
    quotaPerUser: z.number().default(1),
    quotaPerForm: z.number().default(1000),
    collegeDomainOnly: z.boolean().default(true),
  }),
  fields: z.array(fieldSchema),
});

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await requireSession();

  const [form] = await db.query.forms.findMany({
    where: eq(forms.id, id),
  });

  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = await db.query.formFields.findMany({
    where: eq(formFields.formId, id),
    orderBy: (ff, { asc }) => asc(ff.order),
  });

  return NextResponse.json({ ...form, fields });
}, { requireRateLimit: false });

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();
  const data = formSchema.parse(body);

  const [updatedForm] = await db.update(forms).set({
    title: data.title,
    description: data.description,
    status: data.status,
    settings: data.settings,
  }).where(eq(forms.id, id)).returning();

  await db.delete(formFields).where(eq(formFields.formId, id));

  if (data.fields.length > 0) {
    await db.insert(formFields).values(
      data.fields.map((field, index) => ({
        formId: id,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options,
        autoFillKey: field.autoFillKey,
        order: index,
      }))
    );
  }

  const updatedFields = await db.query.formFields.findMany({
    where: eq(formFields.formId, id),
    orderBy: (ff, { asc }) => asc(ff.order),
  });

  return NextResponse.json({ ...updatedForm, fields: updatedFields });
});

export const DELETE = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireAdmin();
  const { id } = await params;
  
  await db.delete(formFields).where(eq(formFields.formId, id));
  await db.delete(forms).where(eq(forms.id, id));
  
  return NextResponse.json({ success: true });
});
