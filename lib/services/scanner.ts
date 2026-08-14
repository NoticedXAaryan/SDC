import { checkInScannerDb, batchCheckInScannerDb } from "@/lib/dal/scanner";
import { logAuditEvent } from "@/lib/services/audit";
import { MANAGEMENT_ROLES } from "@/lib/dal/auth";
import type { AuthSession, SDCRole } from "@/lib/dal/auth";
import { AuthorizationError } from "@/lib/api-wrapper";

export class ScannerService {
  static async checkInScanner(session: AuthSession, eventId: string, token: string) {
    const role = session.user.role as SDCRole;
    if (!MANAGEMENT_ROLES.includes(role)) {
      throw new AuthorizationError("You are not authorized to perform check-ins.");
    }

    const { registrationId, payload } = await checkInScannerDb(session, eventId, token);
    
    // Dispatch side-effect
    await logAuditEvent({
      actorId: session.user.id,
      action: "scanner_checkin",
      entity: "registration",
      entityId: registrationId,
      details: `Scanned and checked in user ${payload.userId} for event ${eventId}`
    });

    return { success: true, message: "Successfully checked in!" };
  }

  static async batchCheckInScanner(session: AuthSession, checkIns: any[]) {
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
