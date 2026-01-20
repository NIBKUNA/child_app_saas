import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { seoConfig } from '@/config/seo';

export function SEOHead() {
    // 👑 [Sovereign SEO] Fully Environment Variable Driven
    const {
        title,
        description,
        ogImage,
        keywords,
        canonicalUrl: baseUrl,
        naverVerification,
        phone,
        address,
        geo,
        businessName
    } = seoConfig;

    const location = useLocation();
    const canonicalUrl = `${baseUrl}${location.pathname}`;

    // 🏗️ Structured Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "LocalBusiness",
                "@id": baseUrl,
                "name": businessName,
                "image": ogImage,
                "url": baseUrl,
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
                "name": `Zarada ERP - ${businessName}`,
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
