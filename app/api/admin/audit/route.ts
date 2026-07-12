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
export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin", "owner"]);
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
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
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);

    const logs = await (conditions.length > 0 ? query.where(conditions[0]) : query);

    return NextResponse.json(logs);
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Audit GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
