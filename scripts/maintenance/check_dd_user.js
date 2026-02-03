
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PRIVATE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking user_profiles for 'dd'...");
    const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('name', '%dd%');

    if (pError) console.error("Profile error:", pError);
    console.log("Profiles found:", profiles);

    console.log("\nChecking therapists for 'dd'...");
    const { data: therapists, error: tError } = await supabase
        .from('therapists')
        .select('*')
        .ilike('name', '%dd%');

    if (tError) console.error("Therapist error:", tError);
    console.log("Therapists found:", therapists);

    if (therapists && therapists.length > 0) {
        const email = therapists[0].email;
        console.log(`\nChecking auth.users for email: ${email}`);
        const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();

        if (uError) console.error("Auth error:", uError);
        const authUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        console.log("Auth user status:", authUser ? {
            id: authUser.id,
            email: authUser.email,
            confirmed_at: authUser.confirmed_at,
            last_sign_in_at: authUser.last_sign_in_at,
            created_at: authUser.created_at,
            invited_at: authUser.invited_at
        } : "Not found in auth.users");
    }
}

check();
