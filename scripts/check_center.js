import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCenter(id) {
    const { data, error } = await supabase
        .from('centers')
        .select('name, slug')
        .eq('id', id)
        .maybeSingle();

    if (data) {
        console.log(`Center found: ${data.name} (${data.slug})`);
    } else {
        console.log('Center not found.');
    }
}

checkCenter('cf36b06f-8eea-42e4-af09-5b4e8161d6b3');
