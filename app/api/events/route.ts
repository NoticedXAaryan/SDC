import { NextResponse, NextRequest } from "next/server";
import { requireSession, requireRole, isManagementRole, getUserDomain } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, ilike, desc, asc, sql, and, gte, lte } from "drizzle-orm";
import { createEventSchema, eventSearchSchema } from "@/lib/validators/event";
import { logAuditEvent } from "@/lib/services/audit";
import { aiQueue } from "@/lib/queues/ai";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/events — List events with filters and pagination
 * Requires authentication.
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const isManagement = isManagementRole(session.user.role as string);
  const isAdmin = ["admin", "owner"].includes(session.user.role as string);

  // Get user domain if they are a siloed lead
  let userDomain: string | null = null;
  if (isManagement && !isAdmin) {
    userDomain = await getUserDomain(session.user.id, session.user.role as string);
  }

  const url = new URL(req.url);
  const params = eventSearchSchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    search: url.searchParams.get("search"),
    type: url.searchParams.get("type"),
    status: url.searchParams.get("status"),
    domain: url.searchParams.get("domain"),
    upcoming: url.searchParams.get("upcoming"),
  });

  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: params.error.flatten() },
      { status: 400 }
    );
  }

  const { page, limit, search, type, status, domain, upcoming } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(ilike(events.title, `%${search}%`));
  }
  if (type) {
    conditions.push(eq(events.type, type));
  }
  if (!isManagement) {
    conditions.push(eq(events.status, "published"));
  } else if (status) {
    conditions.push(eq(events.status, status));
  }
  if (userDomain) {
    conditions.push(eq(events.domain, userDomain));
  } else if (domain) {
    conditions.push(eq(events.domain, domain));
  }
  if (upcoming) {
    conditions.push(gte(events.startsAt, new Date()));
  }

  let query = db.select().from(events);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(events);

  if (conditions.length > 0) {
    const combinedCondition = and(...conditions);
    query = query.where(combinedCondition) as typeof query;
    countQuery = countQuery.where(combinedCondition) as typeof countQuery;
  }

  const allEvents = await (query as any)
    .orderBy(desc(events.startsAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await countQuery;

  return NextResponse.json({
    events: allEvents,
    pagination: {
      page,
      limit,
      total: Number(countResult.count),
      totalPages: Math.ceil(Number(countResult.count) / limit),
    },
  });
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireRole(["lead", "co_lead", "admin", "owner"]);

const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
await checkEmergencyFreeze(session.user.role as string);

const body = await req.json();
const parsed = createEventSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid event data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const data = parsed.data;

// Generate slug from title
const slug = data.title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  + "-" + crypto.randomBytes(3).toString("hex");

const eventId = crypto.randomUUID();

await db.insert(events).values({
  id: eventId,
  title: data.title,
  slug,
  type: data.type,
  domain: data.domain || null,
  description: data.description,
  location: data.location || null,
  capacity: data.capacity || null,
  startsAt: new Date(data.startsAt),
  endsAt: new Date(data.endsAt),
  registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
  isPaid: data.isPaid,
  price: data.price ? String(data.price) : null,
  visibility: data.visibility,
  coverImage: data.coverImage || null,
  isInternal: data.isInternal || false,
  status: ["lead", "co_lead", "vice_lead", "volunteer_lead"].includes(session.user.role as string) ? "draft" : "published",
  metadata: {
    approvalStatus: ["lead", "co_lead", "vice_lead", "volunteer_lead"].includes(session.user.role as string) ? "pending" : "approved",
    attendanceEstimates: data.attendanceEstimates || null,
  },
  createdBy: session.user.id,
});

// Trigger default tasks generation
const { createDefaultEventTasks } = await import("@/lib/services/tasks");
await createDefaultEventTasks(eventId, data.type || "workshop", data.isInternal || false);

await logAuditEvent({
  actorId: session.user.id,
  action: "event_create",
  entity: "event",
  entityId: eventId,
  details: `Created event: ${data.title}`,
});

// Enqueue AI job to draft comms (WhatsApp & Email)
await aiQueue.add("draft_event_comms", {
  eventId,
  eventDetails: {
    title: data.title,
    type: data.type,
    description: data.description,
    startsAt: data.startsAt,
    location: data.location,
    isInternal: data.isInternal,
  }
});

return NextResponse.json({ success: true, id: eventId, slug }, { status: 201 });

});
