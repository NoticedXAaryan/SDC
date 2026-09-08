export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "owner", "root", "api", "www", "sdc", "support",
  "events", "forms", "recruitment", "finance", "inventory", "settings", "profile", "dashboard", "u",
]);
export const normalizeUsername = (value: string) => value.trim().toLowerCase();
export function usernameError(value: unknown): string | null {
  if (typeof value !== "string" || !/^[a-z0-9_]{3,20}$/.test(normalizeUsername(value))) {
    return "Use 3–20 letters, numbers, or underscores.";
  }
  return RESERVED_USERNAMES.has(normalizeUsername(value)) ? "This username is reserved. Choose another." : null;
}
