import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, certificateTemplates } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { certificateQueue } from "@/lib/queues/certificates";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
try {
const session = await requireRole(["admin", "owner"]);

const body = await req.json().catch(() => ({}));
const { templateId, userIds } = body;

if (!templateId || !Array.isArray(userIds) || userIds.length === 0) {
  return NextResponse.json({ error: "Missing templateId or userIds array" }, { status: 400 });
}

const template = await db.query.certificateTemplates.findFirst({
  where: eq(certificateTemplates.id, templateId),
});

if (!template) {
  return NextResponse.json({ error: "Template not found" }, { status: 404 });
}

// Fetch the target users
const targetUsers = await db.select({
  id: user.id,
  name: user.name,
  email: user.email,
}).from(user).where(inArray(user.id, userIds));

if (targetUsers.length === 0) {
  return NextResponse.json({ message: "No valid users found for the given IDs." }, { status: 400 });
}

// Since this is a standalone blast, eventId is null/system
const eventId = "SYSTEM_BLAST";

const jobs = targetUsers.map(u => ({
  name: "generate-certificate",
  data: {
    userId: u.id,
    eventId,
    templateId,
    issuedBy: session.user.id,
    userName: u.name,
    userEmail: u.email,
  },
}));

await certificateQueue.addBulk(jobs);

await logAuditEvent({
  actorId: session.user.id,
  action: "certificate_blast",
  entity: "certificateTemplates",
  entityId: templateId,
  details: `Blasted certificate template to ${jobs.length} users.`,
});

return NextResponse.json({
  success: true,
  message: `Successfully queued ${jobs.length} certificates for generation.`,
});
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Certificate Blast POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
