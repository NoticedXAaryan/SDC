export function normalizeStorageKey(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0 || segments.some((segment) => segment === ".." || segment === ".")) {
    throw new Error("Invalid storage path");
  }

  return segments.join("/");
}
