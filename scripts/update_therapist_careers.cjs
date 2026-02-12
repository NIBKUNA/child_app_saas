/**
 * 치료사 이력(career) 일괄 업데이트 스크립트
 * 스크린샷의 이력 데이터를 DB에 입력합니다.
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vspinpxqhulyfivikkij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcGlucHhxaHVseWZpdmlra2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTEzMzcsImV4cCI6MjA4NDc2NzMzN30.qd-luZCllBd4oCq5u-LHgM0RWHEy6y6_gXcFeJwRx6w';
// ✅ 실제 다산 위드미 센터 ID
const centerId = 'd7008d16-864f-430d-8dc1-d5aa77d539b4';

const supabase = createClient(supabaseUrl, supabaseKey);

// 스크린샷에서 읽은 이력 데이터 (기존 문상원 센터장 포맷에 맞춤)
const careerUpdates = [
    {
        nameMatch: '장',
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
        ].join('\n')
    },
    {
        nameMatch: '김',
        nameMatch2: '진',
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
        ].join('\n')
    },
    {
        nameMatch: '정',
        nameMatch2: '연',
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
        ].join('\n')
    },
    {
        nameMatch: '손',
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
        ].join('\n')
    },
    {
        nameMatch: '조',
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
        ].join('\n')
    }
];

async function main() {
    // 1. 해당 센터의 모든 치료사 조회
    const { data: therapists, error } = await supabase
        .from('therapists')
        .select('id, name, display_name, career')
        .eq('center_id', centerId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('조회 실패:', error);
        return;
    }

    console.log(`\n📋 등록된 치료사 ${therapists.length}명:\n`);
    therapists.forEach((t, i) => {
        console.log(`  ${i + 1}. [${t.id.slice(0, 8)}] ${t.display_name || t.name} | career: ${t.career ? '있음 (' + t.career.split('\n').length + '줄)' : '❌ 없음'}`);
    });

    // 2. 매칭 및 업데이트
    console.log('\n🔄 이력 업데이트 시작...\n');

    for (const update of careerUpdates) {
        // display_name에서 매칭 (예: "언어치료사 장○정" 에서 '장' 검색)
        const matched = therapists.find(t => {
            const dn = t.display_name || t.name || '';
            const hasP1 = dn.includes(update.nameMatch);
            const hasP2 = update.nameMatch2 ? dn.includes(update.nameMatch2) : true;
            return hasP1 && hasP2;
        });

        if (!matched) {
            console.log(`  ❌ "${update.nameMatch}" 패턴 매칭 실패 - 수동 확인 필요`);
            continue;
        }

        console.log(`  📝 매칭: "${matched.display_name || matched.name}" [${matched.id.slice(0, 8)}]`);

        const { error: updateError } = await supabase
            .from('therapists')
            .update({ career: update.career })
            .eq('id', matched.id);

        if (updateError) {
            console.log(`     ❌ 업데이트 실패: ${updateError.message}`);
        } else {
            console.log(`     ✅ career 업데이트 완료 (${update.career.split('\n').length}줄)`);
        }
    }

    console.log('\n✨ 완료!\n');
}

main();
