import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * STC OS role hierarchy.
 * Used for comparison and display throughout the app.
 */
export const SDC_ROLES = [
  "applicant",
  "alumni", 
  "member", 
  "faculty_coordinator",
  "co_lead", 
  "volunteer_lead",
  "finance_lead", 
  "tech_lead",
  "marketing_lead",
  "content_lead",
  "event_lead",
  "vice_lead",
  "lead", 
  "admin", 
  "owner"
] as const;
export type SDCRole = (typeof SDC_ROLES)[number];

/** Roles that can access management features (scanner, certificates, finance, audit) */
export const MANAGEMENT_ROLES: SDCRole[] = [
  "co_lead", 
  "volunteer_lead",
  "finance_lead", 
  "tech_lead",
  "marketing_lead",
  "content_lead",
  "event_lead",
  "faculty_coordinator",
  "vice_lead",
  "lead", 
  "admin", 
  "owner"
];

/** Roles that can perform admin operations (member management, role changes) */
export const ADMIN_ROLES: SDCRole[] = ["vice_lead", "lead", "admin", "owner"];

/**
 * Extended session user type that includes our custom fields.
 * Better Auth's admin plugin adds `role` to the user object in sessions.
 */
export type SessionUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role: SDCRole;
  username?: string | null;
  points?: number | null;
  level?: number | null;
  banned?: boolean;
};

export type AuthSession = {
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    userId: string;
  };
  user: SessionUser;
};

/**
 * Requires an active session. Redirects to /login if not authenticated.
 * This is the primary guard for all authenticated pages.
 */
export async function requireSession(): Promise<AuthSession> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session) {
    redirect("/login");
  }
  
  return session as unknown as AuthSession;
}

/**
 * Get current session without redirecting. Returns null if not authenticated.
 * Useful for conditional UI rendering.
 */
export async function getCurrentUser(): Promise<AuthSession | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    return session ? (session as unknown as AuthSession) : null;
  } catch {
    return null;
  }
}

/**
 * Requires the user to have one of the specified roles.
 * Throws AuthorizationError if the user's role is not in the allowed list.
 * 
 * The role comes from the session (populated by Better Auth's admin plugin),
 * so no additional DB query is needed.
 */
export async function requireRole(roles: SDCRole[]) {
  const session = await requireSession();
  const userRole = (session.user.role || "applicant") as SDCRole;

  if (!roles.includes(userRole)) {
    throw new AuthorizationError(`Role '${userRole}' is not authorized. Required: ${roles.join(", ")}`);
  }

  return session;
}

/** Requires owner or admin role */
export async function requireAdmin() {
  return requireRole(ADMIN_ROLES);
}

/** Requires at least lead-level access */
export async function requireLead() {
  return requireRole(["lead", "admin", "owner"]);
}

/** Requires finance or admin access */
export async function requireFinanceLead() {
  return requireRole(["finance_lead", "admin", "owner"]);
}

/**
 * Check if a role has management-level access (for conditional UI).
 * Does NOT fetch session — use with a role you already have.
 */
export function isManagementRole(role: string): boolean {
  return MANAGEMENT_ROLES.includes(role as SDCRole);
}

/**
 * State machine guard for entity status transitions.
 * Evaluates whether a role can transition an entity from one status to another.
 */
export function canTransition(
  role: SDCRole,
  entityType: "event" | "expense" | "resourceRequest" | "contentItem" | "application",
  fromStatus: string,
  toStatus: string
): boolean {
  // Admins and owners can do anything
  if (ADMIN_ROLES.includes(role)) return true;

  const isCoLead = role === "co_lead";

  // "Executed" statuses that a co-lead can NEVER transition an entity to
  const executedStatuses = ["published", "approved", "fulfilled", "posted"];
  if (isCoLead && executedStatuses.includes(toStatus)) {
    return false;
  }

  // Domain leads can generally transition things (they are in MANAGEMENT_ROLES but not ADMIN_ROLES)
  // For specific sub-rules (like finance_lead vs event_lead), we could expand this logic.
  // Currently, the primary requirement is blocking co_leads from final approval.
  return true;
}

/**
 * Checks if the club operations are currently frozen by faculty.
 * If frozen, throws AuthorizationError (403 Club Operations Frozen) 
 * unless the user is an admin, owner, or faculty_coordinator.
 */
export async function checkEmergencyFreeze(role?: string) {
  if (role && ["admin", "owner", "faculty_coordinator"].includes(role)) {
    return;
  }

  const { db } = await import("@/lib/db");
  const { clubSettings } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const [settings] = await db.select().from(clubSettings).where(eq(clubSettings.id, "default")).limit(1);
  if (settings?.isFrozen) {
    throw new AuthorizationError("Club Operations Frozen");
  }
}

