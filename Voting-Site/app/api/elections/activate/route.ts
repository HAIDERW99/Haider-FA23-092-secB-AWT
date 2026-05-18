import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase.server"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { election_id } = await request.json()
    if (!election_id) return NextResponse.json({ error: "election_id required" }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Verify the caller owns this election
    const { data: election } = await (supabase.from("elections") as any).select("creator_id").eq("id", election_id).single()
    if (!election || (election as any).creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Call the Edge Function to generate secret IDs and send emails
    const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-secret-id`
    const response = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ election_id }),
    })

    const result = await response.json()
    return NextResponse.json(result)
  } catch (err) {
    console.error("Activate election error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}