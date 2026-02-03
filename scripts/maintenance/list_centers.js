
import { createClient } from '@supabase/supabase-js'

const url = 'https://brisqelgoxwsdqkltseo.supabase.co'
const key = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'

const supabase = createClient(url, key)

async function run() {
    console.log('Fetching centers...');
    const { data, error } = await supabase.from('centers').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

run();
