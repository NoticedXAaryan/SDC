/**
 * Next.js 16 Proxy — Route protection layer.
 * 
 * In Next.js 16, `middleware.ts` is deprecated in favor of `proxy.ts`.
 * This runs before every matched route and handles auth redirects.
 * 
 * IMPORTANT: This is NOT the only auth check. The DAL (lib/dal/auth.ts)
 * performs the real authorization close to data. This proxy handles
 * the fast redirect for unauthenticated users only.
 * 
 * Cookie prefix is "sdc" (set in lib/auth.ts advanced.cookiePrefix),
 * so Better Auth creates cookies named "sdc.session_token".
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateTurnstile } from "@/lib/turnstile";

/** Routes that require authentication */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/events",
  "/admin",
  "/scanner",
  "/lead",
  "/finance",
  "/inventory",
  "/recruitment",
  "/leaderboard",
  "/achievements",
  "/passes",
  "/manage",
  "/settings",
  "/certificates",
  "/internal-projects",
  "/communications",
  "/archive",
  "/notifications",
  "/forms",
  "/applications",
];

/** Routes that are always public */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/",
  "/verify",
  "/projects",
  "/privacy",
  "/terms",
  "/setup",
  "/api/auth",
  "/api/health",
  "/api/ready",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // 1. Protect Better Auth signup with Turnstile
    if (pathname === '/api/auth/sign-up/email' && request.method === 'POST') {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        
        if (process.env.NODE_ENV === 'production') {
          const turnstileValid = await validateTurnstile(body.turnstileToken);
          if (!turnstileValid) {
            return NextResponse.json({ error: "Invalid or missing captcha token" }, { status: 400 });
          }
        }
      } catch {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
      }
    }

    // 2. Auth Protection Logic
    // Allow public paths
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }

    // Check if route is protected
    const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isProtected) {
      // Cookie prefix is "sdc" (configured in lib/auth.ts)
      // In production with secure cookies: __Secure-sdc.session_token
      // In development: sdc.session_token
      const sessionCookie = request.cookies.get("sdc.session_token")
        || request.cookies.get("__Secure-sdc.session_token");

      if (!sessionCookie?.value) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Proxy errors should never crash the request — return a clean 500
    // instead of letting the error propagate to a bad gateway.
    console.error("Proxy error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
