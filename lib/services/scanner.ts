import { checkInScannerDb, batchCheckInScannerDb } from "@/lib/dal/scanner";
import { logAuditEvent } from "@/lib/services/audit";
import type { AuthSession } from "@/lib/dal/auth";

export class ScannerService {
  static async checkInScanner(session: AuthSession, eventId: string, token: string, scannedFaceDescriptor?: number[]) {
    const { registrationId, payload } = await checkInScannerDb(session, eventId, token, scannedFaceDescriptor);
    
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
