
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumn() {
    console.log("🔍 Checking 'therapists' table schema...");

    // Attempt to select 'system_role'
    const { data, error } = await supabase
        .from('therapists')
        .select('system_role')
        .limit(1);

    if (error) {
        console.log("❌ Error selecting 'system_role':", error.message);
        if (error.message.includes('does not exist')) {
            console.log("   -> CONCLUSION: Column 'system_role' is MISSING.");
        }
    } else {
        console.log("✅ Column 'system_role' EXISTS.");
    }
}

checkColumn();
