import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, getUserDomain, requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";
import { createCertTemplateSchema } from "@/lib/validators/certificate";
import { logAuditEvent } from "@/lib/services/audit";
import { canDesignCertificates, canDesignCertificatesAcrossDomains } from "@/lib/domain/certificate";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
    const session = await requireSession();
    const userRole = session.user.role || "member";
    if (!canDesignCertificates(userRole as string)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const templates = await db.query.certTemplates.findMany({
      orderBy: (templates, { desc }) => [desc(templates.createdAt)]
    });
    return NextResponse.json({ success: true, templates });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
    
    
  const userRole = session.user.role || "member";
  if (!canDesignCertificates(userRole as string)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createCertTemplateSchema.safeParse({
    ...body,
    backgroundUrl: body.backgroundUrl ?? body.basePdf,
    fields: body.fields ?? [[]],
  });
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message || "Invalid template");
  const { name, eventId, backgroundUrl, fields } = parsed.data;

  if (eventId) {
    const linkedEvent = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!linkedEvent) throw new ValidationError("Event not found");
    if (linkedEvent.certificateTemplateId) {
      throw new ValidationError("This event already has a certificate template. Open the existing design instead.");
    }
    if (!canDesignCertificatesAcrossDomains(userRole as string)) {
      const domain = await getUserDomain(session.user.id, userRole);
      if (linkedEvent.domain && linkedEvent.domain !== domain) {
        return NextResponse.json({ success: false, error: "Event is outside your domain" }, { status: 403 });
      }
    }
  }

  const template = await db.transaction(async (tx) => {
    const [createdTemplate] = await tx.insert(certTemplates).values({
      name,
      eventId: eventId || null,
      backgroundUrl,
      fields,
      createdBy: session.user.id
    }).returning();

    if (eventId) {
      await tx.update(events)
        .set({ certificateTemplateId: createdTemplate.id, updatedAt: new Date() })
        .where(eq(events.id, eventId));
    }

    return createdTemplate;
  });

  await logAuditEvent({
    actorId: session.user.id,
    action: "certificate_template_create",
    entity: "certificateTemplates",
    entityId: template.id,
    details: JSON.stringify({ eventId: eventId || null, name }),
  });

  return NextResponse.json({ success: true, id: template.id, template }, { status: 201 });
});
