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

    try {
        // 1. [Auth] Verify the Caller's Authority (Anti-Privilege Escalation)
        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // Get the caller's profile
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized: Invalid session");

        // 2. [Admin] Service Role Client for high-privilege operations
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "",
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Fetch profile using Admin Client to bypass RLS for the check itself
        const { data: callerProfile } = await supabaseAdmin
            .from("user_profiles")
            .select("role, center_id")
            .eq("id", user.id)
            .maybeSingle();

        const SUPER_ADMINS = ['anukbin@gmail.com', 'zaradajoo@gmail.com'];
        const isSuperAdmin = SUPER_ADMINS.includes(user.email || '');
        const isAdmin = callerProfile?.role === 'admin';

        if (!isSuperAdmin && !isAdmin) {
            throw new Error("Unauthorized: Only admins can invite users");
        }

        const { email, name, role, center_id, redirectTo: clientRedirectTo, ...details } = await req.json();
        const origin = req.headers.get("origin") || "https://app.myparents.co.kr";
        const finalRedirectTo = clientRedirectTo || `${origin}/auth/update-password`;

        if (!email) throw new Error("Email is required");

        // 🛡️ Cross-Center Prevention: Branch admins can only invite to THEIR own center
        const targetCenterId = isSuperAdmin ? center_id : callerProfile.center_id;
        if (!targetCenterId) throw new Error("Center identification failed");

        console.log(`📧 Inviting user: ${email} as ${role} for center: ${targetCenterId}`);
        console.log(`🔗 Redirecting to: ${finalRedirectTo}`);

        // 3. Send Invitation Email
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name, role, full_name: name, center_id: targetCenterId },
            redirectTo: finalRedirectTo,
        });

        if (inviteError) {
            console.error("Invite Error:", inviteError.message);
            // If user exists, we still continue to sync profiles (Recovery scenario)
            if (!inviteError.message.includes("already registered")) {
                throw inviteError;
            }
        }

        // 4. Resolve User ID
        let finalUserId = authData?.user?.id;
        if (!finalUserId) {
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const match = existingUser?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            if (match) finalUserId = match.id;
        }

        if (!finalUserId) throw new Error("Failed to resolve User ID");

        // 5. Sync Data (Strictly bound to center_id)
        // Update user_profiles
        const { error: profileSyncError } = await supabaseAdmin
            .from("user_profiles")
            .upsert({
                id: finalUserId,
                email,
                name,
                role: role || 'therapist',
                status: 'active',
                center_id: targetCenterId
            }, { onConflict: 'id' });

        if (profileSyncError) throw profileSyncError;

        // If it's a therapist, sync to therapists table too
        if (role === 'therapist') {
            const { error: therapistError } = await supabaseAdmin
                .from("therapists")
                .upsert({
                    email,
                    name,
                    center_id: targetCenterId,
                    system_role: 'therapist',
                    system_status: 'active',
                    ...details
                }, { onConflict: 'email' });

            if (therapistError) throw therapistError;
        }

        console.log(`✅ User ${email} successfully joined center ${targetCenterId}`);

        return new Response(
            JSON.stringify({ message: "User invited and synced successfully", userId: finalUserId }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: any) {
        console.error("❌ Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
