
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    // Try to insert only with required center_id to see if it even works
    const { data: cData } = await supabase.from('centers').select('id').limit(1);
    const validId = cData[0].id;

    console.log("Using valid center_id:", validId);

    const fields = ['source_category', 'referrer_url', 'utm_source', 'utm_medium', 'utm_campaign', 'page_url', 'user_agent', 'visited_at'];

    for (const field of fields) {
        const payload = { center_id: validId };
        payload[field] = 'test';
        if (field === 'visited_at') payload[field] = new Date().toISOString();

        const { error } = await supabase.from('site_visits').insert(payload);
        if (error) {
            console.log(`❌ Field [${field}] failed:`, error.message);
        } else {
            console.log(`✅ Field [${field}] exists and works.`);
        }
    }
}

checkColumns();
