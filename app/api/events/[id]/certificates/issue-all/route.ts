import { NextRequest, NextResponse } from "next/server";
import { requireRole, getUserDomain, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, certificates, certificateTemplates, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { certificateQueue } from "@/lib/queues/certificates";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
const session = await requireRole(["co_lead", "lead", "admin", "owner"]);
const { id: eventId } = await params;

const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

const isAdmin = ["admin", "owner"].includes(session.user.role as string);
if (!isAdmin) {
  const userDomain = await getUserDomain(session.user.id, session.user.role as string);
  if (event.domain !== userDomain) {
    return NextResponse.json({ error: "Forbidden: Event is outside your domain" }, { status: 403 });
  }
}

const reqBody = await req.json().catch(() => ({}));
const templateId = reqBody.templateId;

if (!templateId) {
  return NextResponse.json({ error: "Missing templateId in body" }, { status: 400 });
}

const template = await db.query.certificateTemplates.findFirst({
  where: eq(certificateTemplates.id, templateId),
});

if (!template) {
  return NextResponse.json({ error: "Template not found" }, { status: 404 });
}

// Fetch all checked_in attendees with user data via manual join
const attendees = await db
  .select({
    userId: registrations.userId,
    userName: user.name,
    userEmail: user.email,
  })
  .from(registrations)
  .innerJoin(user, eq(registrations.userId, user.id))
  .where(
    and(
      eq(registrations.eventId, eventId),
      eq(registrations.status, "checked_in")
    )
  );

if (attendees.length === 0) {
  return NextResponse.json({ message: "No checked-in attendees found to issue certificates to." }, { status: 200 });
}

// Queue jobs
const jobs = attendees.map(reg => ({
  name: "generate-certificate",
  data: {
    userId: reg.userId,
    eventId,
    templateId,
    issuedBy: session.user.id,
    userName: reg.userName,
    userEmail: reg.userEmail,
  },
}));

await certificateQueue.addBulk(jobs);

return NextResponse.json({
  success: true,
  message: `Successfully queued ${jobs.length} certificates for generation.`,
});
} catch (error: any) {
console.error("[Certificates Issue-All]:", error);
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
