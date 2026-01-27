// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

declare const Deno: any;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    console.log(`\n--- 🚀 [APPROVE-USER] START ---`);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. [Env Variables Check]
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey =
            Deno.env.get("PRIVATE_SERVICE_ROLE_KEY") ??
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
            Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("❌ Critical: Environment variables missing.");
            return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: corsHeaders });
        }

        // 2. [Auth] Identify Caller
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Unauthorized: Missing token");

        const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized: Invalid session");

        // 3. [Admin Check] Use Service Role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: callerProfile } = await supabaseAdmin
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        const SUPER_ADMINS = ['anukbin@gmail.com', 'zaradajoo@gmail.com'];
        const isSuperAdmin = SUPER_ADMINS.includes(user.email || '');
        const isAdmin = callerProfile?.role === 'admin';

        if (!isSuperAdmin && !isAdmin) {
            console.error("❌ Permission Denied.");
            return new Response(JSON.stringify({ error: "Unauthorized: Admin only." }), { status: 403, headers: corsHeaders });
        }

        // 4. [Target Info]
        const { target_user_id } = await req.json();
        if (!target_user_id) throw new Error("Target user ID is required");

        console.log(`👤 Approving User ID: ${target_user_id}`);

        // 5. [Approve]
        const { error: updateError } = await supabaseAdmin
            .from("user_profiles")
            .update({
                role: 'therapist',
                status: 'active'
            })
            .eq("id", target_user_id);

        if (updateError) throw updateError;

        console.log(`✅ SUCCESS: User ${target_user_id} approved.`);

        return new Response(
            JSON.stringify({ success: true, message: "승인되었습니다." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: any) {
        console.error(`🔴 EXCEPTION: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
