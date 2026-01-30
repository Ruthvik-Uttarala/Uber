import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Public paths
    const publicPaths = ['/auth/login', '/auth/register', '/'];
    const isPublicPath = publicPaths.includes(pathname);

    // Protected paths
    const protectedPaths = ['/rider', '/driver', '/admin'];
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    // If not authenticated and trying to access protected path
    if (!token && isProtectedPath) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // If trying to access admin without ADMIN role
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If authenticated and trying to access auth pages, redirect to home
    if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
