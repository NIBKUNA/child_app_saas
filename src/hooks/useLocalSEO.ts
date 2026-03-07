/**
 * 🌐 useLocalSEO - 지역 검색 최적화 공통 훅
 * 
 * 센터의 address에서 지역명을 자동 추출하여
 * 모든 하위 페이지의 title, description, JSON-LD를 자동 생성합니다.
 * 
 * 새 센터 생성 시 별도 설정 없이 자동으로 지역 SEO가 적용됩니다.
 * 
 * 사용법:
 *   const { pageTitle, pageDesc, canonical, structuredData } = useLocalSEO();
 *   <title>{pageTitle('about')}</title>
 *   <meta name="description" content={pageDesc('about')} />
 */

import { useCenter } from '@/contexts/CenterContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { PLATFORM_URL, isMainDomain } from '@/config/domain';

// 🗺️ 주소에서 핵심 지역 키워드 추출 (fallback용)
function extractRegionFromAddress(address: string): string {
    if (!address) return '';

    const parts = address.split(' ').filter(Boolean);
    // "서울특별시 송파구 위례동" → "송파"
    // "경기도 성남시 수정구" → "성남 수정"
    if (parts.length >= 3) {
        const gu = parts[1].replace(/[시군구]$/, '');
        const dong = parts[2].replace(/[동읍면리로길]$/, '');
        // 구+동 조합이 더 검색 키워드에 유리
        if (parts[2].match(/[동읍면]$/)) return `${gu} ${dong}`;
        return gu;
    }
    if (parts.length >= 2) return parts[1].replace(/[시군구]$/, '');
    return '';
}

// 🏷️ 센터 이름에서 대표 지역 추출
// "자라다 아동심리발달센터 잠실점" → "잠실"
// "다산 위드미 아동발달센터" → null (지점명 없음 → 주소 fallback)
function extractRegionFromName(name: string): string | null {
    if (!name) return null;
    // "~점" 또는 "~지점"으로 끝나는 패턴만 매칭
    const match = name.match(/\s(\S+?)(?:점|지점)\s*$/);
    if (match) {
        return match[1];
    }
    return null;
}

export type PageType = 'home' | 'about' | 'programs' | 'therapists' | 'contact';

