import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import { memberSearchSchema, roleChangeSchema } from "@/lib/validators/member";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members — List members with search, filter, pagination
 * Requires admin or owner role.
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireAdmin();

  const url = new URL(req.url);
  const params = memberSearchSchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    search: url.searchParams.get("search"),
    role: url.searchParams.get("role"),
    year: url.searchParams.get("year"),
    sortBy: url.searchParams.get("sortBy"),
    sortOrder: url.searchParams.get("sortOrder"),
  });

  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: params.error.flatten() },
      { status: 400 }
    );
  }

  const { page, limit, search, role, year, sortBy, sortOrder } = params.data;
  const offset = (page - 1) * limit;

  // Build query conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        ilike(user.name, `%${search}%`),
        ilike(user.email, `%${search}%`),
        ilike(user.username, `%${search}%`)
      )
    );
  }
  
  if (role) {
    conditions.push(eq(user.role, role));
  }
  
  if (year) {
    conditions.push(eq(user.year, year));
  }

  // Build the query
  let query = db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    username: user.username,
    year: user.year,
    branch: user.branch,
    points: user.points,
    level: user.level,
    banned: user.banned,
    createdAt: user.createdAt,
    image: user.image,
  }).from(user);

  // Apply conditions
  if (conditions.length > 0) {
    for (const condition of conditions) {
      if (condition) {
        query = query.where(condition) as typeof query;
      }
    }
  }

  // Apply sorting
  const sortColumn = {
    name: user.name,
    createdAt: user.createdAt,
    points: user.points,
    role: user.role,
  }[sortBy] ?? user.createdAt;

  const orderFn = sortOrder === "asc" ? asc : desc;
  query = query.orderBy(orderFn(sortColumn)) as typeof query;

  // Get total count for pagination
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(user);
  const total = Number(countResult[0]?.count ?? 0);

  // Apply pagination
  const members = await (query as any).limit(limit).offset(offset);

  return NextResponse.json({
    members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}, { requireRateLimit: false });

export const PATCH = withApiHandler(async (req: NextRequest) => {
const session = await requireAdmin();
const body = await req.json();

const parsed = roleChangeSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid input", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { userId, role: newRole } = parsed.data;

// Prevent self-demotion
if (userId === session.user.id && newRole !== session.user.role) {
  return NextResponse.json(
    { error: "Cannot change your own role. Ask another admin." },
    { status: 400 }
  );
}

// Get target user
const [targetUser] = await db.select({ id: user.id, role: user.role, name: user.name })
  .from(user)
  .where(eq(user.id, userId))
  .limit(1);

if (!targetUser) {
  return NextResponse.json({ error: "User not found" }, { status: 404 });
}

// Only owners can create other owners
if (newRole === "owner" && session.user.role !== "owner") {
  return NextResponse.json(
    { error: "Only owners can promote to owner" },
    { status: 403 }
  );
}

// Cannot demote an owner unless you are also an owner
if (targetUser.role === "owner" && session.user.role !== "owner") {
  return NextResponse.json(
    { error: "Cannot change an owner's role. Only another owner can do this." },
    { status: 403 }
  );
}

const previousRole = targetUser.role;

// Update role
await db.update(user)
  .set({ role: newRole, updatedAt: new Date() })
  .where(eq(user.id, userId));

// Audit log
await logAuditEvent({
  actorId: session.user.id,
  action: "role_change",
  entity: "user",
  entityId: userId,
  details: `Role changed from '${previousRole}' to '${newRole}' for ${targetUser.name}`,
});

return NextResponse.json({
  success: true,
  message: `${targetUser.name}'s role updated to ${newRole}`,
  previousRole,
  newRole,
});

});
