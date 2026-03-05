/**
 * 🔍 SEO Prerender API
 * Vercel Serverless Function
 *
 * 크롤러(Googlebot, Naverbot 등)가 센터 페이지 접근 시
 * React SPA 대신 완전한 HTML을 서버에서 렌더링하여 반환합니다.
 *
 * 일반 사용자는 기존 SPA로 동작합니다.
 * vercel.json의 has 조건(User-Agent)으로 분기됩니다.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { BASE_URL, isDefaultDomain as checkDefaultDomain } from './_config.js';

interface CenterData {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    weekday_hours: string | null;
    saturday_hours: string | null;
    holiday_text: string | null;
    representative: string | null;
    logo_url: string | null;
    naver_map_url: string | null;
}

interface TherapistProfile {
    display_name: string;
    specialties: string | null;
    bio: string | null;
}

interface ProgramData {
    name: string;
    description: string | null;
    category: string | null;
    duration: number | null;
}

function getSupabase(): any {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    return createClient(url, key);
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// 페이지별 렌더러
// ============================================

/** 글로벌 랜딩 페이지 (/) */
async function renderGlobalLanding(supabase: any): Promise<string> {
    const { data: centers } = await supabase
        .from('centers')
        .select('name, slug, address')
        .eq('is_active', true)
        .order('name');

    const centerList = (centers || []) as { name: string; slug: string; address: string | null }[];

    const title = '자라다(Zarada) | 아동발달센터 컨설팅 · 마케팅 · 운영 솔루션';
    const description = '아동발달센터 운영에 필요한 모든 것. 센터 컨설팅, 마케팅 대행, 아동 치료 프로그램, ERP 운영 솔루션까지. 소아과·재활의학과·아동발달센터 원장님을 위한 통합 파트너 자라다입니다.';
    const url = BASE_URL;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '자라다(Zarada)',
        description: description,
        url: url,
        logo: `${BASE_URL}/zaradalogo.png`,
        sameAs: [],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: 'Korean',
        },
    };

    const faqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: '자라다(Zarada)는 어떤 서비스인가요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: '자라다는 아동발달센터의 운영을 위한 통합 관리 솔루션입니다. 상담 예약, 수업 스케줄, 발달 평가, 수납 관리 등 센터 운영에 필요한 모든 기능을 제공합니다.',
                },
            },
            {
                '@type': 'Question',
                name: '어떤 치료 프로그램을 지원하나요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: '언어치료, 놀이치료, 감각통합치료, 미술치료, 인지치료, 심리상담 등 다양한 아동발달 치료 프로그램을 관리할 수 있습니다.',
                },
            },
            {
                '@type': 'Question',
                name: '학부모도 이용할 수 있나요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: '네, 학부모 전용 앱을 통해 우리 아이의 발달 평가 결과 확인, 수업 일정 조회, 상담 기록 열람이 가능합니다.',
                },
            },
        ],
    };

    const centerLinks = centerList.map(c =>
        `<li><a href="${BASE_URL}/centers/${c.slug}">${escapeHtml(c.name)}</a>${c.address ? ` - ${escapeHtml(c.address)}` : ''}</li>`
    ).join('\n            ');

    return buildHtml({
        title, description, url,
        structuredData: [structuredData, faqData],
        body: `
            <h1>자라다(Zarada) - 아동발달센터 컨설팅 · 마케팅 · 운영 솔루션</h1>
            <p>${escapeHtml(description)}</p>

            <h2>주요 기능</h2>
            <ul>
                <li>온라인 상담 접수 및 예약 관리</li>
                <li>아동 수업 스케줄 및 출결 관리</li>
                <li>전문 발달 평가 (언어, 인지, 사회성, 운동, 적응행동)</li>
                <li>수납 및 청구 관리</li>
                <li>학부모 전용 앱 - 우리 아이 발달 현황 실시간 확인</li>
                <li>치료사 배치 및 프로그램 관리</li>
            </ul>

            <h2>지원 치료 프로그램</h2>
            <p>언어치료, 놀이치료, 감각통합치료, 미술치료, 인지치료, 심리상담, 사회성 그룹치료</p>

            <h2>자라다 파트너 센터</h2>
            <p>전국 ${centerList.length}개의 아동발달센터가 자라다와 함께하고 있습니다.</p>
            <ul>
            ${centerLinks}
            </ul>
            <p><a href="${BASE_URL}/centers">전체 센터 목록 보기 →</a></p>
        `,
    });
}

