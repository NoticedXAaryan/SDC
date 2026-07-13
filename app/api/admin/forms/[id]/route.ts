import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formTemplates } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";

const formSchema = z.object({
  cycleName: z.string().min(1),
  fields: z.array(z.object({
    id: z.string(),
    type: z.enum(["text", "textarea", "radio", "checkbox", "file", "url"]),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    required: z.boolean().default(false),
  })),
  isActive: z.boolean().default(false),
});

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const resolvedParams = await params;
    await requireAdmin();
    const body = await req.json();
    const data = formSchema.parse(body);

    const [updated] = await db.update(formTemplates).set({
      cycleName: data.cycleName,
      fields: data.fields,
      isActive: data.isActive,
    }).where(eq(formTemplates.id, resolvedParams.id)).returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});

export const DELETE = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const resolvedParams = await params;
    await requireAdmin();
    await db.delete(formTemplates).where(eq(formTemplates.id, resolvedParams.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
});
