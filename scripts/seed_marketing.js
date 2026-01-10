import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://brisqelgoxwsdqkltseo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
    console.log("🌱 Checking 'leads' table access...");

    // 1. Check Read Access
    const { data: leads, error: readError } = await supabase.from('leads').select('*').limit(5);

    if (readError) {
        console.error("❌ Read Error (Likely RLS):", readError.message);
        console.log("⚠️ Please run the provided SQL script in Supabase Dashboard.");
        process.exit(1);
    }

    console.log(`✅ Read Success. Found ${leads.length} leads.`);

    if (leads.length > 0) {
        console.log("ℹ️ Table is not empty. Review the export logic.");
        process.exit(0);
    }

    // 2. Insert Dummy Data
    console.log("📝 Table is empty. Attempting to insert dummy data...");

    const { error: insertError } = await supabase.from('leads').insert([
        {
            parent_name: '김철수 부모',
            phone: '010-1234-5678',
            child_name: '김철수',
            concern: '언어 발달 지연 문의',
            source: '네이버 블로그',
            status: 'new',
            created_at: new Date().toISOString()
        },
        {
            parent_name: '이영희 부모',
            phone: '010-9876-5432',
            child_name: '이영희',
            concern: '사회성 부족',
            source: '지인 소개',
            status: 'contacted',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    ]);

    if (insertError) {
        console.error("❌ Insert Error (Likely RLS):", insertError.message);
        console.log("⚠️ Please run the SQL script to fix permissions.");
    } else {
        console.log("✅ Success! Dummy marketing data inserted.");
        console.log("👉 Try downloading the Excel report again.");
    }
}

seed();
