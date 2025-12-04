import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth cookie (Firebase sets this)
  const authToken = request.cookies.get('authToken')?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/teacher'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without auth, redirect to home
  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teacher/:path*',
  ],
};
