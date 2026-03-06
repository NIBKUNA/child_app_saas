/**
 * ✨ zaradajoo@gmail.com 비밀번호 설정 스크립트
 * 
 * Google Social 로그인으로 생성된 계정에 이메일/비밀번호 로그인을 추가합니다.
 * 
 * 사용법: node scripts/maintenance/set_zaradajoo_password.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env 파일에서 직접 환경변수 읽기
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) return;
            const key = trimmed.slice(0, eqIdx).trim();
            let value = trimmed.slice(eqIdx + 1).trim();
            // 따옴표 제거
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = value;
        });
    } catch (e) {
        // 파일 없으면 무시
    }
}

const rootDir = path.resolve(__dirname, '../..');
loadEnv(path.join(rootDir, '.env'));
loadEnv(path.join(rootDir, '.env.local'));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ VITE_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    console.error('   .env 또는 .env.local 파일을 확인해주세요.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_EMAIL = 'zaradajoo@gmail.com';
const NEW_PASSWORD = 'mdcom0925!';

async function main() {
    console.log('🔐 비밀번호 설정 시작...');
    console.log('   대상: ' + TARGET_EMAIL);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ 사용자 목록 조회 실패:', listError.message);
        process.exit(1);
    }

    const targetUser = users.find(u => u.email === TARGET_EMAIL);

    if (!targetUser) {
        console.error('❌ ' + TARGET_EMAIL + ' 사용자를 찾을 수 없습니다.');
        process.exit(1);
    }

    console.log('✅ 사용자 발견: ' + targetUser.id);
    console.log('   Provider: ' + (targetUser.app_metadata && targetUser.app_metadata.provider || 'unknown'));

    const { data, error } = await supabase.auth.admin.updateUserById(targetUser.id, {
        password: NEW_PASSWORD,
        email_confirm: true,
    });

    if (error) {
        console.error('❌ 비밀번호 설정 실패:', error.message);
        process.exit(1);
    }

    console.log('');
    console.log('✅ ===================================');
    console.log('✅ 비밀번호 설정 완료!');
    console.log('✅ ===================================');
    console.log('   이메일: ' + TARGET_EMAIL);
    console.log('   비밀번호: ' + NEW_PASSWORD);
    console.log('');
    console.log('💡 이제 이메일/비밀번호로 로그인할 수 있습니다.');
    console.log('   (기존 Google 로그인도 계속 사용 가능합니다)');
}

main().catch(console.error);
