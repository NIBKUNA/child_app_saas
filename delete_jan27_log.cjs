const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deleteLog() {
    console.log('🗑️ Attempting to delete unintended log for Jan 27...');

    // 1. Find the log first
    const { data: logs, error: findError } = await supabase
        .from('counseling_logs')
        .select('id, session_date, content, child_id')
        .eq('session_date', '2026-01-27')
        .limit(5);

    if (findError) {
        console.error('❌ Error finding logs:', findError);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('✅ No logs found for 2026-01-27.');
        return;
    }

    console.log('Found logs to delete:', logs);

    for (const log of logs) {
        console.log(`Deleting log ID: ${log.id}`);
        const { error: deleteError } = await supabase
            .from('counseling_logs')
            .delete()
            .eq('id', log.id);

        if (deleteError) {
            console.error(`❌ Failed to delete log ${log.id}:`, deleteError.message);
        } else {
            console.log(`✅ Deleted successfully.`);
        }
    }
}

deleteLog();
