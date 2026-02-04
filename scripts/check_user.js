import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
    console.log(`Checking profile for: ${email}`);
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user profile:', error);
        return;
    }

    if (data) {
        console.log('User profile found:');
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log('No user profile found for this email.');

        // Check therapists table
        const { data: therapist, error: tError } = await supabase
            .from('therapists')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

        if (tError) {
            console.error('Error fetching therapist:', tError);
        } else if (therapist) {
            console.log('User found in therapists table (but no profile yet):');
            console.log(JSON.stringify(therapist, null, 2));
        } else {
            console.log('No therapist record found either.');
        }
    }
}

const targetEmail = 'zombi00000@naver.com';
checkUser(targetEmail);
