import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { seoConfig } from '@/config/seo';

export function SEOHead() {
    // 👑 [Sovereign SEO] Environment Variable Driven
    // DB 조회가 아닌, 배포 시 설정된 환경변수를 최우선으로 따릅니다.
    const { title, description, ogImage } = seoConfig;
    const location = useLocation();

    // ✨ Keywords Injection
    const keywords = "자라다발달센터, 잠실 아동발달센터, 언어치료, 감각통합치료, 미술치료, 놀이치료, 인지치료, 사회성그룹치료, 아동발달검사, 송파 발달센터, 송파구, 송파구 아동발달센터";
    const canonicalUrl = `https://zaradacenter.co.kr${location.pathname}`;

    // 🏗️ Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "LocalBusiness",
                "@id": "https://zaradacenter.co.kr",
                "name": "자라다 아동심리발달센터 잠실점",
                "image": ogImage,
                "url": "https://zaradacenter.co.kr",
                "telephone": "02-416-2213",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "서울 송파구 석촌호수로 12길", /* 실제 상세 주소 확인 필요 */
                    "addressLocality": "Songpa-gu",
                    "addressRegion": "Seoul",
                    "postalCode": "05540",
                    "addressCountry": "KR"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 37.5113,
                    "longitude": 127.0982
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
                "name": "Zarada ERP - 자라다 컨설팅",
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
    if (location.pathname.includes('/parent/home')) pageSuffix = " - 학부모 홈";
    else if (location.pathname.includes('/app/dashboard')) pageSuffix = " - 대시보드";
    else if (location.pathname.includes('/login')) pageSuffix = " - 로그인";

    const displayTitle = `${title}${pageSuffix}`;

    return (
        <Helmet>
            <title>{displayTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="자라다 아동발달센터" />

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