/** 센터 디렉토리 (/centers) */
async function renderCenterDirectory(supabase: any): Promise<string> {
    const { data: centers } = await supabase
        .from('centers')
        .select('name, slug, address, phone')
        .eq('is_active', true)
        .order('name');

    const centerList = (centers || []) as { name: string; slug: string; address: string | null; phone: string | null }[];

    const title = '전국 아동발달센터 찾기 - 자라다(Zarada) | 언어치료・감각통합';
    const description = '전국의 자라다 아동발달센터 지점 정보를 확인하세요. 언어치료, 감각통합, 놀이치료, 미술치료 전문 센터를 지역별로 찾아보세요.';
    const url = `${BASE_URL}/centers`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: '자라다 아동발달센터 목록',
        description: '전국의 자라다 아동발달센터 지점 안내',
        numberOfItems: centerList.length,
        itemListElement: centerList.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': 'LocalBusiness',
                '@id': `${BASE_URL}/centers/${c.slug}`,
                name: c.name,
                address: c.address || '',
                telephone: c.phone || '',
                url: `${BASE_URL}/centers/${c.slug}`,
            },
        })),
    };

    const centerCards = centerList.map(c => `
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px;">
            <h2><a href="${BASE_URL}/centers/${c.slug}" style="color:#1e293b;text-decoration:none;">${escapeHtml(c.name)}</a></h2>
            <p style="color:#64748b;">${escapeHtml(c.address || '주소 정보 없음')}</p>
            ${c.phone ? `<p style="color:#64748b;">📞 ${escapeHtml(c.phone)}</p>` : ''}
        </div>
    `).join('\n');

    return buildHtml({
        title, description, url, structuredData,
        body: `
            <h1>우리 동네 자라다 센터 찾기</h1>
            <p>전국 ${centerList.length}개의 자라다 센터가 아이들과 함께하고 있습니다.</p>
            ${centerCards}
        `,
    });
}

/** 센터별 블로그 RSS에서 최신 포스트를 가져오는 헬퍼 */
async function fetchBlogPostsForCenter(supabase: any, centerId: string): Promise<{ title: string; link: string; description: string }[]> {
    try {
        // 1. 센터의 sns_blog 설정값 조회
        const { data: setting } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('center_id', centerId)
            .eq('key', 'sns_blog')
            .maybeSingle();

        if (!setting?.value) return [];

        // 2. 블로그 URL에서 ID 추출
        const blogUrl = setting.value as string;
        const urlMatch = blogUrl.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)/);
        if (!urlMatch) return [];

        // 3. RSS fetch
        const rssUrl = `https://rss.blog.naver.com/${urlMatch[1]}.xml`;
        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'Zarada-Prerender/1.0' },
        });
        if (!response.ok) return [];

        const xml = await response.text();

        // 4. 간단한 RSS 파싱 (최신 4개)
        const posts: { title: string; link: string; description: string }[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && posts.length < 4) {
            const item = match[1];
            const getTag = (tag: string): string => {
                const cdataMatch = item.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
                if (cdataMatch) return cdataMatch[1].trim();
                const plainMatch = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
                return plainMatch ? plainMatch[1].trim() : '';
            };
            const desc = getTag('description').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 150);
            const title = getTag('title').replace(/<[^>]+>/g, '');
            posts.push({ title, link: getTag('link'), description: desc });
        }
        return posts;
    } catch {
        return []; // RSS 실패 시 무시 (나머지 렌더링에 영향 없음)
    }
}

