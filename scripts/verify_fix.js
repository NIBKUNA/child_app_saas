
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyFix() {
    console.log('--- 🔍 데이터베이스 최종 무결성 점검 ---');

    // 1. 발달 평가 테이블 존재 확인
    console.log('\n1. 테이블 존재 확인: development_assessments');
    const { data: assessData, error: assessError } = await supabase
        .from('development_assessments')
        .select('*')
        .limit(1);

    if (assessError) {
        console.error('❌ 테이블 접근 실패:', assessError.message);
    } else {
        console.log('✅ 테이블이 정상적으로 존재하며 접근 가능합니다.');
    }

    // 2. 다른 핵심 테이블 접근 권한 확인 (RLS 점검)
    const criticalTables = ['children', 'therapists', 'counseling_logs', 'family_relationships'];
    console.log('\n2. 핵심 테이블 RLS 접근 확인 (Anon Key 기준):');

    for (const table of criticalTables) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
        // Anon key로는 보통 데이터가 안 보일 수 있으나(0개), 에러가 나지 않으면 정책이 유효한 상태임
        if (error) {
            console.log(`⚠️ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: 정상 (접근 가능)`);
        }
    }

    // 3. 최근 상담 기록 확인 (평가 대기목록 데이터가 있는지)
    console.log('\n3. 최근 상담 로그 샘플 (치료 기록):');
    const { data: logSample, error: logError } = await supabase
        .from('counseling_logs')
        .select('id, child_id, therapist_id, session_date')
        .limit(3)
        .order('created_at', { ascending: false });

    if (logError) {
        console.error('❌ 로그 조회 실패:', logError.message);
    } else if (logSample?.length === 0) {
        console.log('ℹ️ 작성된 상담 로그가 없습니다. (테스트 데이터 필요)');
    } else {
        console.table(logSample);
        console.log('✅ 로그 데이터를 정상적으로 불러왔습니다.');
    }

    console.log('\n--- 점검 종료 ---');
}

verifyFix();
