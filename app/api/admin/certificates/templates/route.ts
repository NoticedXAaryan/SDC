import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certTemplates } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";

const fieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number(),
  y: z.number(),
  fontSize: z.number(),
  color: z.string()
});

const templateSchema = z.object({
  name: z.string().min(1),
  eventId: z.string().nullable().optional(),
  backgroundUrl: z.string().url(),
  fields: z.array(fieldSchema)
});

export const POST = withApiHandler(async (req: Request) => {
    const session = await requireAdmin();
    const body = await req.json();
    const data = templateSchema.parse(body);

    const [newTemplate] = await db.insert(certTemplates).values({
      name: data.name,
      eventId: data.eventId || null,
      backgroundUrl: data.backgroundUrl,
      fields: data.fields,
      createdBy: session.user.id,
    }).returning();

    return NextResponse.json(newTemplate);
});
