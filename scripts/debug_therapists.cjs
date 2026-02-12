const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';
const centerId = '02117996-fa99-4859-a640-40fb32968b2e';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Test 1: Direct query without center filter
    console.log('Test 1: All therapists without filter');
    const { data: all, error: e1 } = await supabase
        .from('therapists')
        .select('id, name, display_name, center_id')
        .limit(10);
    console.log('Error:', e1);
    console.log('Count:', all?.length);
    if (all) all.forEach(t => console.log(`  - ${t.display_name || t.name} [${t.center_id}]`));

    // Test 2: With center filter
    console.log('\nTest 2: With center_id =', centerId);
    const { data: filtered, error: e2 } = await supabase
        .from('therapists')
        .select('id, name, display_name')
        .eq('center_id', centerId);
    console.log('Error:', e2);
    console.log('Count:', filtered?.length);
    if (filtered) filtered.forEach(t => console.log(`  - ${t.display_name || t.name}`));

    // Test 3: Check centers table
    console.log('\nTest 3: Centers');
    const { data: centers, error: e3 } = await supabase
        .from('centers')
        .select('id, name, slug')
        .limit(5);
    console.log('Error:', e3);
    if (centers) centers.forEach(c => console.log(`  - ${c.name} [${c.id}] slug=${c.slug}`));
}

main();
