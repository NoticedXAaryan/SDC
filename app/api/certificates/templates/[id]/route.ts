import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { z } from "zod";
import { logAuditEvent } from "@/lib/services/audit";
import { CERTIFICATE_DESIGNER_ROLES } from "@/lib/domain/certificate";

const updateTemplateSchema = z.object({
  schemas: z.array(z.array(z.record(z.string(), z.unknown()))),
  basePdf: z.string().min(1),
});

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
const { id } = await params;
const session = await requireRole([...CERTIFICATE_DESIGNER_ROLES]);
    
    

const template = await db.query.certTemplates.findFirst({ where: eq(certTemplates.id, id) });
if (!template) return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
if (!["owner", "admin", "lead"].includes(session.user.role) && template.createdBy !== session.user.id) {
  throw new AuthorizationError("Only the template owner or an administrator may edit this template");
}

const { schemas, basePdf } = updateTemplateSchema.parse(await req.json().catch(() => ({})));

await db.update(certTemplates)
  .set({ fields: schemas, backgroundUrl: basePdf, version: sql`${certTemplates.version} + 1` })
  .where(eq(certTemplates.id, id));

await logAuditEvent({
  actorId: session.user.id,
  action: "certificate_template_update",
  entity: "certificateTemplates",
  entityId: id,
  details: JSON.stringify({ previousVersion: template.version }),
});

return NextResponse.json({ success: true });
});

export const GET = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await requireRole([...CERTIFICATE_DESIGNER_ROLES]);
  
  const templateRows = await db.select().from(certTemplates).where(eq(certTemplates.id, id)).limit(1);
  const template = templateRows[0];
  
  if (!template) {
    return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, template });
}, { requireRateLimit: false });
