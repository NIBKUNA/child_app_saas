// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
    console.log(`🚀 Function 'invite-user' invoked. Method: ${req.method}`);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // ✨ [Production Auth] Create Admin Client (for privileged operations)
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ✨ [Production Auth] Step 1: Extract and Validate Caller's Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ No Authorization header provided");
        return new Response(JSON.stringify({ error: "인증 토큰이 없습니다. 다시 로그인 해주세요." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
        });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
        console.error("❌ Invalid token:", authError?.message);
        return new Response(JSON.stringify({ error: "유효하지 않은 토큰입니다. 다시 로그인 해주세요." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
        });
    }

    console.log(`✅ Caller authenticated: ${caller.email}`);

    // ✨ [Production Auth] Step 2: Check if Caller is Admin
    // God Mode: anukbin@gmail.com always allowed
    const isGodMode = caller.email?.toLowerCase() === 'anukbin@gmail.com';
    let callerRole = null;

    if (!isGodMode) {
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("user_profiles")
            .select("role")
            .eq("id", caller.id)
            .single();

        if (profileError || !profile) {
            console.error("❌ Failed to fetch caller profile:", profileError?.message);
            return new Response(JSON.stringify({ error: "권한 확인에 실패했습니다." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }
        callerRole = profile.role;

        if (!["admin", "super_admin"].includes(callerRole)) {
            console.error(`❌ Access denied. Caller role: ${callerRole}`);
            return new Response(JSON.stringify({ error: "관리자 권한이 필요합니다." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }
    }

    console.log(`👑 Authorization passed. Role: ${isGodMode ? "GOD_MODE" : callerRole}`);

    // ✨ [Main Logic] Proceed with invitation
    try {
        const { email, name, role, ...details } = await req.json();

        if (!email) throw new Error("이메일 주소가 필요합니다.");

        console.log(`📧 Inviting user: ${email} as ${role}`);

        // 1. Send Invitation Email
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name, role, full_name: name },
            redirectTo: 'https://child-app-nibkuna.vercel.app/auth/update-password',
        });

        if (inviteError) {
            console.error("Invite Error:", inviteError.message);
            if (!inviteError.message.includes("already registered")) {
                throw inviteError;
            }
        }

        // 2. Resolve User ID
        let finalUserId = authData?.user?.id;
        if (!finalUserId) {
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const match = existingUser?.users?.find((u: any) => u.email === email);
            if (match) finalUserId = match.id;
        }

        if (!finalUserId) throw new Error("사용자 ID를 확인할 수 없습니다.");

        console.log(`👤 User ID resolved: ${finalUserId}`);

        // 3. Sync to 'therapists' table
        const { error: therapistError } = await supabaseAdmin
            .from("therapists")
            .upsert({
                email,
                name,
                system_role: role || 'therapist',
                system_status: 'active',
                ...details
            }, { onConflict: 'email' });

        if (therapistError) throw therapistError;

        // 4. Sync to 'user_profiles' table
        const { error: profileError } = await supabaseAdmin
            .from("user_profiles")
            .upsert({
                id: finalUserId,
                email,
                name,
                role: role || 'therapist',
                status: 'active',
                center_id: details.center_id
            }, { onConflict: 'id' });

        if (profileError) throw profileError;

        console.log(`✅ Invitation successful for ${email}`);

        return new Response(
            JSON.stringify({ message: "초대가 성공적으로 발송되었습니다.", userId: finalUserId }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("❌ Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
