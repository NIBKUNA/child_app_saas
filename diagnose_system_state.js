import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://brisqelgoxwsdqkltseo.supabase.co";
// Use Anon Key (simulating frontend)
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const CENTER_ID = "59d09adf-4c98-4013-a198-d7b26018fd29";

if (!supabaseKey) {
    console.error("❌ MISSING ANON KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("🔍 ZARADA SYSTEM DIAGNOSTIC (STAGING/LEGACY HYBRID)");
    console.log("===================================================");

    // 1. Check Center
    console.log(`\n[1] Checking Center (${CENTER_ID})`);
    const { data: center, error: centerError } = await supabase
        .from('centers')
        .select('*')
        .eq('id', CENTER_ID)
        .maybeSingle();

    if (centerError) console.log("❌ Center Fetch Error:", centerError.message);
    else if (!center) console.log("❌ Center NOT FOUND in DB (Frontend will crash without GOD MODE)");
    else console.log("✅ Center Found:", center.name, `(${center.slug})`);

    // 2. Check Admin Profile (anukbin@gmail.com)
    console.log(`\n[2] Checking Admin Profile (anukbin@gmail.com)`);
    // Note: We can't query by email easily with RLS if we are anon, 
    // BUT if RLS is disabled (Nuclear option), we MIGHT see it or get 403.
    // Let's try to query 'user_profiles' generally.
    const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5);

    if (profileError) {
        console.log("⚠️ Profile Access Error:", profileError.message);
        console.log("   -> If RLS is ON, this is expected for Anon.");
        console.log("   -> If Nuclear Option is ON, this might mean permissions are still tight.");
    } else {
        console.log(`✅ Profiles Accessible (Count: ${profiles.length})`);
        const admin = profiles.find(p => p.email?.includes('anukbin'));
        if (admin) console.log("   -> Admin Profile Found:", admin.role, admin.status);
        else console.log("   -> Admin Profile NOT in the first 5 rows (might still exist)");
    }

    // 3. Check Therapists
    console.log(`\n[3] Checking Therapists`);
    const { data: therapists, error: thError } = await supabase
        .from('therapists')
        .select('id, name, email')
        .limit(5);

    if (thError) console.log("❌ Therapist Error:", thError.message);
    else console.log(`✅ Therapists Found: ${therapists.length} rows`);

    // 4. Check Children
    console.log(`\n[4] Checking Children`);
    const { data: children, error: chError } = await supabase
        .from('children')
        .select('id, name')
        .limit(5);

    if (chError) console.log("❌ Children Error:", chError.message);
    else console.log(`✅ Children Found: ${children.length} rows`);

    console.log("\n===================================================");
}

diagnose();
