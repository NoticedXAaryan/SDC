import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  const hostname = request.headers.get('host') || '';
  const currentHost = process.env.NODE_ENV === 'production' 
    ? hostname.replace(`.yourdomain.com`, '') // Replace with actual root domain
    : hostname.replace(`.localhost:3000`, '');

  // Subdomain routing
  // If the host is not the main domain (e.g., 'techfest' instead of 'localhost:3000')
  if (
    currentHost !== 'localhost:3000' && 
    currentHost !== 'yourdomain.com' &&
    currentHost !== 'www.yourdomain.com' &&
    currentHost !== hostname
  ) {
    // Rewrite techfest.yourdomain.com/about to /events/techfest/about
    // We assume the subdomain name matches the event slug for simplicity
    url.pathname = `/events/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
