// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

declare const Deno: {
    env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    const logTag = `[INVITE-USER-${Math.random().toString(36).substring(7)}]`;
    console.log(`\n--- 🚀 ${logTag} START ---`);
    console.log(`Method: ${req.method} | Time: ${new Date().toISOString()}`);

    if (req.method === "OPTIONS") {
        console.log(`${logTag} 🛠️ [CORS] Handling OPTIONS request.`);
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. [Headers Logging]
        const authHeader = req.headers.get('Authorization');
        const originHeader = req.headers.get('origin');
        console.log(`${logTag} 🌐 Origin: ${originHeader}`);
        console.log(`${logTag} 🔑 Auth Header Present: ${!!authHeader} (${authHeader?.substring(0, 20)}...)`);

        // 2. [Env Variables Check]
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey =
            Deno.env.get("PRIVATE_SERVICE_ROLE_KEY") ??
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
            Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error(`${logTag} ❌ Critical: Environment variables missing.`);
            return new Response(JSON.stringify({
                error: "Server configuration error",
                details: "Missing SERVICE_ROLE_KEY. Please set PRIVATE_SERVICE_ROLE_KEY in secrets."
            }), { status: 500, headers: corsHeaders });
        }

        // 3. [Auth] Identify Caller
        if (!authHeader) {
            console.error(`${logTag} ❌ No Authorization header provided.`);
            return new Response(JSON.stringify({ error: "Unauthorized: Missing token in headers" }), { status: 401, headers: corsHeaders });
        }

        const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            console.error(`${logTag} ❌ getUser() failed: ${authError?.message || "User not found in session"}`);
            return new Response(JSON.stringify({
                error: "Unauthorized: Invalid or expired session",
                details: authError?.message || "User session invalid"
            }), { status: 401, headers: corsHeaders });
        }

        console.log(`${logTag} 👤 Caller identified: ${user.email} (${user.id})`);

        // 4. [Admin Check] Use Service Role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: callerProfile } = await supabaseAdmin
            .from("user_profiles")
            .select("role, center_id")
            .eq("id", user.id)
            .maybeSingle();

        const SUPER_ADMINS = ['anukbin@gmail.com', 'zaradajoo@gmail.com'];
        const isSuperEmail = SUPER_ADMINS.includes(user.email || '');
        const hasAdminRole = ['super_admin', 'super', 'admin'].includes(callerProfile?.role || '');

        console.log(`${logTag} 🔒 Permissions: isSuperEmail=${isSuperEmail}, hasAdminRole=${hasAdminRole}, Role=${callerProfile?.role}`);

        if (!isSuperEmail && !hasAdminRole) {
            console.error(`${logTag} ❌ Permission Denied: Caller role (${callerProfile?.role}) has no invite authority.`);
            return new Response(JSON.stringify({ error: "Forbidden: Admin or SuperAdmin access required." }), { status: 403, headers: corsHeaders });
        }

        // 5. [Target Info Parsing]
        const payload = await req.json();
        const { email, name, role, center_id, redirectTo: clientRedirectTo, ...details } = payload;
        const origin = originHeader || "https://app.myparents.co.kr";
        const finalRedirectTo = clientRedirectTo || `${origin}/auth/update-password`;

        if (!email) throw new Error("Target email is required.");

        // 🛡️ Multi-Center Safety
        const targetCenterId = isSuperEmail ? center_id : callerProfile?.center_id;
        if (!targetCenterId) {
            console.error(`${logTag} ❌ Center ID mission: Admin must have a center_id or be SuperAdmin.`);
            throw new Error("Target center identification failed.");
        }

        // 🛡️ [Legacy Fallback] Frontend might still send old roles
        let finalRole = role;
        if (role === 'staff' || role === 'employee') finalRole = 'manager';
        if (role === 'super') finalRole = 'super_admin';

        console.log(`${logTag} 📧 Inviting: ${email} | Original Role: ${role} | Final Role: ${finalRole} | Center: ${targetCenterId}`);

        // 6. [Send Invitation]
        console.log(`${logTag} 🔎 Attempting to invite user: ${email} with role: ${role}...`);

        let finalUserId: string | null = null;

        // 🚀 Send invitation with the requested role directly
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name, role: finalRole, full_name: name, center_id: targetCenterId },
            redirectTo: finalRedirectTo,
        });

        if (inviteError) {
            if (inviteError.message.toLowerCase().includes("already")) {
                console.log(`${logTag} ℹ️ User ${email} already exists in Auth. Syncing profile only...`);
                const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                finalUserId = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())?.id || null;

                if (!finalUserId) {
                    console.error(`${logTag} ❌ Failed to find existing user ID after 422 error.`);
                    throw new Error("User exists but could not be resolved.");
                }
            } else {
                console.error(`${logTag} ❌ Supabase Auth Invitation Error:`, inviteError.message);
                throw new Error(`Auth Error: ${inviteError.message}`);
            }
        } else {
            console.log(`${logTag} 📧 Invitation email triggered successfully for: ${email}`);
            finalUserId = authData?.user?.id;
        }

        if (!finalUserId) throw new Error("Could not resolve target User ID.");

        // 7. [Sync] Strict profile/center binding
        console.log(`${logTag} 🔄 Syncing profile for ${finalUserId} to center ${targetCenterId}...`);

        const { error: syncError } = await supabaseAdmin
            .from("user_profiles")
            .upsert({
                id: finalUserId,
                email,
                name,
                role: finalRole as any,
                status: 'active',
                center_id: targetCenterId
            }, { onConflict: 'id' });

        if (syncError) {
            console.error(`${logTag} ❌ Profile Sync Error:`, syncError.message);
            throw syncError;
        }

        if (finalRole !== 'parent') {
            console.log(`${logTag} 🩺 Syncing to therapists table for role: ${finalRole}`);

            // ✨ [Fix] select → insert/update 패턴 (email에 UNIQUE 제약 없으므로 upsert 불가)
            const { data: existingTherapist } = await supabaseAdmin
                .from("therapists")
                .select("id")
                .eq("email", email)
                .eq("center_id", targetCenterId)
                .maybeSingle();

            if (existingTherapist) {
                // 기존 레코드 업데이트
                const { error: thError } = await supabaseAdmin
                    .from("therapists")
                    .update({
                        name,
                        system_role: finalRole || 'therapist',
                        system_status: 'active',
                        profile_id: finalUserId,
                        ...details
                    })
                    .eq("id", existingTherapist.id);
                if (thError) console.warn(`${logTag} ⚠️ Staff table update warning:`, thError.message);
            } else {
                // 새 레코드 생성
                const { error: thError } = await supabaseAdmin
                    .from("therapists")
                    .insert({
                        email,
                        name,
                        center_id: targetCenterId,
                        system_role: finalRole || 'therapist',
                        system_status: 'active',
                        profile_id: finalUserId,
                        ...details
                    });
                if (thError) console.warn(`${logTag} ⚠️ Staff table insert warning:`, thError.message);
            }
        }

        console.log(`${logTag} ✅ SUCCESS: ${email} invited to center ${targetCenterId}`);
        console.log(`--- ${logTag} FINISH ---\n`);

        return new Response(
            JSON.stringify({ message: "Success", userId: finalUserId }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`${logTag} 🔴 EXCEPTION: ${errorMessage}`);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
