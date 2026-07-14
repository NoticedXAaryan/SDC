import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, certificateTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";
import { certificateQueue } from "@/lib/queues/certificates";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireRole(["lead", "co_lead", "admin", "owner"]);
const body = await req.json();
const { email, templateId, eventId } = body;

if (!email || !templateId) {
  return NextResponse.json({ error: "Missing email or templateId" }, { status: 400 });
}

// Find the user by email
const [targetUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
if (!targetUser) {
  return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
}

// Verify template
const [template] = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, templateId)).limit(1);
if (!template) {
  return NextResponse.json({ error: "Template not found" }, { status: 404 });
}

// Enqueue a single job to BullMQ
// eventId is optional in the schema now, but we can pass it if provided
await certificateQueue.add("issue", { 
  userId: targetUser.id, 
  eventId: eventId || null, 
  templateId, 
  issuedBy: session.user.id 
});

await logAuditEvent({
  actorId: session.user.id,
  action: "certificate_issue",
  entity: "certificate",
  entityId: templateId,
  details: `Enqueued certificate generation for ${email} using template ${template.name}`,
});

return NextResponse.json({ 
  success: true, 
  message: `Successfully queued certificate for ${email}.`
});

});
