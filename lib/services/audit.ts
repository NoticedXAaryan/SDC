import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
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
  | "data_delete"
  | "certificate_blast"
  | "certificate_template_create"
  | "certificate_template_update"
  | "certificate_template_delete"
  | "certificate_revoke"
  | "event_session_create"
  | "event_approve"
  | "event_post_event_update"
  | "event_meeting_schedule"
  | "event_inventory_allocation"
  | "guest_register"
  | "event_deregister"
  | "whatsapp_template_generate";

export type AuditEntity = "user" | "event" | "registration" | "budget" | "expense" | "certificate" | "inventory" | "system" | "income" | "file" | "certificateTemplates" | "eventSessions" | "clubSettings";

/**
 * Log an action to the audit trail.
 * Called from all state-changing operations across the system.
 * 
 * Uses fire-and-forget pattern — audit logging should never crash
 * the operation it's tracking.
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
    // Log via Pino (structured JSON) so monitoring can catch it.
    logger.error({ err: error, actorId, action, entity, entityId }, "Failed to write audit log");
  }
}
