import { checkInScannerDb, batchCheckInScannerDb } from "@/lib/dal/scanner";
import { logAuditEvent } from "@/lib/services/audit";
import { MANAGEMENT_ROLES } from "@/lib/dal/auth";
import type { AuthSession, SDCRole } from "@/lib/dal/auth";
import { AuthorizationError } from "@/lib/api-wrapper";
import { ValidationError } from "@/lib/api-wrapper";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isEventScannerRole, canManageEvent } from "@/lib/dal/event-access";

async function assertScanAccess(session: AuthSession, eventId: string) {
  if (!isEventScannerRole(session.user.role)) throw new AuthorizationError("You are not authorized to perform check-ins.");
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event || event.deletedAt || event.status !== "published") throw new ValidationError("Event is not open for check-in");
  if (session.user.role !== "volunteer_lead" && !(await canManageEvent(session, event))) {
    throw new AuthorizationError("You do not have permission to check in this event.");
  }
}

export class ScannerService {
  static async checkInScanner(session: AuthSession, eventId: string, token: string) {
    await assertScanAccess(session, eventId);
    const role = session.user.role as SDCRole;
    if (!MANAGEMENT_ROLES.includes(role)) {
      throw new AuthorizationError("You are not authorized to perform check-ins.");
    }

    const { registrationId, payload, alreadyCheckedIn } = await checkInScannerDb(session, eventId, token);
    
    // Dispatch side-effect
    if (!alreadyCheckedIn) {
      await logAuditEvent({
        actorId: session.user.id,
        action: "scanner_checkin",
        entity: "registration",
        entityId: registrationId,
        details: `Scanned and checked in user ${payload.userId} for event ${eventId}`
      });
    }

    return {
      success: true,
      alreadyCheckedIn,
      message: alreadyCheckedIn ? "Already checked in" : "Successfully checked in!",
    };
  }

  static async batchCheckInScanner(session: AuthSession, checkIns: any[]) {
    if (!Array.isArray(checkIns) || checkIns.length > 1000) throw new ValidationError("Provide at most 1000 check-ins.");
    for (const eventId of new Set(checkIns.map(item => item?.eventId))) {
      if (typeof eventId !== "string") throw new ValidationError("Every check-in needs an event.");
      await assertScanAccess(session, eventId);
    }
    const role = session.user.role as SDCRole;
    if (!MANAGEMENT_ROLES.includes(role)) {
      throw new AuthorizationError("You are not authorized to perform batch check-ins.");
    }

    const { results, checkedInCount, idsToUpdateLength } = await batchCheckInScannerDb(session, checkIns);
    
    if (idsToUpdateLength > 0) {
      await logAuditEvent({
        actorId: session.user.id,
        action: "scanner_batch_checkin",
        entity: "event",
        entityId: "batch",
        details: `Batch synced ${idsToUpdateLength} check-ins offline`
      });
    }

    return { success: true, results, checkedInCount };
  }
}
