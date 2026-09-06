/** Signup never grants club membership or administrative access. */
export const SIGNUP_ROLE = "outsider";

export function hasGoogleSignIn(config: Record<string, string | undefined>) {
  return Boolean(config.GOOGLE_CLIENT_ID?.trim() && config.GOOGLE_CLIENT_SECRET?.trim());
}

export function hasEmailDelivery(config: Record<string, string | undefined>) {
  return Boolean(getDevelopmentMailbox(config) || (config.RESEND_API_KEY?.trim() && config.EMAIL_FROM_ADDRESS?.trim()));
}

/** Test mail stays on this machine and can never replace production delivery. */
export function getDevelopmentMailbox(config: Record<string, string | undefined>) {
  if (config.NODE_ENV === "production" || !config.DEV_MAILBOX_URL?.trim()) return null;
  const url = new URL(config.DEV_MAILBOX_URL);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("DEV_MAILBOX_URL must be a local HTTP origin.");
  }
  return url.origin;
}
