
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing insert into site_visits...");
    const { data, error } = await supabase.from('site_visits').insert({
        center_id: '02117996-fa99-4859-a640-40fb32968b2e',
        source_category: 'Test'
    }).select();

    if (error) {
        console.error("Test failed:", error);
    } else {
        console.log("Test success:", data);
    }
}

test();
