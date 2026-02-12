import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useCenter } from '@/contexts/CenterContext';
import { useLocalSEO } from '@/hooks/useLocalSEO';
import type { PageType } from '@/hooks/useLocalSEO';

/**
 * 🌐 SEOHead - 글로벌 SEO 메타 태그 관리
 *
 * 모든 SEO 로직은 useLocalSEO 훅에서 단일 관리.
 * 이 컴포넌트는 훅의 결과를 Helmet에 바인딩만 합니다.
 */
export function SEOHead() {
    const location = useLocation();
    const { center } = useCenter();
    const seo = useLocalSEO();

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.myparents.co.kr';
    const canonicalUrl = `${baseUrl}${location.pathname}`;

    const businessName = center?.name || '아동발달센터';
    const ogImage = center?.logo_url || '/og-default.png';

    // Naver/Google Verification (env에서만)
    const naverVerification = import.meta.env.VITE_NAVER_VERIFICATION || '';
    const googleVerification = import.meta.env.VITE_GOOGLE_VERIFICATION || '';

    // 경로에서 PageType 자동 감지
    const detectPageType = (): PageType => {
        const path = location.pathname;
        if (path.includes('/about')) return 'about';
        if (path.includes('/programs')) return 'programs';
        if (path.includes('/therapists')) return 'therapists';
        if (path.includes('/contact')) return 'contact';
        return 'home';
    };

    const pageType = detectPageType();
    const isMasterPath = location.pathname.startsWith('/master');
    const isGlobalRoot = location.pathname === '/';

    // 📌 useLocalSEO 훅에서 생성한 SEO 데이터 활용 (단일 소스)
    const title = seo.pageTitle(pageType);
    const description = seo.pageDesc(pageType);
    const keywords = seo.pageKeywords(pageType);

    // 경로별 suffix (특수 경로만)
    let pageSuffix = '';
    if (isMasterPath) {
        if (location.pathname === '/master') pageSuffix = '';
        else if (location.pathname.includes('/centers')) pageSuffix = ' - 전체 센터 관리';
        else pageSuffix = ' - 마스터';
    } else if (location.pathname.includes('/parent/home')) {
        pageSuffix = ' - 학부모 홈';
    } else if (location.pathname.includes('/app/dashboard')) {
        pageSuffix = ' - 대시보드';
    } else if (location.pathname.includes('/login')) {
        pageSuffix = ' - 로그인';
    }

    const displayTitle = isMasterPath
        ? `Zarada${pageSuffix}`
        : isGlobalRoot
            ? `Zarada | 아동발달센터 통합 관리 솔루션`
            : `${title}${pageSuffix}`;

    // JSON-LD: useLocalSEO의 structuredData 활용
    const jsonLd = seo.structuredData(pageType);

    return (
        <Helmet>
            <title>{displayTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {naverVerification && (
                <meta name="naver-site-verification" content={naverVerification} />
            )}
            {googleVerification && (
                <meta name="google-site-verification" content={googleVerification} />
            )}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={businessName} />
            <meta property="og:locale" content="ko_KR" />

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
