
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// We need SERVICE_ROLE_KEY to check all profiles. 
// If it's not here, we use ANON_KEY but it might fail due to RLS.
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
    console.log(`Checking Admins in ${url}...`);
    const { data: admins, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'admin');

    if (error) console.error("Admins error:", error);
    else {
        console.log("Admins found:");
        admins.forEach(a => console.log(`- ${a.email} | Center: ${a.center_id} | Status: ${a.status}`));
    }
}

run();
