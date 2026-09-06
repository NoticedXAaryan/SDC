export async function validateTurnstile(token: string | null | undefined): Promise<boolean> {
  const configured = Boolean(process.env.TURNSTILE_SECRET_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (process.env.NODE_ENV !== 'production' || !configured) return true;
  if (!token) return false;
  
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    });
    
    const data = await res.json();
    return res.ok && data.success === true;
  } catch (error) {
    console.error("Turnstile validation failed:", error);
    return false;
  }
}
