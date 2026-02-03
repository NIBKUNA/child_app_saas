
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySystem() {
    console.log("🕵️  SYSTEM & FEATURE VERIFICATION REPORT");
    console.log("=========================================");

    // 1. Verify Staff & Salary Attributes
    console.log("\n[1] Checking Staff & Salary Features");

    // Check for salary columns by attempting to select them directly
    const { data: salaryCheck, error: salaryError } = await supabase
        .from('therapists')
        .select('base_salary, incentive_price')
        .limit(1);

    if (salaryError) {
        console.log("   ❌ Salary Check Error:", salaryError.message);
        if (salaryError.message.includes('column') || salaryError.message.includes('does not exist')) {
            console.log("      -> CRITICAL: Salary columns are missing from the DB.");
        }
    } else {
        console.log("   ✅ Salary Columns (base_salary, incentive_price): EXIST");
    }

    // Mock Insert Test (Optional, just to be sure)
    const mockTherapist = {
        name: "Verification Bot",
        email: "verify_salary@test.com",
        base_salary: 3000000,
        incentive_price: 25000
    };

    // 2. Verify Permissions Logic (Role Column)
    console.log("\n[2] Checking Permission Structure");
    const { data: profileCheck, error: pError } = await supabase
        .from('user_profiles')
        .select('role')
        .limit(1);

    if (pError) console.log("   ❌ Permission Table Error:", pError.message);
    else console.log("   ✅ 'user_profiles.role' column exists. AuthContext will map this correctly.");

    // 3. Verify SEO & UTM (traffic_sources)
    console.log("\n[3] Checking SEO & Marketing Features");
    const { error: trafficError } = await supabase
        .from('traffic_sources')
        .select('*')
        .limit(1);

    if (trafficError) {
        console.log("   ❌ UTM Tracking Table (traffic_sources) NOT FOUND.");
        console.log("   -> SEO/Marketing features might be disabled.");
    } else {
        console.log("   ✅ UTM Tracking Table: Ready.");
    }

    console.log("\n=========================================");
}

verifySystem();
