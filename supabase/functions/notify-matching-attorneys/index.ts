import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { requestId, requestTitle, practiceArea } = await req.json();

    if (!requestId || !requestTitle || !practiceArea) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: requestId, requestTitle, practiceArea" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find attorneys whose practice_areas array contains the given practice area
    const { data: attorneys, error: attError } = await supabaseClient
      .from("attorney_profiles")
      .select("id")
      .contains("practice_areas", [practiceArea]);

    if (attError) {
      console.error("Failed to query attorney_profiles:", attError);
      return new Response(
        JSON.stringify({ error: "Failed to query attorneys" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!attorneys || attorneys.length === 0) {
      console.log("No matching attorneys for practice area:", practiceArea);
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const attorneyIds = attorneys.map((a: { id: string }) => a.id);

    // Fetch push tokens for all matched attorneys
    const { data: tokens, error: tokensError } = await supabaseClient
      .from("push_tokens")
      .select("token")
      .in("user_id", attorneyIds);

    if (tokensError) {
      console.error("Failed to fetch push tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("No push tokens found for matched attorneys");
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build notification messages
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: "New Request Match",
      body: `New request: ${requestTitle}`,
      data: { requestId, role: "attorney", initialTab: "details" },
      sound: "default" as const,
    }));

    // Send in chunks of 100 (Expo Push API limit)
    const CHUNK_SIZE = 100;
    let totalSent = 0;

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);

      console.log(`Sending chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${chunk.length} notification(s)`);

      const pushResponse = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });

      const pushResult = await pushResponse.text();
      console.log("Expo Push API response:", pushResponse.status, pushResult);
      totalSent += chunk.length;
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error in notify-matching-attorneys:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
