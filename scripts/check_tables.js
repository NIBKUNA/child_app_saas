
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listTables() {
    // We can use RPC or a query to a table we know exists to see what else is there, 
    // but the easiest way is to try selecting from a system table or just trying to select from 'children'

    console.log('Checking for "children" table...');
    const { data: childData, error: childError } = await supabase.from('children').select('*').limit(1);

    if (childError) {
        console.error('Children Table Error:', childError.message);
    } else {
        console.log('Children table exists and is accessible.');
    }

    console.log('\nChecking for "centers" table...');
    const { data: centerData, error: centerError } = await supabase.from('centers').select('*').limit(1);
    if (centerError) console.error('Centers Table Error:', centerError.message);
    else console.log('Centers table exists.');

    console.log('\nChecking for "profiles" table...');
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profileError) console.error('Profiles Table Error:', profileError.message);
    else console.log('Profiles table exists.');
}

listTables();
