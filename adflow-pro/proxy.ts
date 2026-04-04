import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser, canAccessRoute } from '@/lib/auth'

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/explore',
    '/packages',
    '/ads',
    '/categories',
    '/cities',
    '/api/auth/login',
    '/api/auth/register',
    '/api/ads',
    '/api/packages',
    '/api/questions/random',
    '/api/health/db'
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(path) ||
    pathname.startsWith('/api/ads/') ||
    pathname.startsWith('/ads/') ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/cities/')
  )

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  try {
    const { user, error } = await getCurrentUser()

    if (error || !user) {
      // Redirect to login for unauthenticated users
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user can access the requested route
    if (!canAccessRoute(user, pathname)) {
      // Redirect to appropriate dashboard or show access denied
      if (user.role === 'client') {
        return NextResponse.redirect(new URL('/dashboard/client', request.url))
      } else if (user.role === 'moderator') {
        return NextResponse.redirect(new URL('/dashboard/moderator', request.url))
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      }
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-role', user.role)

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
    // If there's an error, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
