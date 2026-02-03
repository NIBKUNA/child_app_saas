
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('../../.env', 'utf8');
const url = env.match(/SUPABASE_URL=(.*)/)[1].trim().replace(/^['\"]|['\"]$/g, '');
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^['\"]|['\"]$/g, '');

const supabase = createClient(url, key);

async function run() {
    console.log("🔍 Checking constraints on counseling_logs...");
    const { data: constraints, error: checkError } = await supabase.rpc('exec_sql', {
        sql_query: `
            SELECT
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='counseling_logs';
        `
    });

    if (checkError) {
        console.error("❌ Error checking constraints:", checkError);
        return;
    }

    console.log("Current constraints:", JSON.stringify(constraints, null, 2));

    const sql = `
        BEGIN;
        -- Drop ALL constraints on counseling_logs that might be interfering
        ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_fkey;
        ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_profile_id_fkey;
        
        -- Add the correct one pointing to therapists(id)
        ALTER TABLE public.counseling_logs 
        ADD CONSTRAINT counseling_logs_therapist_id_fkey 
        FOREIGN KEY (therapist_id) 
        REFERENCES public.therapists(id) 
        ON DELETE SET NULL;
        
        COMMIT;
    `;

    console.log("🚀 Executing fix...");
    const { error: fixError } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (fixError) {
        console.error("❌ Fix failed:", fixError);
    } else {
        console.log("✅ Successfully updated counseling_logs constraint to point to therapists table!");
    }
}

run();
