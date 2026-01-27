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
    console.log(`\n--- 🚀 [INVITE-USER] START ---`);
    console.log(`Method: ${req.method} | Time: ${new Date().toISOString()}`);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. [Env Variables Check]
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        // 🔑 최신 수동 시크릿(PRIVATE_SERVICE_ROLE_KEY)을 최우선으로 참조
        const supabaseServiceKey =
            Deno.env.get("PRIVATE_SERVICE_ROLE_KEY") ??
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
            Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("❌ Critical: Environment variables missing.");
            return new Response(JSON.stringify({
                error: "Server configuration error",
                details: "Missing SERVICE_ROLE_KEY. Please set PRIVATE_SERVICE_ROLE_KEY in secrets."
            }), { status: 500, headers: corsHeaders });
        }

        // 2. [Auth] Identify Caller
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("❌ No Authorization header provided.");
            return new Response(JSON.stringify({ error: "Unauthorized: Missing token" }), { status: 401, headers: corsHeaders });
        }

        const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            console.error("❌ getUser() failed:", authError?.message || "User not found");
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid or expired session" }), { status: 401, headers: corsHeaders });
        }

        console.log(`👤 Caller identified: ${user.email} (${user.id})`);

        // 3. [Admin Check] Use Service Role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from("user_profiles")
            .select("role, center_id")
            .eq("id", user.id)
            .maybeSingle();

        const SUPER_ADMINS = ['anukbin@gmail.com', 'zaradajoo@gmail.com'];
        const isSuperAdmin = SUPER_ADMINS.includes(user.email || '');
        const isAdmin = callerProfile?.role === 'admin';

        console.log(`🔒 Permissions: isSuperAdmin=${isSuperAdmin}, isAdmin=${isAdmin}`);

        if (!isSuperAdmin && !isAdmin) {
            console.error("❌ Permission Denied: Caller is neither SuperAdmin nor Admin.");
            return new Response(JSON.stringify({ error: "Unauthorized: Access denied. Admin only." }), { status: 403, headers: corsHeaders });
        }

        // 4. [Target Info]
        const payload = await req.json();
        const { email, name, role, center_id, redirectTo: clientRedirectTo, ...details } = payload;
        const origin = req.headers.get("origin") || "https://app.myparents.co.kr";
        const finalRedirectTo = clientRedirectTo || `${origin}/auth/update-password`;

        if (!email) throw new Error("Target email is required.");

        // 🛡️ Multi-Center Safety
        const targetCenterId = isSuperAdmin ? center_id : callerProfile?.center_id;
        if (!targetCenterId) {
            console.error("❌ Center ID mission: Admin must have a center_id or be SuperAdmin.");
            throw new Error("Target center identification failed.");
        }

        console.log(`📧 Inviting: ${email} | Role: ${role} | Center: ${targetCenterId}`);

        // 5. [Find or Create User]
        let finalUserId: string | null = null;
        console.log(`🔎 Checking if user ${email} already exists...`);

        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) console.warn("⚠️ listUsers warning:", listError.message);

        const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

        if (existingUser) {
            finalUserId = existingUser.id;
            console.log(`ℹ️ User found (ID: ${finalUserId}). Proceeding to update/sync...`);
        } else {
            console.log(`🆕 User not found. Sending invitation email...`);
            const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                data: { name, role, full_name: name, center_id: targetCenterId },
                redirectTo: finalRedirectTo,
            });

            if (inviteError) {
                // Secondary check for race conditions
                if (inviteError.message.toLowerCase().includes("already")) {
                    const { data: retryList } = await supabaseAdmin.auth.admin.listUsers();
                    finalUserId = retryList?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())?.id || null;
                }

                if (!finalUserId) {
                    console.error("❌ Invite Error:", inviteError.message);
                    throw inviteError;
                }
            } else {
                finalUserId = authData?.user?.id;
            }
        }

        if (!finalUserId) throw new Error("Could not resolve target User ID.");

        // 6. [Sync] Strict profile/center binding
        console.log(`🔄 Syncing profile for ${finalUserId} to center ${targetCenterId}...`);
        const { error: syncError } = await supabaseAdmin
            .from("user_profiles")
            .upsert({
                id: finalUserId,
                email,
                name,
                role: role || 'therapist', // Fallback to therapist
                status: 'active',
                center_id: targetCenterId
            }, { onConflict: 'id' });

        if (syncError) {
            console.error("❌ Profile Sync Error:", syncError.message);
            throw syncError;
        }

        // 🩺 Therapist/Staff specific table sync
        // Sync to 'therapists' table if not a parent, so they show up in UI lists
        if (role !== 'parent') {
            console.log(`🩺 Syncing to therapists table for role: ${role}`);
            const { error: thError } = await supabaseAdmin
                .from("therapists")
                .upsert({
                    email,
                    name,
                    center_id: targetCenterId,
                    system_role: role || 'therapist',
                    system_status: 'active',
                    ...details
                }, { onConflict: 'email' });
            if (thError) console.warn("⚠️ Staff table sync warning:", thError.message);
        }

        console.log(`✅ SUCCESS: ${email} invited to center ${targetCenterId}`);
        console.log(`--- --- --- --- --- --- ---\n`);

        return new Response(
            JSON.stringify({ message: "Success", userId: finalUserId }),
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