export function useLocalSEO() {
    const { center } = useCenter();
    const { getSetting } = useAdminSettings();

    // 🥇 우선순위: 1) admin setting 수동 설정  2) 센터 이름에서 추출  3) 주소에서 추출
    const seoRegionOverride = getSetting('seo_region') || '';
    const nameRegion = center?.name ? extractRegionFromName(center.name) : null;
    const addressRegion = center?.address ? extractRegionFromAddress(center.address) : '';
    const region = seoRegionOverride || nameRegion || addressRegion;

    const centerName = center?.name || '아동발달센터';
    const slug = center?.slug || '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : PLATFORM_URL;
    const phone = center?.phone || '';
    const address = center?.address || '';

    // 사이트 관리에서 설정한 추가 키워드 반영
    const extraKeywords = getSetting('seo_keywords') || '';

    // 📌 페이지별 SEO 타이틀 자동 생성
    // 패턴: "{지역} {핵심키워드} | {센터이름} - {부가설명}"
    const pageTitle = (type: PageType): string => {
        if (!region) {
            // 지역 정보 없으면 기본 패턴
            const fallback: Record<PageType, string> = {
                home: `${centerName} | 아동발달센터`,
                about: `센터 소개 - ${centerName}`,
                programs: `프로그램 안내 - ${centerName}`,
                therapists: `치료사 소개 - ${centerName}`,
                contact: `오시는 길 - ${centerName}`,
            };
            return fallback[type];
        }

        const titles: Record<PageType, string> = {
            home: `${region} 아동발달센터 - ${centerName} | 언어치료・감각통합`,
            about: `${region} 아동발달센터 소개 | ${centerName} - 치료 철학과 비전`,
            programs: `${region} 언어치료・감각통합 프로그램 | ${centerName}`,
            therapists: `${region} 아동 전문 치료사 소개 | ${centerName}`,
            contact: `${region} 아동발달센터 오시는 길 | ${centerName} - 위치・예약`,
        };
        return titles[type];
    };

    // 📌 페이지별 SEO Description 자동 생성
    const pageDesc = (type: PageType): string => {
        const r = region ? `${region} ` : '';
        const descs: Record<PageType, string> = {
            home: `${r}${centerName} - 언어치료, 감각통합, 놀이치료, 미술치료 전문 아동발달센터. 말이 늦는 아이, 발달이 걱정되는 아이를 위한 맞춤 치료. 전문 치료사 상담.`,
            about: `${r}${centerName}의 치료 철학과 비전. 근거 기반의 전문 치료와 따뜻한 가족 중심 케어로 아이의 건강한 발달을 돕습니다.`,
            programs: `${r}${centerName} 언어치료, 감각통합, 놀이치료, 미술치료, 그룹치료 프로그램. 아이 발달 단계에 맞춘 개별 치료 프로그램 안내.`,
            therapists: `${r}${centerName}의 전문 언어치료사, 놀이치료사, 감각통합 치료사 소개. 자격증, 경력, 전문 분야를 확인하세요.`,
            contact: `${r}${centerName} 오시는 길, 연락처, 운영시간. 발달검사 및 상담 예약 가능. 전화 문의 환영합니다.`,
        };
        return descs[type];
    };

    // 📌 페이지별 키워드 자동 생성
    const pageKeywords = (type: PageType): string => {
        const baseKeywords = [
            `${region} 아동발달센터`, `${region} 언어치료`, `${region} 감각통합`,
            `${region} 놀이치료`, `${region} 미술치료`, `${region} 그룹치료`,
            centerName
        ].filter(k => k.trim());

        // 🎯 부모님 실제 검색 패턴 키워드 (증상/고민 기반)
        const parentKeywords = [
            `${region} 언어치료 잘하는곳`, `${region} 아동발달센터 추천`,
            `${region} 아이 말이 늦어요`, `${region} 발달지연`,
            `${region} 아동심리상담`, `${region} 발달검사`,
            '아이 언어발달 늦음', '아이 말 안해요',
            '아이 감각 예민', '아이 사회성 부족',
            '언어치료 몇살부터', '놀이치료 효과',
        ].filter(k => k.trim());

        const typeKeywords: Record<PageType, string[]> = {
            home: [`${region} 아동발달`, `${region} 치료센터`, `${region} 발달센터 추천`, `${region} 아동치료`],
            about: [`${region} 발달센터 소개`, '아동치료 전문기관', `${region} 아동발달센터 후기`],
            programs: [`${region} 언어치료 프로그램`, `${region} 감각통합 프로그램`, '사회성 치료', `${region} 놀이치료 프로그램`],
            therapists: [`${region} 언어치료사`, `${region} 놀이치료사`, '아동 전문 치료사', `${region} 감각통합 치료사`],
            contact: [`${region} 발달센터 위치`, `${region} 치료센터 예약`, '상담 문의', `${region} 아동발달센터 전화`],
        };

        return [...baseKeywords, ...parentKeywords, ...typeKeywords[type], ...(extraKeywords ? extraKeywords.split(',') : [])].join(', ');
    };

    // 📌 Canonical URL 생성 — 커스텀 도메인 자동 처리
    const canonical = (subPath: string = '') => {
        if (!isMainDomain()) {
            // 커스텀 도메인: origin + subPath (예: https://zaradacenter.co.kr/about)
            return `${baseUrl}${subPath}`;
        }
        // 메인 플랫폼: origin + /centers/slug + subPath
        return `${baseUrl}/centers/${slug}${subPath}`;
    };

    // 📌 JSON-LD 구조화 데이터 (LocalBusiness)
    const structuredData = (type: PageType) => {
        // 운영시간 동적 파싱 (예: "09:00 - 19:00" → opens: "09:00", closes: "19:00")
        const rawHours = (center as Record<string, unknown>)?.weekday_hours as string || '';
        const hoursParts = rawHours.split(/\s*[-~]\s*/);
        const opens = hoursParts[0]?.trim() || '09:00';
        const closes = hoursParts[1]?.trim() || '19:00';

        return {
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            "name": centerName,
            "url": canonical(),
            ...(phone && { "telephone": phone }),
            "image": center?.logo_url || '',
            ...(address && {
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": address,
                    "addressLocality": region || "서울",
                    "addressCountry": "KR"
                }
            }),
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": opens,
                "closes": closes
            },
            "medicalSpecialty": ["SpeechPathology", "Pediatrics"],
            "priceRange": "$$",
            ...(type === 'contact' && address && {
                "hasMap": `https://map.naver.com/search/${encodeURIComponent(address)}`
            })
        };
    };

    return {
        region,
        centerName,
        slug,
        phone,
        address,
        pageTitle,
        pageDesc,
        pageKeywords,
        canonical,
        structuredData,
    };
}
