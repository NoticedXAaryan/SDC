import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, forms, formFields } from "@/lib/db/schema";
import { getCurrentUser, requireRole } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { canDesignForms, FORM_DESIGNER_ROLES } from "@/lib/domain/forms";
import { formDefinitionSchema } from "@/lib/validators/forms";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getCurrentUser();

  const [form] = await db.query.forms.findMany({
    where: eq(forms.id, id),
  });

  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const canPreviewDraft = canDesignForms(session?.user.role as string | undefined);
  if (form.status !== "published" && !canPreviewDraft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields = await db.query.formFields.findMany({
    where: eq(formFields.formId, id),
    orderBy: (ff, { asc }) => asc(ff.order),
  });

  return NextResponse.json({ ...form, fields });
}, { requireRateLimit: false, requireAuth: false });

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireRole([...FORM_DESIGNER_ROLES]);
    
    
  const { id } = await params;
  const body = await req.json();
  const data = formDefinitionSchema.parse(body);

  const result = await db.transaction(async (tx) => {
    const [updatedForm] = await tx.update(forms).set({
      title: data.title,
      description: data.description,
      status: data.status,
      settings: data.settings,
    }).where(eq(forms.id, id)).returning();
    if (!updatedForm) return null;

    await tx.delete(formFields).where(eq(formFields.formId, id));
    if (data.fields.length > 0) {
      await tx.insert(formFields).values(data.fields.map((field, index) => ({
        id: field.id,
        formId: id,
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
      action: "form_updated",
      entity: "form",
      entityId: id,
      details: JSON.stringify({ status: data.status, fieldCount: data.fields.length }),
    });

    const updatedFields = await tx.query.formFields.findMany({
      where: eq(formFields.formId, id),
      orderBy: (ff, { asc }) => asc(ff.order),
    });
    return { updatedForm, updatedFields };
  });

  if (!result) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  return NextResponse.json({ ...result.updatedForm, fields: result.updatedFields });
});

export const DELETE = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireRole([...FORM_DESIGNER_ROLES]);
    
    
  const { id } = await params;
  
  const [deleted] = await db.transaction(async (tx) => {
    const removed = await tx.delete(forms).where(eq(forms.id, id)).returning({ id: forms.id });
    if (removed[0]) {
      await tx.insert(auditLogs).values({
        actorId: session.user.id,
        action: "form_deleted",
        entity: "form",
        entityId: id,
      });
    }
    return removed;
  });
  if (!deleted) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  
  return NextResponse.json({ success: true });
});
