
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = 'https://brisqelgoxwsdqkltseo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'; // Cleaned key from output

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectTherapists() {
    console.log('--- Fetching Therapists ---');
    const { data: therapists, error } = await supabase
        .from('therapists')
        .select('*');

    if (error) {
        console.error('Error fetching therapists:', error);
        return;
    }

    console.log(`Found ${therapists.length} therapists.`);
    therapists.forEach(t => {
        console.log(`[${t.name}] ID: ${t.id}, Email: ${t.email}, ProfileID: ${t.profile_id}`);
    });

    console.log('\n--- Fetching User Profiles (for cross-reference) ---');
    const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('id, email, role, name');

    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    // Check specific user
    const superAdmin = profiles.find(p => p.role === 'super_admin');
    console.log('Super Admin Profile:', superAdmin);
}

inspectTherapists();
