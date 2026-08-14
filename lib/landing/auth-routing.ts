export type UserRole = "Attendee" | "Volunteer" | "Faculty" | "Admin" | "Lead";

export type DashboardPath =
  | "/dashboard/admin"
  | "/dashboard/volunteer"
  | "/dashboard/user";

export interface Viewer {
  authenticated: boolean;
  role: UserRole | null;
  dashboardPath: DashboardPath | null;
  image?: string | null;
  name?: string | null;
}

export interface ViewerSession {
  user: { role?: unknown; image?: string | null; name?: string } | null;
}

const USER_ROLES = new Set<UserRole>([
  "Attendee",
  "Volunteer",
  "Faculty",
  "Admin",
  "Lead",
]);

export function normalizeUserRole(role: unknown): UserRole {
  return typeof role === "string" && USER_ROLES.has(role as UserRole)
    ? (role as UserRole)
    : "Attendee";
}

export function resolveDashboardPath(
  role: UserRole | string | null | undefined,
): DashboardPath {
  if (role === "Admin" || role === "Lead") return "/dashboard/admin";
  if (role === "Volunteer" || role === "Faculty") return "/dashboard/volunteer";
  return "/dashboard/user";
}

export function viewerFromSession(
  session: ViewerSession | null | undefined,
): Viewer {
  if (!session?.user) {
    return { authenticated: false, role: null, dashboardPath: null };
  }

  const role = normalizeUserRole(session.user.role);
  return { 
    authenticated: true, 
    role, 
    dashboardPath: resolveDashboardPath(role),
    image: session.user.image,
    name: session.user.name,
  };
}
