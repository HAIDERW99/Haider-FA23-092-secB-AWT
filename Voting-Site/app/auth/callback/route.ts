/**
 * Auth callback route
 * Handles email confirmation redirects from Supabase
 */

import { createServerSupabaseClient } from "@/lib/supabase.server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Fetch role and redirect accordingly
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          const redirectMap: Record<string, string> = {
            super_admin: "/admin",
            election_creator: "/creator",
            voter: next,
          };
          return NextResponse.redirect(
            new URL(redirectMap[(profile as any).role] ?? next, origin)
          );
        }
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Return to error page if code exchange fails
  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
