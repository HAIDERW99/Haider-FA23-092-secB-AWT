/**
 * Supabase Edge Function: send-secret-id
 *
 * Triggered after an election is activated.
 * Calls finalize_voter_registrations() to assign POLL-XXXX IDs,
 * then emails each voter their secret ID via Resend.
 *
 * Deploy with:
 *   supabase functions deploy send-secret-id
 *
 * Invoke via Supabase Dashboard > Edge Functions, or call from
 * the creator dashboard when activating an election.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@4.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { election_id } = await req.json();

    if (!election_id) {
      return new Response(
        JSON.stringify({ error: "election_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    // Fetch election details
    const { data: election, error: electionError } = await supabase
      .from("elections")
      .select("id, title, organization, ends_at")
      .eq("id", election_id)
      .single();

    if (electionError || !election) {
      return new Response(
        JSON.stringify({ error: "Election not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secret IDs for all registered voters
    const { data: voters, error: rpcError } = await supabase.rpc(
      "finalize_voter_registrations",
      { p_election_id: election_id }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!voters || voters.length === 0) {
      return new Response(
        JSON.stringify({ message: "No voters to process", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send emails in batches of 10 to respect rate limits
    const batchSize = 10;
    let emailsSent = 0;
    let emailsFailed = 0;

    for (let i = 0; i < voters.length; i += batchSize) {
      const batch = voters.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (voter: { voter_id: string; email: string; secret_poll_id: string }) => {
          try {
            await resend.emails.send({
              from: `SecureVote <noreply@${Deno.env.get("EMAIL_DOMAIN") ?? "securevote.app"}>`,
              to: voter.email,
              subject: `Your Secret Voter ID for: ${election.title}`,
              html: buildEmailHtml({
                electionTitle: election.title,
                organization: election.organization,
                secretId: voter.secret_poll_id,
                endsAt: election.ends_at
                  ? new Date(election.ends_at).toLocaleString("en-US", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })
                  : "TBD",
                electionUrl: `${Deno.env.get("NEXT_PUBLIC_APP_URL")}/election/${election_id}`,
              }),
            });
            emailsSent++;
          } catch (err) {
            console.error(`Failed to send email to ${voter.email}:`, err);
            emailsFailed++;
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < voters.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_voters: voters.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// Email HTML template
// ============================================================
function buildEmailHtml(params: {
  electionTitle: string;
  organization: string;
  secretId: string;
  endsAt: string;
  electionUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Secret Voter ID</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🗳️ SecureVote</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Secure Online Election Management</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">Your Secret Voter ID</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
                You have been registered to vote in the following election:
              </p>

              <!-- Election Info -->
              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#1a1a2e;">${params.electionTitle}</p>
                <p style="margin:0;color:#6b7280;font-size:14px;">${params.organization}</p>
                <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Voting closes: ${params.endsAt}</p>
              </div>

              <!-- Secret ID -->
              <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#1d4ed8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your Secret Voter ID</p>
                <p style="margin:0;font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#1a1a2e;letter-spacing:0.1em;">${params.secretId}</p>
              </div>

              <!-- Warning -->
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:14px;">
                  <strong>⚠️ Important:</strong> Keep this ID private and secure. You will need it to access the ballot. 
                  This ID cannot be recovered if lost.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${params.electionUrl}"
                   style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                  Go to Election →
                </a>
              </div>

              <!-- Security Note -->
              <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
                🔒 Your vote is anonymous and encrypted. SecureVote will never ask for your Secret ID via email or phone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} SecureVote. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
