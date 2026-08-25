export type UserRole = string;

export type DashboardPath = "/dashboard";

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

export function normalizeUserRole(role: unknown): UserRole {
  return typeof role === "string" && role.length > 0 ? role : "user";
}

export function resolveDashboardPath(
  role: UserRole | string | null | undefined,
): DashboardPath {
  return "/dashboard";
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