/** 개별 센터 홈 (/centers/:slug) */
async function renderCenterHome(supabase: any, slug: string): Promise<string | null> {
    const { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

    if (!center) return null;
    const c = center as CenterData;

    const title = `${c.name} - 아동발달센터 | 언어치료・놀이치료・감각통합`;
    const description = `${c.name}은(는) ${c.address || '서울'} 소재 아동발달센터입니다. 언어치료, 놀이치료, 감각통합, 미술치료, 심리상담 전문.${c.phone ? ' 전화: ' + c.phone : ''}`;
    const url = `${BASE_URL}/centers/${slug}`;

    // ✨ 블로그 포스트 가져오기 (센터별 자동)
    const blogPosts = await fetchBlogPostsForCenter(supabase, c.id);

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name: c.name,
        description: description,
        url: url,
        telephone: c.phone || undefined,
        email: c.email || undefined,
        address: c.address ? {
            '@type': 'PostalAddress',
            streetAddress: c.address,
            addressCountry: 'KR',
        } : undefined,
        openingHoursSpecification: [
            ...(c.weekday_hours ? [{
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '09:00', closes: '19:00',
                description: c.weekday_hours,
            }] : []),
            ...(c.saturday_hours ? [{
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Saturday',
                description: c.saturday_hours,
            }] : []),
        ],
        image: c.logo_url || undefined,
        priceRange: '$$',
        medicalSpecialty: ['언어치료', '놀이치료', '감각통합치료', '미술치료', '심리상담'],
    };

    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: '센터 찾기', item: `${BASE_URL}/centers` },
            { '@type': 'ListItem', position: 2, name: c.name, item: url },
        ],
    };

    // ✨ 블로그 소식 HTML (있을 때만 표시)
    const blogHtml = blogPosts.length > 0 ? `
            <section>
                <h2>${escapeHtml(c.name)} 센터 소식</h2>
                ${blogPosts.map(post => `
                    <article>
                        <h3><a href="${escapeHtml(post.link)}">${escapeHtml(post.title)}</a></h3>
                        <p>${escapeHtml(post.description)}</p>
                    </article>
                `).join('')}
            </section>
    ` : '';

    return buildHtml({
        title, description, url,
        structuredData: [structuredData, breadcrumb],
        body: `
            <h1>${escapeHtml(c.name)}</h1>
            <p>${escapeHtml(description)}</p>
            ${c.address ? `<p>📍 주소: ${escapeHtml(c.address)}</p>` : ''}
            ${c.phone ? `<p>📞 전화: ${escapeHtml(c.phone)}</p>` : ''}
            ${c.weekday_hours ? `<p>🕐 평일: ${escapeHtml(c.weekday_hours)}</p>` : ''}
            ${c.saturday_hours ? `<p>🕐 토요일: ${escapeHtml(c.saturday_hours)}</p>` : ''}
            ${blogHtml}
            <nav>
                <a href="${url}/about">소개</a> |
                <a href="${url}/programs">프로그램</a> |
                <a href="${url}/therapists">치료사</a> |
                <a href="${url}/contact">문의</a>
            </nav>
        `,
    });
}

/** 치료사 소개 (/centers/:slug/therapists) */
async function renderTherapists(supabase: any, slug: string): Promise<string | null> {
    const { data: center } = await supabase
        .from('centers')
        .select('id, name, slug')
        .eq('slug', slug)
        .maybeSingle();

    if (!center) return null;

    const { data: profiles } = await supabase
        .from('therapist_profiles')
        .select('display_name, specialties, bio')
        .eq('center_id', (center as CenterData).id)
        .eq('website_visible', true)
        .order('sort_order');

    const therapists = (profiles || []) as TherapistProfile[];
    const centerName = (center as { name: string }).name;

    const title = `치료사 소개 - ${centerName} | 아동발달 전문 치료사`;
    const description = `${centerName}의 전문 치료사를 소개합니다. ${therapists.map(t => t.display_name).join(', ')} 선생님이 아이의 건강한 성장을 함께합니다.`;
    const url = `${BASE_URL}/centers/${slug}/therapists`;

    const therapistCards = therapists.map(t => `
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:12px;">
            <h2>${escapeHtml(t.display_name)} 선생님</h2>
            ${t.specialties ? `<p style="color:#4f46e5;">전문 분야: ${escapeHtml(t.specialties)}</p>` : ''}
            ${t.bio ? `<p style="color:#64748b;">${escapeHtml(t.bio)}</p>` : ''}
        </div>
    `).join('\n');

    return buildHtml({
        title, description, url,
        body: `
            <h1>${escapeHtml(centerName)} 치료사 소개</h1>
            <p>${therapists.length}명의 전문 치료사가 함께합니다.</p>
            ${therapistCards}
        `,
    });
}

