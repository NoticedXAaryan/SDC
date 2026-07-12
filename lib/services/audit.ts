import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import crypto from "crypto";

export type AuditAction =
  | "role_change"
  | "member_ban"
  | "member_unban"
  | "event_create"
  | "event_update"
  | "event_delete"
  | "registration_create"
  | "registration_cancel"
  | "check_in"
  | "budget_create"
  | "budget_update"
  | "expense_create"
  | "expense_approve"
  | "expense_reject"
  | "certificate_issue"
  | "inventory_checkout"
  | "inventory_checkin"
  | "inventory_create"
  | "income_create"
  | "file_upload"
  | "data_export"
  | "data_delete";

export type AuditEntity = "user" | "event" | "registration" | "budget" | "expense" | "certificate" | "inventory" | "system" | "income" | "file";

/**
 * Log an action to the audit trail.
 * Called from all state-changing operations across the system.
 */
export async function logAuditEvent({
  actorId,
  action,
  entity,
  entityId,
  details,
}: {
  actorId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  details?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId,
      action,
      entity,
      entityId,
      details: details ?? null,
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit logging should never crash the operation it's tracking.
    // Log to console as a fallback — this is a monitoring concern.
    console.error("[AUDIT] Failed to write audit log:", error, {
      actorId,
      action,
      entity,
      entityId,
    });
  }
}
