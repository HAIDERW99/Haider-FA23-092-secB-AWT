import { NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase.server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminSupabaseClient()

    // Use service role for role check — avoids RLS/session edge cases on profiles
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Admin profile lookup error:", profileError.message)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: requests, error } = await admin
      .from("creator_requests")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = requests ?? []
    return NextResponse.json(
      { requests: list, pendingCount: list.length },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  } catch (err) {
    console.error("Admin creator-requests error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
