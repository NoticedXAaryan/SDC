import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, session as sessionTable, user } from "@/lib/db/schema";
import {
  ADMIN_ROLES,
  AuthorizationError,
  type AuthSession,
  type SDCRole,
} from "@/lib/dal/auth";
import { NotFoundError, ValidationError } from "@/lib/api-wrapper";
import { makeAuditRecord } from "@/lib/services/audit";
import type {
  MemberDeleteInput,
  MemberLifecycleInput,
  MemberSearchParams,
  RoleChangeInput,
} from "@/lib/validators/member";

const EXECUTIVE_ROLES = new Set<SDCRole>(["owner", "admin"]);
const LEADERSHIP_ROLES: SDCRole[] = [
  "owner", "admin", "lead", "vice_lead", "faculty_coordinator",
  "event_lead", "content_lead", "marketing_lead", "tech_lead",
  "finance_lead", "volunteer_lead", "co_lead",
];

const memberSelection = {
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
  banReason: user.banReason,
  banExpires: user.banExpires,
  createdAt: user.createdAt,
  image: user.image,
};

function assertAdmin(session: AuthSession) {
  if (!ADMIN_ROLES.includes(session.user.role)) {
    throw new AuthorizationError("Admin or owner access is required.");
  }
}
async function getTargetMember(userId: string) {
  const [target] = await db
    .select(memberSelection)
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) throw new NotFoundError("Member not found.");
  return target;
}

function assertCanManageTarget(session: AuthSession, target: Awaited<ReturnType<typeof getTargetMember>>) {
  if (session.user.id === target.id) {
    throw new ValidationError("You cannot perform this action on your own account.");
  }

  if (
    session.user.role !== "owner" &&
    EXECUTIVE_ROLES.has(target.role as SDCRole)
  ) {
    throw new AuthorizationError("Only an owner can manage owner or admin accounts.");
  }
}

async function assertOwnerWillRemain(targetRole: string | null, nextRole?: SDCRole) {
  if (targetRole !== "owner" || nextRole === "owner") return;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.role, "owner"));

  if (Number(result?.count ?? 0) <= 1) {
    throw new ValidationError("The final owner account cannot be demoted or removed.");
  }
}

export async function listMembers(session: AuthSession, params: MemberSearchParams) {
  assertAdmin(session);
  const { page, limit, search, role, year, sortBy, sortOrder } = params;
  const conditions = [];

  if (search) {
    conditions.push(or(
      ilike(user.name, `%${search}%`),
      ilike(user.email, `%${search}%`),
      ilike(user.username, `%${search}%`),
    ));
  }
  if (role) conditions.push(eq(user.role, role));
  if (year) conditions.push(eq(user.year, year));

  const filter = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn = {
    name: user.name,
    createdAt: user.createdAt,
    points: user.points,
    role: user.role,
  }[sortBy];
  const orderFn = sortOrder === "asc" ? asc : desc;

  const membersQuery = db.select(memberSelection).from(user);
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(user);
  const filteredMembers = filter ? membersQuery.where(filter) : membersQuery;
  const filteredCount = filter ? countQuery.where(filter) : countQuery;

  const [members, countResult] = await Promise.all([
    filteredMembers
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit),
    filteredCount,
  ]);
  const total = Number(countResult[0]?.count ?? 0);

  return {
    members,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMemberManagementOverview(session: AuthSession) {
  assertAdmin(session);
  const [{ members, pagination }, roleStats, allLeads] = await Promise.all([
    listMembers(session, {
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    db.select({ role: user.role, count: sql<number>`count(*)` })
      .from(user)
      .groupBy(user.role),
    db.select({ id: user.id, name: user.name, role: user.role, image: user.image })
      .from(user)
      .where(sql`${user.role} IN (${sql.join(LEADERSHIP_ROLES.map((role) => sql`${role}`), sql`, `)})`),
  ]);

  return { members, total: pagination.total, roleStats, allLeads };
}

export async function changeMemberRole(session: AuthSession, input: RoleChangeInput) {
  assertAdmin(session);
  const target = await getTargetMember(input.userId);

  if (target.role === input.role) {
    return { member: target, previousRole: target.role, newRole: input.role };
  }

  assertCanManageTarget(session, target);
  if (input.role === "owner" || input.role === "admin") {
    if (session.user.role !== "owner") {
      throw new AuthorizationError("Only an owner can assign executive roles.");
    }
  }
  await assertOwnerWillRemain(target.role, input.role);

  const [updated] = await db.transaction(async (tx) => {
    const changed = await tx.update(user)
      .set({ role: input.role, updatedAt: new Date() })
      .where(eq(user.id, input.userId))
      .returning(memberSelection);
    await tx.delete(sessionTable).where(eq(sessionTable.userId, input.userId));
    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: session.user.id,
      action: "role_change",
      entity: "user",
      entityId: input.userId,
      details: JSON.stringify({ previousRole: target.role, newRole: input.role }),
    }));
    return changed;
  });

  return { member: updated, previousRole: target.role, newRole: input.role };
}

