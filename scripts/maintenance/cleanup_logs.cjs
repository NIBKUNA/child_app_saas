const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanUp() {
    // Try to get logs without any joins to avoid "ambiguous" errors
    const { data: logs, error } = await supabase
        .from('counseling_logs')
        .select('id, session_date')
        .eq('session_date', '2026-01-27');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (logs && logs.length > 0) {
        for (const log of logs) {
            console.log('Deleting:', log.id);
            await supabase.from('counseling_logs').delete().eq('id', log.id);
        }
    } else {
        console.log('No logs found for Jan 27');
    }
}
cleanUp();
