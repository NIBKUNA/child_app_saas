// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Hack to silence Deno errors in non-Deno environment
declare const Deno: any;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { email, name, role, ...details } = await req.json();

        if (!email) throw new Error("Email is required");

        console.log(`📧 Inviting user: ${email} as ${role}`);

        // 1. Send Invitation Email (Magic Link / Password Setup)
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name, role, full_name: name },
            redirectTo: 'https://child-app-nibkuna.vercel.app/update-password', // Update this if needed
        });

        if (inviteError) {
            console.error("Invite Error:", inviteError.message);
            // If user already exists, just proceed to update tables (idempotent)
            if (!inviteError.message.includes("already registered")) {
                throw inviteError;
            }
        }

        const userId = authData?.user?.id;

        // Retrieve ID if valid user exists but invite failed due to "already registered"
        let finalUserId = userId;
        if (!finalUserId) {
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            if (existingUser && existingUser.users) {
                const match = existingUser.users.find((u: any) => u.email === email);
                if (match) finalUserId = match.id;
            }
        }

        if (!finalUserId) throw new Error("Failed to resolve User ID");

        console.log(`👤 User ID resolved: ${finalUserId}`);

        // 2. Sync to 'therapists' table (The "Master Staff List")
        const { error: therapistError } = await supabaseAdmin
            .from("therapists")
            .upsert({
                email,
                name,
                system_role: role || 'therapist',
                system_status: 'active', // Pre-activate for seamless entry
                ...details
            }, { onConflict: 'email' });

        if (therapistError) throw therapistError;

        // 3. Sync to 'profiles' table (The "User Profile")
        // This ensures they have the role IMMEDIATELY upon first login
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: finalUserId,
                email,
                name,
                role: role || 'therapist',
                status: 'active',
                center_id: details.center_id
            }, { onConflict: 'id' });

        if (profileError) throw profileError;

        return new Response(
            JSON.stringify({ message: "User invited and synced successfully", userId: finalUserId }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