/** 프로그램 소개 (/centers/:slug/programs) */
async function renderPrograms(supabase: any, slug: string): Promise<string | null> {
    const { data: center } = await supabase
        .from('centers')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

    if (!center) return null;

    const { data: programs } = await supabase
        .from('programs')
        .select('name, description, category, duration')
        .eq('center_id', (center as CenterData).id)
        .eq('is_active', true)
        .order('name');

    const programList = (programs || []) as ProgramData[];
    const centerName = (center as { name: string }).name;

    const title = `프로그램 안내 - ${centerName} | 언어치료・놀이치료・감각통합`;
    const description = `${centerName}의 치료 프로그램을 안내합니다. ${programList.map(p => p.name).join(', ')} 등 다양한 프로그램을 운영하고 있습니다.`;
    const url = `${BASE_URL}/centers/${slug}/programs`;

    const serviceData = {
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name: centerName,
        url: `${BASE_URL}/centers/${slug}`,
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: '치료 프로그램',
            itemListElement: programList.map(p => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: p.name,
                    description: p.description || '',
                },
            })),
        },
    };

    const programCards = programList.map(p => `
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:12px;">
            <h2>${escapeHtml(p.name)}</h2>
            ${p.category ? `<span style="color:#4f46e5;">${escapeHtml(p.category)}</span>` : ''}
            ${p.duration ? `<span> · ${p.duration}분</span>` : ''}
            ${p.description ? `<p style="color:#64748b;">${escapeHtml(p.description)}</p>` : ''}
        </div>
    `).join('\n');

    return buildHtml({
        title, description, url,
        structuredData: serviceData,
        body: `
            <h1>${escapeHtml(centerName)} 프로그램 안내</h1>
            <p>${programList.length}개의 프로그램을 운영하고 있습니다.</p>
            ${programCards}
        `,
    });
}

