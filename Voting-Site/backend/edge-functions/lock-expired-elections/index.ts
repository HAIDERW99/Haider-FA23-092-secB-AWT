/**
 * Supabase Edge Function: lock-expired-elections
 *
 * Cron job that runs every 5 minutes to lock elections
 * that have passed their end date or registration deadline.
 *
 * Deploy with:
 *   supabase functions deploy lock-expired-elections
 *
 * Schedule in Supabase Dashboard > Edge Functions > Schedules:
 *   Cron: "*/5 * * * *"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Call the DB function to lock expired elections
    const { data, error } = await supabase.rpc("lock_expired_elections");

    if (error) {
      console.error("Error locking elections:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Locked ${data} expired elections`);

    return new Response(
      JSON.stringify({ success: true, elections_locked: data }),
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
