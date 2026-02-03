
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
    console.log("🔧 Starting DB constraints fix...");

    const sql = `
    BEGIN;
    
    -- 1. Fix counseling_logs FK constraint
    -- Drop existing constraint explicitly
    ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_fkey;
    ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_profile_id_fkey;

    -- Add correct constraint referencing 'therapists' table
    ALTER TABLE public.counseling_logs 
    ADD CONSTRAINT counseling_logs_therapist_id_fkey 
    FOREIGN KEY (therapist_id) 
    REFERENCES public.therapists(id) 
    ON DELETE SET NULL;

    -- 2. Ensure site_visits has page_url column
    ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS page_url TEXT;

    COMMIT;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("❌ SQL Execution Failed:", error);
        console.log("ℹ️  Note: If 'exec_sql' RPC does not exist, you must run the SQL manually in Supabase Dashboard.");
    } else {
        console.log("✅ SQL executed successfully via RPC.");
        console.log("   - Fixed counseling_logs FK to point to 'therapists(id)'");
        console.log("   - Ensured site_visits table has 'page_url'");
    }
}

fixDatabase();
