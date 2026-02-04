import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSuperAdmin() {
    const email = 'anukbin@gmail.com';
    console.log(`Checking Super Admin: ${email}`);

    const { data: profile, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (pError) console.error('Profile Error:', pError);
    console.log('Profile Data:', JSON.stringify(profile, null, 2));

    const { data: therapist, error: tError } = await supabase
        .from('therapists')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (tError) console.error('Therapist Error:', tError);
    console.log('Therapist Data:', JSON.stringify(therapist, null, 2));
}

checkSuperAdmin();
