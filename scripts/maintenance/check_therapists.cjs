const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTherapists() {
    console.log('🔍 Checking therapists table...');
    const centerId = 'cf36b06f-8eea-42e4-af09-5b4e8161d6b3';
    console.log('Using Center ID:', centerId);

    const { data, error } = await supabase
        .from('therapists')
        .select('email, name, center_id, system_status')
        .eq('center_id', centerId);

    if (error) {
        console.error('❌ Error fetching therapists:', error);
        return;
    }

    console.log('Therapists found:');
    console.table(data);
}

checkTherapists();
