import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/attendance/generate', '/attendance/records'];
  const adminPaths = ['/admin'];
  
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // If there's no session and trying to access a protected route
  if (!session && (isProtectedPath || isAdminPath)) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/attendance/generate', '/attendance/records', '/admin/:path*'],
}; 