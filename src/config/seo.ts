export const seoConfig = {
    title: import.meta.env.VITE_SITE_TITLE || 'Zarada',
    description: import.meta.env.VITE_META_DESCRIPTION || '아이들의 잠재력을 깨우는 최고의 발달 센터입니다.',
    ogImage: import.meta.env.VITE_OG_IMAGE || '/og-default.png',
    keywords: import.meta.env.VITE_META_KEYWORDS || '자라다발달센터, 아동발달센터, 언어치료, 감각통합치료',
    canonicalUrl: import.meta.env.VITE_CANONICAL_URL || 'https://zaradacenter.co.kr',
    naverVerification: import.meta.env.VITE_NAVER_VERIFICATION || '',
    googleVerification: import.meta.env.VITE_GOOGLE_VERIFICATION || '',
    phone: import.meta.env.VITE_CENTER_PHONE || '02-000-0000',
    address: import.meta.env.VITE_CENTER_ADDRESS || '서울특별시 송파구 석촌호수로 12길',
    geo: {
        lat: import.meta.env.VITE_CENTER_LAT || '37.5113',
        lng: import.meta.env.VITE_CENTER_LNG || '127.0982'
    },
    businessName: import.meta.env.VITE_BUSINESS_NAME || '아동발달센터'
};
