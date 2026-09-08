import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, forms, formFields, formResponses } from "@/lib/db/schema";
import { getCurrentUser, requireRole } from "@/lib/dal/auth";
import { eq, sql } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { canDesignForms, FORM_DESIGNER_ROLES } from "@/lib/domain/forms";
import { formDefinitionSchema } from "@/lib/validators/forms";

export const POST = withApiHandler(async (req: Request) => {
    const session = await requireRole([...FORM_DESIGNER_ROLES]);
    
    
    const body = await req.json();
    const data = formDefinitionSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      const [newForm] = await tx.insert(forms).values({
        title: data.title,
        description: data.description,
        status: data.status,
        settings: data.settings,
        createdBy: session.user.id,
      }).returning();

      if (data.fields.length > 0) {
        await tx.insert(formFields).values(data.fields.map((field, index) => ({
          id: field.id,
          formId: newForm.id,
          type: field.type,
          label: field.label,
          required: field.required,
          options: field.options,
          autoFillKey: field.autoFillKey,
          visibilityRules: field.visibilityRules,
          order: index,
        })));
      }
      await tx.insert(auditLogs).values({
        actorId: session.user.id,
        action: "form_created",
        entity: "form",
        entityId: newForm.id,
        details: JSON.stringify({ status: data.status, fieldCount: data.fields.length }),
      });
      const createdFields = await tx.query.formFields.findMany({
        where: (ff, { eq }) => eq(ff.formId, newForm.id),
        orderBy: (ff, { asc }) => asc(ff.order),
      });
      return { newForm, createdFields };
    });

    return NextResponse.json({ ...result.newForm, fields: result.createdFields });
});

export const GET = withApiHandler(async () => {
    const session = await getCurrentUser();
    const canSeeDrafts = canDesignForms(session?.user.role as string | undefined);
    
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
    .where(canSeeDrafts ? undefined : eq(forms.status, "published"))
    .groupBy(forms.id)
    .orderBy(sql`${forms.createdAt} DESC`);

    return NextResponse.json(formsWithCounts);
}, { requireAuth: false, requireRateLimit: false });
