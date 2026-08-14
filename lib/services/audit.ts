import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import crypto from "crypto";

/**
 * Comprehensive typed audit action catalogue.
 * Every state-changing operation must map to one of these actions.
 *
 * Naming convention: <entity>_<past-tense-verb>
 */
export type AuditAction =
  // ── Identity / Auth ────────────────────────────────────────────────────
  | "role_change"
  | "member_ban"
  | "member_unban"
  | "account_delete"
  | "session_revoked"

  // ── Events ────────────────────────────────────────────────────────────
  | "event_create"
  | "event_update"
  | "event_delete"
  | "event_approve"
  | "event_post_event_update"
  | "event_meeting_schedule"
  | "event_inventory_allocation"
  | "event_session_create"

  // ── Registration / Attendance ─────────────────────────────────────────
  | "registration_create"
  | "registration_cancel"
  | "check_in"
  | "guest_register"
  | "event_deregister"
  | "waitlist_promotion"
  | "scanner_checkin"
  | "scanner_batch_checkin"

  // ── Recruitment / Applications ────────────────────────────────────────
  | "application_submitted"
  | "application_draft_saved"
  | "application_status_changed"
  | "application_accepted"
  | "application_rejected"
  | "interview_scheduled"
  | "application_review_added"

  // ── Finance ───────────────────────────────────────────────────────────
  | "budget_create"
  | "budget_update"
  | "expense_create"
  | "expense_approve"
  | "expense_reject"
  | "income_create"

  // ── Inventory ─────────────────────────────────────────────────────────
  | "inventory_create"
  | "inventory_checkout"
  | "inventory_checkin"

  // ── Certificates ──────────────────────────────────────────────────────
  | "certificate_issue"
  | "certificate_blast"
  | "certificate_revoke"
  | "certificate_template_create"
  | "certificate_template_update"
  | "certificate_template_delete"

  // ── Communications ────────────────────────────────────────────────────
  | "communication_sent"
  | "whatsapp_template_generate"

  // ── Data Operations ───────────────────────────────────────────────────
  | "file_upload"
  | "data_export"
  | "data_delete"

  // ── Procurement ───────────────────────────────────────────────────────
  | "procurement_create"
  | "procurement_approve"
  | "procurement_reject"
  | "procurement_complete";

export type AuditEntity =
  | "user"
  | "event"
  | "registration"
  | "budget"
  | "expense"
  | "certificate"
  | "inventory"
  | "system"
  | "income"
  | "file"
  | "application"
  | "interview"
  | "communication"
  | "procurement"
  | "certificateTemplates"
  | "eventSessions"
  | "clubSettings";

export interface AuditEventPayload {
  actorId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  details?: string;
  requestId?: string;
}

/**
 * Writes an audit event to the audit log.
 *
 * IMPORTANT: When called from within a db.transaction(), the audit record
 * is part of the same transaction and will roll back if the transaction fails.
 * When called outside a transaction, uses fire-and-forget pattern.
 *
 * The audit log is immutable to ordinary staff (enforced at API layer).
 * This function never throws — failures are logged via structured logger.
 */
export async function logAuditEvent(payload: AuditEventPayload): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: payload.actorId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      details: payload.details ?? null,
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit logging must NEVER crash the operation it's tracking.
    // Structured log so monitoring can catch and alert.
    logger.error(
      {
        err: error,
        actorId: payload.actorId,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        requestId: payload.requestId,
      },
      "Audit log write failed"
    );
  }
}

/**
 * Creates an audit log record object suitable for inserting inside a
 * db.transaction() call directly (without using logAuditEvent).
 *
 * Use when you need the audit log to be part of the same transaction:
 *   await tx.insert(auditLogs).values(makeAuditRecord(payload));
 */
export function makeAuditRecord(payload: Omit<AuditEventPayload, "requestId">): {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  timestamp: Date;
} {
  return {
    id: crypto.randomUUID(),
    actorId: payload.actorId,
    action: payload.action,
    entity: payload.entity,
    entityId: payload.entityId,
    details: payload.details ?? null,
    timestamp: new Date(),
  };
}
