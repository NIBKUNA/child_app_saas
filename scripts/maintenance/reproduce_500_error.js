import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
    console.log("Checking 'profiles' table for RLS recursion...");
    try {
        const { data, error } = await supabase.from('profiles').select('id, role').limit(1);
        if (error) {
            console.error('❌ FAIL: Database returned an error:');
            console.error(JSON.stringify(error, null, 2));
        } else {
            console.log('✅ SUCCESS: Profiles table is accessible.');
        }
    } catch (e) {
        console.error('❌ EXCEPTION:', e);
    }
}

checkProfiles();
