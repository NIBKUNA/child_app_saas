
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listAllTables() {
    const { data, error } = await supabase.rpc('get_tables'); // If they have an RPC, but they probably don't.

    // Instead, let's try to query information_schema if enabled, 
    // but usually anon/authenticated don't have access to information_schema.

    // Let's try to select from a few more common names.
    const tables = ['children', 'centers', 'profiles', 'therapists', 'counseling_logs', 'schedules', 'parents', 'user_profiles'];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table} exists.`);
        }
    }
}

listAllTables();
