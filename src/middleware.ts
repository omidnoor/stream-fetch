/**
 * Authentication Middleware
 *
 * Simple middleware that checks for auth session cookie.
 * Full authentication is handled by NextAuth in API routes.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error'];

// API routes that don't require authentication
const publicApiRoutes = ['/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth v5 uses authjs.session-token)
  const sessionCookie =
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  if (!sessionCookie) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