export async function applyMemberLifecycleAction(
  session: AuthSession,
  userId: string,
  input: MemberLifecycleInput,
) {
  assertAdmin(session);
  const target = await getTargetMember(userId);
  assertCanManageTarget(session, target);

  if (input.action === "update") {
    const username = input.username === undefined
      ? undefined
      : input.username?.trim() || null;

    if (username) {
      const [existing] = await db.select({ id: user.id })
        .from(user)
        .where(and(eq(user.username, username), ne(user.id, userId)))
        .limit(1);
      if (existing) throw new ValidationError("That username is already in use.");
    }

    const updates = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.username !== undefined ? { username } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.branch !== undefined
        ? { branch: input.branch?.trim() || null }
        : {}),
      updatedAt: new Date(),
    };

    const [updated] = await db.transaction(async (tx) => {
      const changed = await tx.update(user)
        .set(updates)
        .where(eq(user.id, userId))
        .returning(memberSelection);
      await tx.insert(auditLogs).values(makeAuditRecord({
        actorId: session.user.id,
        action: "member_update",
        entity: "user",
        entityId: userId,
        details: JSON.stringify({ fields: Object.keys(updates).filter((key) => key !== "updatedAt") }),
      }));
      return changed;
    });
    return { member: updated, message: "Member profile updated." };
  }

  if (input.action === "revoke_sessions") {
    await db.transaction(async (tx) => {
      await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
      await tx.insert(auditLogs).values(makeAuditRecord({
        actorId: session.user.id,
        action: "session_revoked",
        entity: "user",
        entityId: userId,
        details: "All active sessions revoked by an administrator.",
      }));
    });
    return { member: target, message: "All active sessions revoked." };
  }

  if (input.action === "ban") {
    const banExpires = input.durationSeconds
      ? new Date(Date.now() + input.durationSeconds * 1000)
      : null;
    const [updated] = await db.transaction(async (tx) => {
      const changed = await tx.update(user)
        .set({
          banned: true,
          banReason: input.reason,
          banExpires,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning(memberSelection);
      await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
      await tx.insert(auditLogs).values(makeAuditRecord({
        actorId: session.user.id,
        action: "member_ban",
        entity: "user",
        entityId: userId,
        details: JSON.stringify({ reason: input.reason, banExpires }),
      }));
      return changed;
    });
    return { member: updated, message: banExpires ? "Member temporarily banned." : "Member permanently banned." };
  }

  const [updated] = await db.transaction(async (tx) => {
    const changed = await tx.update(user)
      .set({ banned: false, banReason: null, banExpires: null, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning(memberSelection);
    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: session.user.id,
      action: "member_unban",
      entity: "user",
      entityId: userId,
      details: "Account access restored by an administrator.",
    }));
    return changed;
  });
  return { member: updated, message: "Member unbanned." };
}

export async function deleteMemberAccount(
  session: AuthSession,
  userId: string,
  input: MemberDeleteInput,
) {
  assertAdmin(session);
  if (session.user.role !== "owner") {
    throw new AuthorizationError("Only an owner can permanently delete accounts.");
  }
  if (input.confirmUserId !== userId) {
    throw new ValidationError("Account deletion confirmation did not match.");
  }

  const target = await getTargetMember(userId);
  assertCanManageTarget(session, target);
  await assertOwnerWillRemain(target.role);

  await db.transaction(async (tx) => {
    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: session.user.id,
      action: "account_delete",
      entity: "user",
      entityId: userId,
      details: JSON.stringify({ name: target.name, email: target.email, role: target.role }),
    }));
    await tx.delete(user).where(eq(user.id, userId));
  });

  return { success: true, message: "Account permanently deleted." };
}
