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

export async function GET() {
  try {
    await requireAdmin();
    const forms = await db.select().from(formTemplates).orderBy(formTemplates.createdAt);
    return NextResponse.json(forms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
  }
}

export const POST = withApiHandler(async (req: Request) => {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = formSchema.parse(body);

    const [newForm] = await db.insert(formTemplates).values({
      cycleName: data.cycleName,
      fields: data.fields,
      isActive: data.isActive,
    }).returning();

    return NextResponse.json(newForm);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});
