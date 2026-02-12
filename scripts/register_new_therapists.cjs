/**
 * 1) 문상원 센터장 career 복원
 * 2) 스크린샷 5명의 새 프로필 등록
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';
const centerId = 'd7008d16-864f-430d-8dc1-d5aa77d539b4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // ═══════════════════════════════════════════════════
    // Step 1: 문상원 센터장의 원래 career 복원
    // ═══════════════════════════════════════════════════
    console.log('\n🔧 Step 1: 문상원 센터장 career 복원...');

    // 먼저 현재 career 확인
    const { data: moon, error: moonErr } = await supabase
        .from('therapists')
        .select('id, career')
        .eq('center_id', centerId)
        .ilike('display_name', '%문상원%')
        .single();

    if (moonErr) {
        console.error('문상원 조회 실패:', moonErr);
    } else {
        console.log(`  현재 career: ${moon.career?.split('\n')[0]}`);
        // 문상원 센터장의 career는 이미 16줄이었는데 10줄로 덮어쓴 상태
        // 원래 career를 모르므로, 기존 값을 복원해야 함
        // 이전 출력에서 16줄이었으니, 원래 데이터를 확인해야 함
        console.log('  ⚠️ 원래 career를 가져올 수 없으므로 직접 확인 필요');
        console.log('  현재 career 내용:');
        console.log(moon.career);
    }

    // ═══════════════════════════════════════════════════
    // Step 2: 현재 등록된 치료사 확인
    // ═══════════════════════════════════════════════════
    console.log('\n📋 현재 등록된 치료사:');
    const { data: existing } = await supabase
        .from('therapists')
        .select('id, name, display_name')
        .eq('center_id', centerId)
        .order('sort_order');

    existing.forEach((t, i) => console.log(`  ${i + 1}. ${t.display_name || t.name}`));

    // ═══════════════════════════════════════════════════
    // Step 3: 새 프로필 5명 등록
    // ═══════════════════════════════════════════════════
    console.log('\n🆕 Step 3: 새 프로필 5명 등록...');

    const newProfiles = [
        {
            name: '장○정',
            display_name: '언어치료사 장○정',
            specialties: '언어치료',
            career: [
                '현)',
                '다산 위드미 메디컬의원 부설 아동발달클리닉',
                '전)',
                '정담언어학습연구소',
                '두루바른사회적협동조합',
                '자격)',
                '한림대 언어병리학 학사',
                '한림대 언어병리학 석박사',
                '언어재활사 2급',
                '문해교육전문가 과정 수료'
            ].join('\n'),
            sort_order: 10
        },
        {
            name: '김○진',
            display_name: '언어치료사 김○진',
            specialties: '언어치료',
            career: [
                '현)',
                '다산 위드미 메디컬의원 부설 아동발달클리닉',
                '자격)',
                '한림대 언어병리학 학사',
                '한림대 청소년학과 학사',
                'YCS (You can speak) 계획 및 진행',
                '언어재활사 2급',
                'BeDevel 워크숍 수료',
                '난독증 등 학습장애 전문가 3급',
                '소그룹 그룹치료 기초 이수',
                '구개열 아동의 언어재활 기초 이수'
            ].join('\n'),
            sort_order: 11
        },
        {
            name: '정○연',
            display_name: '언어치료사 정○연',
            specialties: '언어치료',
            career: [
                '현)',
                '다산 위드미 메디컬의원 부설 아동발달클리닉',
                '전)',
                '라솜메디컬의원 아동발달 클리닉 언어재활사',
                '자격)',
                '한림대학교 언어병리학전공 졸업',
                '한림대학교 사회복지학부 졸업',
                '언어재활사 2급',
                '난독증교육지도사 1급',
                '경계선지능상담사 1급'
            ].join('\n'),
            sort_order: 12
        },
        {
            name: '손○희',
            display_name: '언어치료사 손○희',
            specialties: '언어치료',
            career: [
                '현)',
                '다산 위드미 메디컬의원 부설 아동발달클리닉',
                '자격)',
                '대림대 언어치료학과 (전공심화)',
                '언어재활사 2급',
                '부모교육상담사 1급',
                '아동심리상담사 1급',
                '난독증 및 학습장애 전문가 3급',
                '대한후두음성언어의학회 제 11회 음성 연수회 교육 이수',
                'The 15th World Congress of the International Cleft Lip and Palate Foundation',
                '화용언어 스킬업 짝치료 교육 이수'
            ].join('\n'),
            sort_order: 13
        },
        {
            name: '조○나',
            display_name: '언어치료사 조○나',
            specialties: '언어치료',
            career: [
                '현)',
                '다산 위드미 메디컬의원 부설 아동발달클리닉',
                '전)',
                '전북대학교병원 소아청소년과 언어치료사',
                '전북대학교병원 공공의료사업 다문화가정자녀 언어교정사업 언어치료사',
                '황양희 언어발달센터',
                '장수군 드림스타트 사업 파견',
                '은혜랑 심리발달 상담 센터',
                '다솔 아동병원부설 아이들케어',
                '언어평가 및 언어치료를 위한 학령전기 아동의',
                '한국어 코퍼스 구축 어휘 데이터 베이스 개발연구 보조',
                '자격)',
                '언어재활사 1급',
                '한국언어재활사협회 정회원',
                '난독증 등 학습장애 전문가 3급',
                '전문가를 위한 인공와우 이식과 재활 워크숍 Ⅰ&Ⅱ 수료'
            ].join('\n'),
            sort_order: 14
        }
    ];

    for (const profile of newProfiles) {
        const randomId = Math.random().toString(36).substring(2, 10);
        const insertData = {
            center_id: centerId,
            name: profile.name,
            display_name: profile.display_name,
            email: `display+${randomId}@zarada.local`,
            specialties: profile.specialties,
            career: profile.career,
            system_status: 'active',
            hire_type: 'freelancer',
            system_role: 'therapist',
            is_active: true,
            website_visible: true,
            sort_order: profile.sort_order
        };

        const { error: insertError } = await supabase
            .from('therapists')
            .insert(insertData);

        if (insertError) {
            console.log(`  ❌ ${profile.display_name} 등록 실패: ${insertError.message}`);
        } else {
            console.log(`  ✅ ${profile.display_name} 등록 완료`);
        }
    }

    // ═══════════════════════════════════════════════════
    // Step 4: 최종 확인
    // ═══════════════════════════════════════════════════
    console.log('\n📋 최종 치료사 목록:');
    const { data: final } = await supabase
        .from('therapists')
        .select('id, name, display_name, career, sort_order, website_visible')
        .eq('center_id', centerId)
        .order('sort_order');

    final.forEach((t, i) => {
        const careerCount = t.career ? t.career.split('\n').length + '줄' : '없음';
        console.log(`  ${i + 1}. [${t.website_visible ? '🌐' : '🔒'}] ${t.display_name || t.name} (career: ${careerCount}, sort: ${t.sort_order})`);
    });

    console.log('\n✨ 완료!\n');
}

main();
