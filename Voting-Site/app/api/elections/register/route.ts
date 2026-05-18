import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase.server"
import { NextResponse, type NextRequest } from "next/server"
import { randomBytes } from "crypto"

const POLL_ID_PATTERN = /^POLL-[A-Z0-9]{8}$/

function generateSecretPollId(): string {
  const raw = randomBytes(6)
    .toString("base64")
    .replace(/\+/g, "A")
    .replace(/\//g, "B")
    .slice(0, 8)
    .toUpperCase()
  return `POLL-${raw}`
}

async function generateUniquePollId(
  admin: ReturnType<typeof createAdminSupabaseClient>
): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = generateSecretPollId()
    const { data } = await admin
      .from("registrations")
      .select("id")
      .eq("secret_poll_id", candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  throw new Error("Could not generate unique poll ID")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const electionId = body?.election_id as string | undefined
    if (!electionId) {
      return NextResponse.json({ success: false, error: "election_id required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "not_authenticated" }, { status: 401 })
    }

    // Prefer DB RPC when deployed (matches generate_secret_poll_id)
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      "register_for_election",
      { p_election_id: electionId }
    )

    if (!rpcError && rpcData?.success && rpcData?.secret_poll_id) {
      const secret = String(rpcData.secret_poll_id).trim().toUpperCase()
      if (POLL_ID_PATTERN.test(secret)) {
        return NextResponse.json({
          success: true,
          secret_poll_id: secret,
          already_registered: rpcData.already_registered ?? false,
        })
      }
    }

    if (rpcError && rpcError.code !== "PGRST202") {
      console.error("[register] RPC error:", rpcError)
    }

    const admin = createAdminSupabaseClient()

    const { data: election, error: electionError } = await admin
      .from("elections")
      .select("id, status, max_voters, registered_count, ends_at")
      .eq("id", electionId)
      .single()

    if (electionError || !election) {
      return NextResponse.json({ success: false, error: "election_not_found" }, { status: 404 })
    }

    if (!["active", "locked", "draft"].includes(election.status)) {
      return NextResponse.json({ success: false, error: "election_not_open" }, { status: 400 })
    }

    if (election.ends_at && new Date(election.ends_at) < new Date()) {
      return NextResponse.json({ success: false, error: "election_ended" }, { status: 400 })
    }

    const { data: existing } = await admin
      .from("registrations")
      .select("id, secret_poll_id, has_voted, status")
      .eq("election_id", electionId)
      .eq("voter_id", user.id)
      .maybeSingle()

    if (existing?.has_voted) {
      return NextResponse.json({ success: false, error: "already_voted" }, { status: 400 })
    }

    if (existing?.secret_poll_id) {
      return NextResponse.json({
        success: true,
        secret_poll_id: existing.secret_poll_id.trim().toUpperCase(),
        already_registered: true,
      })
    }

    const secretPollId = await generateUniquePollId(admin)

    if (existing) {
      const { error: updateError } = await admin
        .from("registrations")
        .update({ secret_poll_id: secretPollId })
        .eq("id", existing.id)

      if (updateError) {
        console.error("[register] update error:", updateError)
        return NextResponse.json({ success: false, error: "registration_failed" }, { status: 500 })
      }
    } else {
      if ((election.registered_count ?? 0) >= (election.max_voters ?? 0)) {
        return NextResponse.json({ success: false, error: "election_full" }, { status: 400 })
      }

      const { error: insertError } = await admin.from("registrations").insert({
        election_id: electionId,
        voter_id: user.id,
        status: "registered",
        secret_poll_id: secretPollId,
      })

      if (insertError) {
        console.error("[register] insert error:", insertError)
        return NextResponse.json({ success: false, error: "registration_failed" }, { status: 500 })
      }

      await admin.from("audit_logs").insert({
        election_id: electionId,
        actor_id: user.id,
        action: "voter_registered",
        details: { secret_id_generated: true },
      })
    }

    return NextResponse.json({
      success: true,
      secret_poll_id: secretPollId,
      already_registered: false,
    })
  } catch (err) {
    console.error("[register] unexpected error:", err)
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 })
  }
}
