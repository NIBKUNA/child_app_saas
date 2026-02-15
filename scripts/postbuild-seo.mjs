/**
 * 🚀 postbuild-seo.mjs — 빌드 후 센터별 SEO 메타태그 HTML 생성
 * 
 * 네이버봇은 JavaScript를 실행하지 않으므로,
 * 빌드 후 각 센터 페이지의 index.html에 SEO 메타태그를 미리 삽입합니다.
 * 
 * 실행: npm run build 후 자동 실행 (postbuild)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const PLATFORM_URL = 'https://app.myparents.co.kr';

// .env 파일 파싱
function loadEnv() {
    try {
        const content = readFileSync(resolve(ROOT, '.env'), 'utf-8');
        const vars = {};
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...rest] = trimmed.split('=');
            if (key && rest.length > 0) vars[key.trim()] = rest.join('=').trim();
        });
        return vars;
    } catch { return {}; }
}

// ────────────────────────────────────────────────────
// 지역 추출 로직 (useLocalSEO.ts와 동일 우선순위)
// ────────────────────────────────────────────────────

// 🗺️ 주소에서 지역 키워드 추출 (fallback용)
function extractRegionFromAddress(address) {
    if (!address) return '';
    const parts = address.split(' ').filter(Boolean);
    if (parts.length >= 3) {
        const gu = parts[1].replace(/[시군구]$/, '');
        const dong = parts[2].replace(/[동읍면리로길]$/, '');
        if (parts[2].match(/[동읍면]$/)) return `${gu} ${dong}`;
        return gu;
    }
    if (parts.length >= 2) return parts[1].replace(/[시군구]$/, '');
    return '';
}

// 🏷️ 센터 이름에서 대표 지역 추출
// "자라다 아동심리발달센터 잠실점" → "잠실"
function extractRegionFromName(name) {
    if (!name) return null;
    const match = name.match(/\s(\S+?)(?:점|지점)\s*$/);
    if (match) {
        return match[1];
    }
    return null;
}

// 📌 수동 설정(seo_region) 가져오기
async function getSeoRegion(supabase, centerId) {
    const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('center_id', centerId)
        .eq('key', 'seo_region')
        .maybeSingle();
    return data?.value || '';
}

// 🥇 지역 추출 (우선순위: seo_region > 센터이름 > 주소)
async function resolveRegion(supabase, center) {
    const seoRegion = await getSeoRegion(supabase, center.id);
    const nameRegion = extractRegionFromName(center.name);
    const addressRegion = extractRegionFromAddress(center.address);
    return seoRegion || nameRegion || addressRegion;
}

// ────────────────────────────────────────────────────
// SEO 데이터 생성
// ────────────────────────────────────────────────────

function generateSEO(center, region, pageType) {
    const name = center.name || '아동발달센터';
    const r = region ? `${region} ` : '';

    const titles = {
        home: region ? `${region} 아동발달센터 - ${name} | 언어치료・감각통합` : `${name} | 아동발달센터`,
        about: region ? `${region} 아동발달센터 소개 | ${name} - 치료 철학과 비전` : `센터 소개 - ${name}`,
        programs: region ? `${region} 언어치료・감각통합 프로그램 | ${name}` : `프로그램 안내 - ${name}`,
        therapists: region ? `${region} 아동 전문 치료사 소개 | ${name}` : `치료사 소개 - ${name}`,
        contact: region ? `${region} 아동발달센터 오시는 길 | ${name} - 위치・예약` : `오시는 길 - ${name}`,
    };

    const descs = {
        home: `${r}${name} - 언어치료, 감각통합, 놀이치료, 미술치료 전문 아동발달센터. 아이의 잠재력을 키워주세요.`,
        about: `${r}${name}의 치료 철학과 비전. 근거 기반의 전문 치료와 따뜻한 가족 중심 케어를 제공합니다.`,
        programs: `${r}${name}에서 제공하는 언어치료, 감각통합, 놀이치료, 미술치료, 그룹치료 프로그램 안내.`,
        therapists: `${r}${name}의 전문 치료사 소개. 자격증, 경력, 전문 분야를 확인하세요.`,
        contact: `${r}${name} 오시는 길, 연락처, 운영시간 안내. 상담 예약 및 방문 안내.`,
    };

    const keywords = [
        `${region} 아동발달센터`, `${region} 언어치료`, `${region} 감각통합`,
        `${region} 놀이치료`, `${region} 미술치료`, name
    ].filter(k => k.trim()).join(', ');

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": name,
        "url": `${PLATFORM_URL}/centers/${center.slug}`,
        ...(center.phone && { "telephone": center.phone }),
        "image": center.logo_url || '',
        ...(center.address && {
            "address": {
                "@type": "PostalAddress",
                "streetAddress": center.address,
                "addressLocality": region || "서울",
                "addressCountry": "KR"
            }
        }),
        "medicalSpecialty": ["SpeechPathology", "Pediatrics"],
    };

    return {
        title: titles[pageType] || titles.home,
        description: descs[pageType] || descs.home,
        keywords,
        jsonLd,
    };
}

// ────────────────────────────────────────────────────
// HTML 수정
// ────────────────────────────────────────────────────

function injectSEO(html, seo, canonicalUrl, center) {
    let modified = html;

    modified = modified.replace(
        /<title>[^<]*<\/title>/,
        `<title>${seo.title}</title>`
    );

    const seoTags = `
    <!-- 🤖 Pre-rendered SEO for ${center.name} -->
    <meta name="description" content="${seo.description}" />
    <meta name="keywords" content="${seo.keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${center.name}" />
    <meta property="og:locale" content="ko_KR" />
    ${center.logo_url ? `<meta property="og:image" content="${center.logo_url}" />` : ''}
    <script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>
  `;

    modified = modified.replace('</head>', `${seoTags}</head>`);
    return modified;
}

// ────────────────────────────────────────────────────
// 메인 실행
// ────────────────────────────────────────────────────

const PAGES = [
    { path: '', type: 'home' },
    { path: '/about', type: 'about' },
    { path: '/programs', type: 'programs' },
    { path: '/therapists', type: 'therapists' },
    { path: '/contact', type: 'contact' },
];

async function main() {
    console.log('\n🚀 센터별 SEO HTML 생성 시작...\n');

    const indexPath = resolve(DIST, 'index.html');
    if (!existsSync(indexPath)) {
        console.error('❌ dist/index.html이 없습니다. 먼저 vite build를 실행하세요.');
        process.exit(1);
    }

    const baseHtml = readFileSync(indexPath, 'utf-8');
    const env = loadEnv();
    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

    const { data: centers, error } = await supabase
        .from('centers')
        .select('id, slug, name, address, phone, logo_url, custom_domain')
        .order('name');

    if (error || !centers) {
        console.error('❌ 센터 조회 실패:', error?.message);
        process.exit(1);
    }

    let totalFiles = 0;

    for (const center of centers) {
        const region = await resolveRegion(supabase, center);
        console.log(`📍 ${center.name} (${region || '지역 미설정'}) → /centers/${center.slug}`);

        for (const page of PAGES) {
            const seo = generateSEO(center, region, page.type);
            const canonicalUrl = `${PLATFORM_URL}/centers/${center.slug}${page.path}`;
            const html = injectSEO(baseHtml, seo, canonicalUrl, center);

            const dirPath = page.path
                ? resolve(DIST, 'centers', center.slug, page.path.slice(1))
                : resolve(DIST, 'centers', center.slug);

            mkdirSync(dirPath, { recursive: true });
            writeFileSync(resolve(dirPath, 'index.html'), html, 'utf-8');
            totalFiles++;
        }
    }

    console.log(`\n✅ ${centers.length}개 센터 × ${PAGES.length}개 페이지 = ${totalFiles}개 HTML 파일 생성 완료!`);
    console.log('   네이버봇이 각 센터 페이지의 SEO 메타태그를 직접 읽을 수 있습니다.\n');
}

main().catch(console.error);
