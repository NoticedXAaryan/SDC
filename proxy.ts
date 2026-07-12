/**
 * Next.js 16 Proxy — Route protection layer.
 * 
 * In Next.js 16, `middleware.ts` is deprecated in favor of `proxy.ts`.
 * This runs before every matched route and handles auth redirects.
 * 
 * IMPORTANT: This is NOT the only auth check. The DAL (lib/dal/auth.ts)
 * performs the real authorization close to data. This proxy handles
 * the fast redirect for unauthenticated users only.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
];

/** Routes that are always public */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/",
  "/verify",
  "/projects",
  "/privacy",
  "/terms",
  "/api/auth",
  "/api/health",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isProtected) {
    // Better Auth stores its session token in a cookie.
    // We check for the cookie's existence as a fast gate.
    // The actual session validation happens in the DAL (requireSession).
    const sessionCookie = request.cookies.get("better-auth.session_token")
      || request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
