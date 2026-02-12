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

// 🗺️ 주소에서 핵심 지역 키워드 추출
function extractRegion(address: string): string {
    if (!address) return '';

    // 특수 지역명 우선 감지 (행정구역명에 안 들어가는 지역)
    const specialRegions = ['위례', '잠실', '방이', '석촌', '송리단', '올림픽', '가락', '문정', '장지', '복정'];
    for (const r of specialRegions) {
        if (address.includes(r)) return r;
    }

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

type PageType = 'home' | 'about' | 'programs' | 'therapists' | 'contact';

export function useLocalSEO() {
    const { center } = useCenter();
    const { getSetting } = useAdminSettings();

    const region = center?.address ? extractRegion(center.address) : '';
    const centerName = center?.name || '아동발달센터';
    const slug = center?.slug || '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.myparents.co.kr';
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
            home: `${r}${centerName} - 언어치료, 감각통합, 놀이치료, 미술치료 전문 아동발달센터. 아이의 잠재력을 키워주세요.`,
            about: `${r}${centerName}의 치료 철학과 비전. 근거 기반의 전문 치료와 따뜻한 가족 중심 케어를 제공합니다.`,
            programs: `${r}${centerName}에서 제공하는 언어치료, 감각통합, 놀이치료, 미술치료, 그룹치료 프로그램 안내.`,
            therapists: `${r}${centerName}의 전문 치료사 소개. 자격증, 경력, 전문 분야를 확인하세요.`,
            contact: `${r}${centerName} 오시는 길, 연락처, 운영시간 안내. 상담 예약 및 방문 안내.`,
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

        const typeKeywords: Record<PageType, string[]> = {
            home: [`${region} 아동발달`, `${region} 치료센터`],
            about: [`${region} 발달센터 소개`, '아동치료 전문기관'],
            programs: [`${region} 언어치료 프로그램`, `${region} 감각통합 프로그램`, '사회성 치료'],
            therapists: [`${region} 언어치료사`, `${region} 놀이치료사`, '아동 전문 치료사'],
            contact: [`${region} 발달센터 위치`, `${region} 치료센터 예약`, '상담 문의'],
        };

        return [...baseKeywords, ...typeKeywords[type], ...(extraKeywords ? extraKeywords.split(',') : [])].join(', ');
    };

    // 📌 Canonical URL 생성
    const canonical = (subPath: string = '') =>
        `${baseUrl}/centers/${slug}${subPath}`;

    // 📌 JSON-LD 구조화 데이터 (LocalBusiness)
    const structuredData = (type: PageType) => ({
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": centerName,
        "url": canonical(),
        "telephone": phone,
        "image": center?.logo_url || '',
        "address": {
            "@type": "PostalAddress",
            "streetAddress": address,
            "addressLocality": region || "서울",
            "addressCountry": "KR"
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "19:00"
        },
        "medicalSpecialty": ["SpeechPathology", "Pediatrics"],
        "priceRange": "$$",
        ...(type === 'contact' && address && {
            "hasMap": `https://map.naver.com/search/${encodeURIComponent(address)}`
        })
    });

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
