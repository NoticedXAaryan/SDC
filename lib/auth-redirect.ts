const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function sanitizeAuthRedirect(
  value: string | string[] | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.startsWith("/login") ||
    candidate.startsWith("/register")
  ) {
    return fallback;
  }

  return candidate;
}
