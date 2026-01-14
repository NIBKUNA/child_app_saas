import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { seoConfig } from '@/config/seo';

export function SEOHead() {
    // 👑 [Sovereign SEO] Environment Variable Driven
    // DB 조회가 아닌, 배포 시 설정된 환경변수를 최우선으로 따릅니다.
    const { title, description, ogImage } = seoConfig;
    const location = useLocation();

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

            {/* Open Graph */}
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content="website" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={displayTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    );
}
