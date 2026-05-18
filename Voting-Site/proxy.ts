/**
 * Next.js Proxy (formerly Middleware)
 *
 * Handles:
 *  1. Supabase session refresh on every request
 *  2. Role-based route protection
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// Routes that require authentication — use exact paths to avoid prefix collisions
const PROTECTED_ROUTES = ["/admin", "/election", "/results"];
const PROTECTED_EXACT = ["/creator"]; // exact match only, not /creator-request

// Routes that require specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["super_admin"],
  "/creator": ["election_creator", "super_admin"],
};

/** Match /creator but not /creator-request (segment boundary). */
function matchesProtectedRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not add logic between createServerClient
  // and getUser() as it may cause session issues
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const requiresAuth =
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
    PROTECTED_EXACT.some((route) => matchesProtectedRoute(pathname, route));

  if (requiresAuth && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (user) {
    const matchedRoute = Object.keys(ROLE_ROUTES).find((route) =>
      matchesProtectedRoute(pathname, route)
    );

    if (matchedRoute) {
      const allowedRoles = ROLE_ROUTES[matchedRoute];

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single() as { data: { role: string } | null; error: unknown };

      if (profile && !allowedRoles.includes(profile.role)) {
        const redirectMap: Record<string, string> = {
          super_admin: "/admin",
          election_creator: "/creator",
          voter: "/",
        };
        return NextResponse.redirect(
          new URL(redirectMap[profile.role] ?? "/", request.url)
        );
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathname === "/login" || pathname === "/signup") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single() as { data: { role: string } | null; error: unknown };

      if (profile) {
        const redirectMap: Record<string, string> = {
          super_admin: "/admin",
          election_creator: "/creator",
          voter: "/",
        };
        return NextResponse.redirect(
          new URL(redirectMap[profile.role] ?? "/", request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
