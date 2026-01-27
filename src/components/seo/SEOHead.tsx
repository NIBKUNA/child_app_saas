import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { seoConfig } from '@/config/seo';
import { useCenter } from '@/contexts/CenterContext';

export function SEOHead() {
    // 👑 [Sovereign SEO] Fully Environment Variable Driven
    const {
        title: defaultTitle,
        description: defaultDescription,
        ogImage: defaultOgImage,
        keywords: defaultKeywords,
        canonicalUrl: baseUrl,
        naverVerification,
        phone: defaultPhone,
        address: defaultAddress,
        geo,
        businessName: defaultBusinessName
    } = seoConfig;

    const location = useLocation();
    const { center } = useCenter(); // ✨ SaaS Context

    const canonicalUrl = `${baseUrl}${location.pathname}`;

    // 📍 [Local SEO] Extract Region from Address
    const extractRegion = (addr: string) => {
        if (!addr) return '';
        const parts = addr.split(' ');
        // 보통 '송파구', '성남시 수정구 위례동' 등에서 핵심 지역 키워드 추출
        // 2~3번째 단어가 보통 구/동 단위 지역명
        if (addr.includes('위례')) return '위례';
        if (parts.length >= 2) return parts[1].replace(/[시군구]$/, '');
        return '';
    };

    const region = center?.address ? extractRegion(center.address) : '';
    const serviceKeywords = [
        '아동발달센터',
        '언어치료',
        '감각통합치료',
        '놀이치료',
        '그룹치료',
        '사회성수업',
        '미술치료'
    ];

    // ✨ Dynamic Local Keywords (Region + Core Service)
    const localKeywords = center ? serviceKeywords.map(k => `${region} ${k}`).join(', ') : '';

    // 🏗️ Determine Meta Data (Center Override vs Default)
    const title = center ? `${center.name}` : defaultTitle;

    const description = center
        ? `${region} ${center.name} - 전문 아동발달센터. ${serviceKeywords.slice(0, 3).join(', ')} 전문.`
        : defaultDescription;

    const keywords = center
        ? `${localKeywords}, ${defaultKeywords}`
        : defaultKeywords;

    const ogImage = center?.logo_url || defaultOgImage;
    const businessName = center?.name || defaultBusinessName;
    const phone = center?.phone || defaultPhone;
    const address = center?.address || defaultAddress;

    // 🏗️ Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "LocalBusiness",
                "@id": canonicalUrl,
                "name": businessName,
                "image": ogImage,
                "url": canonicalUrl,
                "telephone": phone,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": address,
                    "addressLocality": "Songpa-gu", // 필요시 이것도 환경변수화 가능
                    "addressRegion": "Seoul",
                    "postalCode": "05540",
                    "addressCountry": "KR"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": geo.lat,
                    "longitude": geo.lng
                },
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "10:00",
                    "closes": "19:00"
                },
                "priceRange": "$$"
            },
            {
                "@type": "SoftwareApplication",
                "name": `Zarada SaaS - ${businessName}`,
                "operatingSystem": "Web",
                "applicationCategory": "BusinessApplication",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "KRW"
                }
            }
        ]
    };

    // 경로별 suffix 설정
    let pageSuffix = "";
    const isMasterPath = location.pathname.startsWith('/master');

    if (isMasterPath) {
        // 마스터 페이지는 보조 설명 없이 'Zarada'만 표시하거나 최소한의 정보만 표시
        if (location.pathname === '/master') pageSuffix = "";
        else if (location.pathname.includes('/centers')) pageSuffix = " - 전체 센터 관리";
        else pageSuffix = " - 마스터";
    } else {
        if (location.pathname === '/') pageSuffix = " | 아동발달센터 통합 관리 솔루션"; // 메인 홈 부제 추가
        else if (location.pathname.includes('/about')) pageSuffix = " - 소개";
        else if (location.pathname.includes('/programs')) pageSuffix = " - 프로그램";
        else if (location.pathname.includes('/contact')) pageSuffix = " - 오시는길";
        else if (location.pathname.includes('/parent/home')) pageSuffix = " - 학부모 홈";
        else if (location.pathname.includes('/app/dashboard')) pageSuffix = " - 대시보드";
        else if (location.pathname.includes('/login')) pageSuffix = " - 로그인";
    }

    const displayTitle = isMasterPath ? `Zarada${pageSuffix}` : `${title}${pageSuffix}`;

    return (
        <Helmet>
            <title>{displayTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {naverVerification && (
                <meta name="naver-site-verification" content={naverVerification} />
            )}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={businessName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={displayTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(jsonLd)}
            </script>
        </Helmet>
    );
}
