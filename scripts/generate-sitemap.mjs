/**
 * 🗺️ Sitemap & Robots.txt 자동 생성 스크립트
 * 
 * Supabase에서 모든 센터 목록을 가져와 sitemap.xml을 자동 생성합니다.
 * 빌드 시 `npm run generate-sitemap` 으로 실행됩니다.
 * 
 * 사용법:
 *   node scripts/generate-sitemap.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// .env 파일에서 환경변수 수동 파싱 (dotenv 없이)
function loadEnv() {
    try {
        const envPath = resolve(ROOT, '.env');
        const content = readFileSync(envPath, 'utf-8');
        const vars = {};
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...rest] = trimmed.split('=');
            if (key && rest.length > 0) {
                vars[key.trim()] = rest.join('=').trim();
            }
        });
        return vars;
    } catch {
        console.error('⚠️  .env 파일을 찾을 수 없습니다.');
        return {};
    }
}

// 공개 페이지 경로 목록
const PUBLIC_PAGES = ['', '/about', '/programs', '/therapists', '/contact'];

// 메인 플랫폼 도메인
const PLATFORM_URL = 'https://app.myparents.co.kr';

async function generateSitemap() {
    console.log('🗺️  사이트맵 생성 시작...\n');

    const env = loadEnv();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 .env에 없습니다.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 모든 센터 가져오기
    const { data: centers, error } = await supabase
        .from('centers')
        .select('slug, name, custom_domain, updated_at')
        .order('name');

    if (error) {
        console.error('❌ 센터 조회 실패:', error.message);
        process.exit(1);
    }

    if (!centers || centers.length === 0) {
        console.warn('⚠️  등록된 센터가 없습니다.');
        return;
    }

    console.log(`📋 ${centers.length}개 센터 발견:\n`);

    const today = new Date().toISOString().split('T')[0];
    const urls = [];

    // 1. 메인 플랫폼 URL 생성 (모든 센터)
    centers.forEach(center => {
        const lastmod = center.updated_at
            ? new Date(center.updated_at).toISOString().split('T')[0]
            : today;

        PUBLIC_PAGES.forEach(page => {
            const loc = `${PLATFORM_URL}/centers/${center.slug}${page}`;
            const priority = page === '' ? '0.9' : '0.7';
            urls.push({ loc, lastmod, changefreq: 'weekly', priority });
        });

        // 커스텀 도메인이 있으면 로그만 출력 (별도 sitemap 필요)
        if (center.custom_domain) {
            console.log(`  🌐 ${center.name} → 커스텀 도메인: ${center.custom_domain}`);
            console.log(`     ⚠️  이 도메인은 네이버 서치어드바이저에 별도 등록이 필요합니다.`);
        } else {
            console.log(`  📍 ${center.name} → /centers/${center.slug}`);
        }
    });

    // 2. 글로벌 랜딩 페이지 추가
    urls.unshift({
        loc: `${PLATFORM_URL}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '1.0'
    });

    // 3. sitemap.xml 생성
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    writeFileSync(resolve(ROOT, 'public', 'sitemap.xml'), sitemap, 'utf-8');
    console.log(`\n✅ public/sitemap.xml 생성 완료 (${urls.length}개 URL)`);

    // 4. robots.txt 업데이트
    const robotsTxt = `User-agent: *
Allow: /
Allow: /centers
Allow: /centers/
Disallow: /app/
Disallow: /login
Disallow: /register
Disallow: /master/

# 센터별 공개 페이지는 적극 크롤링 허용
Allow: /centers/*

Sitemap: ${PLATFORM_URL}/sitemap.xml
`;

    writeFileSync(resolve(ROOT, 'public', 'robots.txt'), robotsTxt, 'utf-8');
    console.log('✅ public/robots.txt 업데이트 완료');

    // 5. 커스텀 도메인용 가이드 출력
    const customDomainCenters = centers.filter(c => c.custom_domain);
    if (customDomainCenters.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('📌 커스텀 도메인 센터 — 추가 작업 필요:');
        console.log('='.repeat(60));
        customDomainCenters.forEach(c => {
            console.log(`\n🏢 ${c.name} (${c.custom_domain})`);
            console.log(`   1. 네이버 서치어드바이저에서 ${c.custom_domain} 등록`);
            console.log(`   2. 사이트 관리 → 브랜딩 탭에서 네이버 인증 코드 입력`);
            console.log(`   3. 아래 사이트맵 URL을 서치어드바이저에 제출:`);
            console.log(`      → ${PLATFORM_URL}/sitemap.xml`);
            console.log(`      (또는 별도 사이트맵 생성 후 제출)`);
        });
    }

    console.log('\n🎉 완료!\n');
}

generateSitemap().catch(console.error);
