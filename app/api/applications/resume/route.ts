import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import { db } from "@/lib/db";
import { applicationDocuments, applications, formTemplates, user } from "@/lib/db/schema";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";
import { recruitmentFieldsSchema } from "@/lib/recruitment-form";

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  if (Number(req.headers.get("content-length")) > 2 * 1024 * 1024 + 16384) throw new ValidationError("Choose a PDF smaller than 2 MB.");
  const data = await req.formData();
  const file = data.get("file");
  const cycle = data.get("cycle");
  if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024) throw new ValidationError("Choose a PDF smaller than 2 MB.");
  const [form] = await db.select().from(formTemplates).where(eq(formTemplates.isActive, true)).orderBy(desc(formTemplates.updatedAt)).limit(1);
  const fields = recruitmentFieldsSchema.safeParse(form?.fields);
  if (!form || form.cycleName !== cycle || !fields.success || !fields.data.some(field => field.type === "file")) throw new ValidationError("This recruitment round isn't accepting résumés. Reload the application.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if ((await fileTypeFromBuffer(buffer))?.mime !== "application/pdf") throw new ValidationError("This file isn't a PDF. Export your résumé as a PDF and try again.");
  const name = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 140) || "resume.pdf";
  const document = await db.transaction(async tx => {
    // Serialize with submission so a submitted résumé cannot be replaced after review starts.
    await tx.execute(sql`select id from ${user} where id = ${session.user.id} for update`);
    const [existing] = await tx.select({ status: applications.status }).from(applications).where(and(eq(applications.userId, session.user.id), eq(applications.applicationCycle, form.cycleName))).limit(1);
    if (existing && existing.status !== "draft") throw new ValidationError("Your application has already been submitted. Its résumé can no longer be changed.");
    const [saved] = await tx.insert(applicationDocuments).values({ userId: session.user.id, cycle: form.cycleName, name, size: buffer.length, content: buffer.toString("base64") })
      .onConflictDoUpdate({ target: [applicationDocuments.userId, applicationDocuments.cycle], set: { name, size: buffer.length, content: buffer.toString("base64"), updatedAt: new Date() } })
      .returning({ id: applicationDocuments.id, name: applicationDocuments.name, size: applicationDocuments.size });
    return saved;
  });
  return NextResponse.json(document, { headers: { "Cache-Control": "no-store" } });
}, { rateLimitPrefix: "membership-resume" });
