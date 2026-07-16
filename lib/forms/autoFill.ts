import { Session } from "better-auth";

// Maps known keys to common auto-fill fields based on a logged-in user
export function getAutoFillValue(user: any, autoFillKey: string): string | undefined {
  if (!user || !autoFillKey) return undefined;

  switch (autoFillKey.toLowerCase()) {
    case "user.email":
    case "email":
      return user.email;
    case "user.name":
    case "name":
      return user.name;
    case "user.username":
    case "username":
    case "handle":
      return user.username || user.usernameLower;
    case "user.department":
    case "department":
      return user.branch || user.department;
    case "user.year":
    case "year":
      return user.year ? user.year.toString() : undefined;
    default:
      return undefined;
  }
}

export function suggestAutoFillKey(label: string): string | undefined {
  const l = label.toLowerCase();
  if (l.includes("email") || l.includes("gmail")) return "user.email";
  if (l.includes("name") || l.includes("full name")) return "user.name";
  if (l.includes("handle") || l.includes("username")) return "user.username";
  if (l.includes("branch") || l.includes("department")) return "user.department";
  if (l.includes("year") || l.includes("semester")) return "user.year";
  return undefined;
}