/** 센터 소개 (/centers/:slug/about) */
async function renderAbout(supabase: any, slug: string): Promise<string | null> {
    const { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (!center) return null;
    const c = center as CenterData;

    const title = `센터 소개 - ${c.name} | 아동발달센터`;
    const description = `${c.name}을(를) 소개합니다. ${c.address || ''} 소재 아동발달 전문센터. 언어치료, 놀이치료, 감각통합, 미술치료 전문.`;
    const url = `${BASE_URL}/centers/${slug}/about`;

    return buildHtml({
        title, description, url,
        body: `
            <h1>${escapeHtml(c.name)} 소개</h1>
            <p>${escapeHtml(description)}</p>
            ${c.address ? `<p>📍 ${escapeHtml(c.address)}</p>` : ''}
            ${c.representative ? `<p>대표: ${escapeHtml(c.representative)}</p>` : ''}
        `,
    });
}

/** 상담 문의 (/centers/:slug/contact) */
async function renderContact(supabase: any, slug: string): Promise<string | null> {
    const { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (!center) return null;
    const c = center as CenterData;

    const title = `상담 문의 - ${c.name} | 아동발달센터`;
    const description = `${c.name}에 상담을 문의하세요.${c.phone ? ' 전화: ' + c.phone : ''}${c.address ? ' 주소: ' + c.address : ''}`;
    const url = `${BASE_URL}/centers/${slug}/contact`;

    return buildHtml({
        title, description, url,
        body: `
            <h1>${escapeHtml(c.name)} 상담 문의</h1>
            <p>${escapeHtml(description)}</p>
            ${c.phone ? `<p>📞 전화 문의: <a href="tel:${c.phone}">${escapeHtml(c.phone)}</a></p>` : ''}
            ${c.address ? `<p>📍 방문 상담: ${escapeHtml(c.address)}</p>` : ''}
            ${c.weekday_hours ? `<p>🕐 평일: ${escapeHtml(c.weekday_hours)}</p>` : ''}
        `,
    });
}

// ============================================
// HTML 빌더
// ============================================

interface HtmlOptions {
    title: string;
    description: string;
    url: string;
    structuredData?: object | object[];
    body: string;
}

function buildHtml({ title, description, url, structuredData, body }: HtmlOptions): string {
    const sdArray = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];
    const sdScripts = sdArray
        .map(sd => `<script type="application/ld+json">${JSON.stringify(sd)}</script>`)
        .join('\n    ');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${url}">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${BASE_URL}/zaradalogo.png">
    <meta property="og:locale" content="ko_KR">
    <meta property="og:site_name" content="자라다(Zarada) 아동발달센터">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">

    <!-- Naver / Google Verification -->
    <meta name="naver-site-verification" content="b58d0aaa0fe5f95db84b0146d05463ec3c68e600">
    <meta name="google-site-verification" content="gReGqFl2Y9FOJYJb2m-AF_C7KQ0iUGrpJAAdT7ICic8">

    ${sdScripts}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; line-height: 1.6; }
        h1 { font-size: 28px; margin-bottom: 16px; }
        h2 { font-size: 20px; margin-bottom: 8px; }
        a { color: #4f46e5; }
        nav { margin-top: 24px; padding: 16px 0; border-top: 1px solid #e2e8f0; }
        nav a { margin-right: 16px; }
    </style>
</head>
<body>
    ${body}
    <footer style="margin-top:48px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:14px;">
        <p>© 자라다(Zarada) 아동발달센터</p>
        <p><a href="${BASE_URL}/centers">전국 센터 찾기</a></p>
    </footer>
</body>
</html>`;
}

// ============================================
// Handler
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const supabase = getSupabase();
    const host = (req.headers.host || '').replace(/:\d+$/, ''); // Remove port

    // ✨ 커스텀 도메인 감지
    const isDefaultDomain = checkDefaultDomain(host);

    let rawPath = (req.query.path as string) || '';

    // 🔒 커스텀 도메인에서 접속 시, DB에서 slug를 찾아서 path를 자동 설정
    // 다른 센터 slug로의 접근도 차단하고 매핑된 센터로 강제 전환
    if (!isDefaultDomain) {
        try {
            const { data: domainCenter } = await supabase
                .from('centers')
                .select('slug')
                .eq('custom_domain', host)
                .maybeSingle();

            if (domainCenter?.slug) {
                // 다른 센터 slug 접근 차단
                const slugMatch = rawPath.match(/^\/centers\/([^/]+)(\/.*)?$/);
                if (slugMatch && slugMatch[1] !== domainCenter.slug) {
                    // 다른 센터 slug → 매핑된 센터의 동일 하위페이지로 전환
                    const subPage = slugMatch[2] || '';
                    rawPath = `/centers/${domainCenter.slug}${subPage}`;
                } else if (!rawPath.startsWith('/centers/')) {
                    const subPath = rawPath === '/' || rawPath === '' ? '' : rawPath;
                    rawPath = `/centers/${domainCenter.slug}${subPath}`;
                }
            }
        } catch (e) {
            // 도메인 매칭 실패 시 기본 로직으로 폴백
        }
    }

    if (!rawPath) rawPath = '/';
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

    try {
        let html: string | null = null;

        // / - 글로벌 랜딩 (메인 페이지)
        if (path === '/' || path === '') {
            html = await renderGlobalLanding(supabase);
        }
        // /centers - 디렉토리
        else if (path === '/centers' || path === '/centers/') {
            html = await renderCenterDirectory(supabase);
        }
        // /centers/:slug/therapists
        else if (path.match(/^\/centers\/([^/]+)\/therapists\/?$/)) {
            const slug = path.match(/^\/centers\/([^/]+)\/therapists/)![1];
            html = await renderTherapists(supabase, slug);
        }
        // /centers/:slug/programs
        else if (path.match(/^\/centers\/([^/]+)\/programs\/?$/)) {
            const slug = path.match(/^\/centers\/([^/]+)\/programs/)![1];
            html = await renderPrograms(supabase, slug);
        }
        // /centers/:slug/about
        else if (path.match(/^\/centers\/([^/]+)\/about\/?$/)) {
            const slug = path.match(/^\/centers\/([^/]+)\/about/)![1];
            html = await renderAbout(supabase, slug);
        }
        // /centers/:slug/contact
        else if (path.match(/^\/centers\/([^/]+)\/contact\/?$/)) {
            const slug = path.match(/^\/centers\/([^/]+)\/contact/)![1];
            html = await renderContact(supabase, slug);
        }
        // /centers/:slug - 센터 홈
        else if (path.match(/^\/centers\/([^/]+)\/?$/)) {
            const slug = path.match(/^\/centers\/([^/]+)/)![1];
            html = await renderCenterHome(supabase, slug);
        }

        if (html) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
            res.status(200).send(html);
        } else {
            res.status(404).send(buildHtml({
                title: '페이지를 찾을 수 없습니다',
                description: '요청하신 페이지를 찾을 수 없습니다.',
                url: `${BASE_URL}${path}`,
                body: '<h1>페이지를 찾을 수 없습니다</h1><p><a href="/centers">센터 찾기로 이동</a></p>',
            }));
        }
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorStack = err instanceof Error ? err.stack : '';
        console.error('Prerender error:', errorMsg, '\nPath:', path, '\nStack:', errorStack);
        res.status(500).send(`<!-- Prerender Error: ${escapeHtml(errorMsg)} --><p>Internal Server Error</p>`);
    }
}
