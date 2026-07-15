import { withApiHandler } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, user } from "@/lib/db/schema";
import { desc, eq, like, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit
 * Fetches recent audit logs. Requires admin or owner role.
 */
export const GET = withApiHandler(async (req: NextRequest) => {
    await requireRole(["admin", "owner"]);
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;
    const search = url.searchParams.get("search");

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(auditLogs.action, `%${search}%`),
          like(auditLogs.entity, `%${search}%`),
          like(auditLogs.details, `%${search}%`)
        )
      );
    }

    const query = db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .orderBy(desc(auditLogs.timestamp));

    if (conditions.length > 0) {
      query.where(conditions[0]);
    }

    const { sql } = await import("drizzle-orm");
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    if (conditions.length > 0) {
      countQuery.where(conditions[0]);
    }
    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    const logs = await query.limit(limit).offset(offset);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
