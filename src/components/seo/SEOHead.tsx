import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useCenterSEO } from '@/hooks/useCenterSEO';

export function SEOHead() {
    const { seoData } = useCenterSEO();
    const location = useLocation();

    // 기본값 (데이터 로딩 전)
    const defaultTitle = "자라다 발달센터";
    const defaultDesc = "아동 발달 성장 관리 플랫폼";

    // 경로별 suffix 설정 (선택사항)
    let pageSuffix = "";
    if (location.pathname.includes('/parent/home')) pageSuffix = " - 학부모 홈";
    else if (location.pathname.includes('/app/dashboard')) pageSuffix = " - 대시보드";
    else if (location.pathname.includes('/login')) pageSuffix = " - 로그인";

    const title = seoData?.name ? `${seoData.name}${pageSuffix}` : defaultTitle;
    const description = seoData?.seo_description || defaultDesc;

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
        </Helmet>
    );
}
