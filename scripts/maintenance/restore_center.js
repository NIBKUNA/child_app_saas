
import { createClient } from '@supabase/supabase-js'

const url = 'https://brisqelgoxwsdqkltseo.supabase.co'
const key = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'

const supabase = createClient(url, key)

async function run() {
    console.log('Restoring Happy Child Development Center (Name Only)...');

    const { data, error } = await supabase
        .from('centers')
        .insert({
            name: '행복아동발달센터',
            // Address and Phone seem to be missing or cached out. Skipping for now to fix critical bug.
        })
        .select();

    if (error) {
        console.error('RESTORE FAILED:', error);
    } else {
        console.log('RESTORE SUCCESS:', data);
    }
}

run();
