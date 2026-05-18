"use client";

/**
 * useAuth hook
 *
 * Provides:
 *  - user        → Supabase auth user (or null)
 *  - profile     → profiles row with role
 *  - isLoading   → true while session is being fetched
 *  - signIn      → email/password sign in
 *  - signUp      → email/password sign up
 *  - signOut     → sign out
 *  - requireRole → redirect if user doesn't have required role
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, AuthError } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/database.types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

interface SignInResult {
  error: AuthError | null;
}

interface SignUpResult {
  error: AuthError | null;
}

export function useAuth() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  // ── Create profile when trigger missed (recreated users, etc.) ───────────
  const ensureProfile = useCallback(
    async (user: User): Promise<Profile | null> => {
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        "";

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: fullName,
            role: "voter",
          },
          { onConflict: "id" }
        )
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn("Could not create profile:", error.message);
        return null;
      }
      return data;
    },
    [supabase]
  );

  // ── Fetch profile from DB ────────────────────────────────────────────────
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error.message);
        return null;
      }

      if (data) {
        return data;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        return null;
      }

      return ensureProfile(user);
    },
    [supabase, ensureProfile]
  );

  // ── Listen to auth state changes ─────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, profile, isLoading: false });
      } else {
        setState({ user: null, profile: null, isLoading: false });
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, profile, isLoading: false });
      } else {
        setState({ user: null, profile: null, isLoading: false });
      }

      // Refresh server components on sign in/out
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, router]);

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const profile = await fetchProfile(data.user.id);
        // Role-based redirect
        if (profile) {
          switch (profile.role) {
            case "super_admin":
              router.push("/admin");
              break;
            case "election_creator":
              router.push("/creator");
              break;
            default:
              router.push("/");
          }
        }
      }

      return { error };
    },
    [supabase, fetchProfile, router]
  );

  // ── Sign up ──────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<SignUpResult> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { error };
    },
    [supabase]
  );

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  // ── Role guard ───────────────────────────────────────────────────────────
  const requireRole = useCallback(
    (requiredRole: UserRole | UserRole[], redirectTo = "/login") => {
      if (state.isLoading) return;

      if (!state.user || !state.profile) {
        router.push(redirectTo);
        return;
      }

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(state.profile.role)) {
        // Redirect to appropriate dashboard based on actual role
        switch (state.profile.role) {
          case "super_admin":
            router.push("/admin");
            break;
          case "election_creator":
            router.push("/creator");
            break;
          default:
            router.push("/");
        }
      }
    },
    [state, router]
  );

  return {
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    role: state.profile?.role ?? null,
    signIn,
    signUp,
    signOut,
    requireRole,
  };
}
