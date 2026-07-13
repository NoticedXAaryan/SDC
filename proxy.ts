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
  const url = request.nextUrl.clone();
  const { pathname } = request.nextUrl;
  
  // 1. Subdomain routing logic
  const hostname = request.headers.get('host') || '';
  
  // Extract base domain from env variables, fallback to localhost
  let baseDomain = 'localhost:3000';
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      baseDomain = new URL(process.env.NEXT_PUBLIC_APP_URL).host;
    } catch (e) {
      // Ignore invalid URL
    }
  } else if (process.env.NODE_ENV === 'production') {
    // If NEXT_PUBLIC_APP_URL is not set in production, try BETTER_AUTH_URL
    if (process.env.BETTER_AUTH_URL) {
      try {
        baseDomain = new URL(process.env.BETTER_AUTH_URL).host;
      } catch (e) {}
    }
  }

  const currentHost = hostname.replace(`.${baseDomain}`, '');

  // If the host is a subdomain
  let isSubdomain = false;
  if (
    currentHost !== baseDomain && 
    currentHost !== `www.${baseDomain}` &&
    currentHost !== hostname
  ) {
    isSubdomain = true;
    url.pathname = `/events/${currentHost}${url.pathname}`;
  }

  // 2. Auth Protection Logic
  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return isSubdomain ? NextResponse.rewrite(url) : NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isProtected) {
    const sessionCookie = request.cookies.get("better-auth.session_token")
      || request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return isSubdomain ? NextResponse.rewrite(url) : NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
