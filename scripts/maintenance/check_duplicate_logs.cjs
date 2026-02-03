const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLogs() {
    console.log('🔍 Checking counseling_logs for potential duplicates...');

    // 박주영 아동의 최근 일지들 조회
    const { data, error } = await supabase
        .from('counseling_logs')
        .select('id, session_date, content, created_at')
        .order('session_date', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('Found Logs:');
    console.table(data.map(l => ({
        ID: l.id,
        Date: l.session_date,
        Therapist: l.therapists?.name,
        Content: l.content.substring(0, 20),
        Created: l.created_at
    })));

    console.log('\n💡 Tip: 만약 같은 날짜에 일지가 여러 개라면 중복입니다.');
    console.log('날짜가 27일, 28일로 다르다면 각각 다른 수업에 대한 일지가 생성된 것입니다.');
}

checkLogs();
