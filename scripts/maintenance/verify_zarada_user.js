
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUser() {
    console.log('🔍 Analyzing Duplicates for zaradajoo@gmail.com...');

    // 1. Get Auth User ID (The Truth)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const zaradaUser = users.find(u => u.email === 'zaradajoo@gmail.com');

    if (!zaradaUser) {
        console.log('❌ Auth User missing! (Are you on the right project?)');
        return;
    }
    console.log(`🔑 Real Auth ID (from auth.users): ${zaradaUser.id}`);

    // 2. Get Profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, role, name')
        .eq('email', 'zaradajoo@gmail.com');

    console.log('📊 Profiles Found:', profiles.length);
    profiles.forEach(p => {
        const isMatch = p.id === zaradaUser.id;
        const status = isMatch ? '✅ REAL USER' : '🧟 ZOMBIE';
        console.log(`- [${p.role}] Name: "${p.name}" | ID: ${p.id} | ${status}`);
    });

    // 3. Check Therapists
    const { data: therapists } = await supabase
        .from('therapists')
        .select('*')
        .eq('email', 'zaradajoo@gmail.com');

    console.log('🏥 Therapists Found:', therapists.length);
    therapists.forEach(t => {
        console.log(`- [${t.system_role}] Name: "${t.name}" | Status: ${t.system_status}`);
    });
}

verifyUser();
