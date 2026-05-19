import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase.server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

type CreatorRequestBody = {
  first_name: string
  last_name: string
  email: string
  phone: string
  organization_name: string
  organization_type: string
  purpose: string
  expected_voters: string
}

function isValidBody(body: unknown): body is CreatorRequestBody {
  if (!body || typeof body !== "object") return false
  const b = body as Record<string, unknown>
  return (
    typeof b.first_name === "string" &&
    typeof b.last_name === "string" &&
    typeof b.email === "string" &&
    typeof b.phone === "string" &&
    typeof b.organization_name === "string" &&
    typeof b.organization_type === "string" &&
    typeof b.purpose === "string" &&
    typeof b.expected_voters === "string" &&
    b.first_name.trim().length > 0 &&
    b.last_name.trim().length > 0 &&
    b.email.trim().length > 0
  )
}

/** Submit a creator access request (bypasses RLS on RETURNING via service role). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isValidBody(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminSupabaseClient()
    const { data, error } = await admin
      .from("creator_requests")
      .insert({
        user_id: user?.id ?? null,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        organization_name: body.organization_name.trim(),
        organization_type: body.organization_type.trim(),
        purpose: body.purpose.trim(),
        expected_voters: body.expected_voters.trim(),
        status: "pending",
      })
      .select("id, reference_id")
      .single()

    if (error) {
      console.error("Creator request insert error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      reference_id: data.reference_id,
    })
  } catch (err) {
    console.error("Creator request POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
