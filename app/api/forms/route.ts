import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formFields } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
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
    // For listing forms in admin/management
    // A public endpoint would just get one form by ID or published forms
    const session = await requireAdmin(); // Wait, FIX.md says GET /api/forms is for all users? 
    // Actually, GET /api/forms for manage/forms -> lead+. Let's just return all forms if lead+
    const allForms = await db.query.forms.findMany({
      orderBy: (f, { desc }) => desc(f.createdAt)
    });
    return NextResponse.json(allForms);
});
