import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formFields, formResponses } from "@/lib/db/schema";
import { requireAdmin, checkEmergencyFreeze } from "@/lib/dal/auth";
import { eq, sql } from "drizzle-orm";
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

export const POST = withApiHandler(async (req: Request) => {
    const session = await requireAdmin();
    
    
    const body = await req.json();
    const data = formSchema.parse(body);

    const [newForm] = await db.insert(forms).values({
      title: data.title,
      description: data.description,
      status: data.status,
      settings: data.settings,
      createdBy: session.user.id,
    }).returning();

    if (data.fields.length > 0) {
      await db.insert(formFields).values(
        data.fields.map((field, index) => ({
          formId: newForm.id,
          type: field.type,
          label: field.label,
          required: field.required,
          options: field.options,
          autoFillKey: field.autoFillKey,
          order: index,
        }))
      );
    }

    const createdFields = await db.query.formFields.findMany({
      where: (ff, { eq }) => eq(ff.formId, newForm.id),
      orderBy: (ff, { asc }) => asc(ff.order),
    });

    return NextResponse.json({ ...newForm, fields: createdFields });
});

export const GET = withApiHandler(async (req: Request) => {
    const session = await requireAdmin(); 
    
    // Fetch all forms with their response counts
    const formsWithCounts = await db.select({
      id: forms.id,
      title: forms.title,
      description: forms.description,
      status: forms.status,
      createdAt: forms.createdAt,
      responseCount: sql<number>`count(${formResponses.id})`.mapWith(Number)
    })
    .from(forms)
    .leftJoin(formResponses, eq(forms.id, formResponses.formId))
    .groupBy(forms.id)
    .orderBy(sql`${forms.createdAt} DESC`);

    return NextResponse.json(formsWithCounts);
});
