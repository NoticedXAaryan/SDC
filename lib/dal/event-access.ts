import { AuthorizationError } from "@/lib/api-wrapper";
import { getUserDomain, type AuthSession } from "@/lib/dal/auth";
import type { events } from "@/lib/db/schema";

export const EVENT_MANAGEMENT_ROLES = [
  "owner",
  "admin",
  "lead",
  "co_lead",
  "event_lead",
] as const;

export const EVENT_SCANNER_ROLES = [
  "owner",
  "admin",
  "lead",
  "co_lead",
  "event_lead",
  "volunteer_lead",
] as const;

type EventAccessRecord = Pick<
  typeof events.$inferSelect,
  "id" | "createdBy" | "domain"
>;

export function isEventManagementRole(role: string): boolean {
  return EVENT_MANAGEMENT_ROLES.includes(
    role as (typeof EVENT_MANAGEMENT_ROLES)[number],
  );
}

export function isEventScannerRole(role: string): boolean {
  return EVENT_SCANNER_ROLES.includes(
    role as (typeof EVENT_SCANNER_ROLES)[number],
  );
}

/**
 * Event ownership policy shared by management pages and event APIs.
 *
 * Owners/admins and the event lead operate across the club. The club lead can
 * operate inside their assigned domain. Co-leads can operate events they own.
 */
export async function canManageEvent(
  session: AuthSession,
  event: EventAccessRecord,
): Promise<boolean> {
  const role = session.user.role as string;

  if (["owner", "admin", "event_lead"].includes(role)) return true;
  if (event.createdBy === session.user.id) return true;
  if (role !== "lead") return false;

  const userDomain = await getUserDomain(session.user.id, role);
  return Boolean(userDomain && event.domain === userDomain);
}

export async function assertCanManageEvent(
  session: AuthSession,
  event: EventAccessRecord,
): Promise<void> {
  if (!(await canManageEvent(session, event))) {
    throw new AuthorizationError("You do not have permission to manage this event");
  }
}
