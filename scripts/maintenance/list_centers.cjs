
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCenters() {
    const { data, error } = await supabase.from('centers').select('id, name, slug');
    console.log("Centers:", data);
}

listCenters();
