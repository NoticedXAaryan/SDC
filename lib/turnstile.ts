import { NextResponse } from "next/server";

export async function validateTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // If not configured, bypass validation (useful for local dev)
    console.warn("Turnstile validation bypassed: TURNSTILE_SECRET_KEY is not set.");
    return true;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });
    
    const data = await res.json();
    return !!data.success;
  } catch (error) {
    console.error("Turnstile validation failed:", error);
    return false;
  }
}
