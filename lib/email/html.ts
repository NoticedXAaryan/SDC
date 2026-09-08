const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

/** Escape untrusted text before placing it in HTML text or attribute content. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character] ?? character,
  );
}

/** Preserve plain-text line breaks without allowing the text to inject markup. */
export function escapeHtmlWithLineBreaks(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

/** Prevent dynamic email headers from containing newline-delimited headers. */
export function sanitizeEmailHeader(value: unknown): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

/** Return a normalized URL only when it uses a safe link protocol. */
export function toSafeHttpUrl(value: unknown, baseUrl?: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    let base: string | undefined;
    if (typeof baseUrl === "string" && baseUrl.trim()) {
      const parsedBase = new URL(baseUrl.trim());
      if (parsedBase.protocol !== "http:" && parsedBase.protocol !== "https:") return null;
      base = parsedBase.toString();
    }

    const url = base ? new URL(value.trim(), base) : new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
