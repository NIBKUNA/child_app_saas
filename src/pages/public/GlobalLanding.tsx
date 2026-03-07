import { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Search, MapPin, Phone, Clock, ChevronRight, Star, Users, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_URL } from '@/config/domain';
import { motion } from 'framer-motion';

interface Center {
    id: string;
    name: string;
    slug: string | null;
    address: string | null;
    logo_url: string | null;
    phone: string | null;
    weekday_hours: string | null;
    saturday_hours: string | null;
}

// ✨ 카드 액센트 색상 (하얀 배경 + 색상 포인트)
const CARD_COLORS = [
    { accent: '#7C3AED', badgeBg: 'bg-violet-100', badgeText: 'text-violet-700', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
    { accent: '#059669', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    { accent: '#D97706', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    { accent: '#E11D48', badgeBg: 'bg-rose-100', badgeText: 'text-rose-700', iconBg: 'bg-rose-100', iconText: 'text-rose-600' },
    { accent: '#0284C7', badgeBg: 'bg-sky-100', badgeText: 'text-sky-700', iconBg: 'bg-sky-100', iconText: 'text-sky-600' },
    { accent: '#9333EA', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
];

/** 주소에서 시/도 + 시/군/구 추출 */
function extractRegion(address: string | null): string {
    if (!address) return '기타';
    const parts = address.split(' ');
    if (parts.length >= 2) {
        const sido = parts[0].replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
        return `${sido} ${parts[1]}`;
    }
    return parts[0] || '기타';
}

/** 시/도만 추출 (필터용) */
function extractSido(address: string | null): string {
    if (!address) return '기타';
    const part = address.split(' ')[0];
    return part.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '') || '기타';
}

export const GlobalLanding = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [keyword, setKeyword] = useState('');
    const [centers, setCenters] = useState<Center[]>([]);
    const [activeRegion, setActiveRegion] = useState('전체');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const centerGridRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchCenters = async () => {
            setIsInitialLoading(true);
            try {
                const { data, error } = await supabase
                    .from('centers')
                    .select('id, name, slug, address, logo_url, phone, weekday_hours, saturday_hours')
                    .eq('is_active', true)
                    .order('name');
                if (error) throw error;
                if (data && data.length > 0) {
                    // admin_settings에서 각 센터의 center_logo 가져오기
                    const centerIds = data.map(c => c.id);
                    const { data: logoSettings } = await supabase
                        .from('admin_settings')
                        .select('center_id, value')
                        .eq('key', 'center_logo')
                        .in('center_id', centerIds);

                    const logoMap = new Map<string, string>();
                    logoSettings?.forEach(s => {
                        if (s.value) logoMap.set(s.center_id, s.value);
                    });

                    // logo_url이 없으면 admin_settings의 center_logo로 대체
                    const enriched = data.map(c => ({
                        ...c,
                        logo_url: c.logo_url || logoMap.get(c.id) || null,
                    }));
                    setCenters(enriched);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.error("❌ Failed to fetch centers:", message);
                setFetchError("센터 정보를 불러오지 못했습니다.");
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchCenters();
    }, []);

    const regions = useMemo(() => {
        const sidoSet = new Set<string>();
        centers.forEach(c => sidoSet.add(extractSido(c.address)));
        return ['전체', ...Array.from(sidoSet).sort()];
    }, [centers]);

    const filteredCenters = useMemo(() => {
        let result = centers;
        if (activeRegion !== '전체') {
            result = result.filter(c => extractSido(c.address) === activeRegion);
        }
        if (keyword.trim()) {
            const lowerKeyword = keyword.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerKeyword) ||
                (c.slug && c.slug.toLowerCase().includes(lowerKeyword)) ||
                (c.address && c.address.toLowerCase().includes(lowerKeyword))
            );
        }
        return result;
    }, [keyword, activeRegion, centers]);

    const handleSelect = (center: Center) => {
        if (center.slug) {
            localStorage.setItem('zarada_center_slug', center.slug);
            const isSuperAdmin = role === 'super_admin';
            navigate(`/centers/${center.slug}${isSuperAdmin ? '' : '?login=true'}`);
        }
    };

    const handleEnter = (e: React.FormEvent) => {
        e.preventDefault();
        if (filteredCenters.length > 0) handleSelect(filteredCenters[0]);
    };

    const scrollToCenters = () => {
        centerGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
    };
    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' as const } }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
            {/* 🔍 SEO — 아동발달 관련 키워드 최적화 */}
            <Helmet>
                <title>아동발달센터 찾기 | 자라다(Zarada) - 언어치료 · 감각통합 · 발달검사 전문 센터</title>
                <meta name="description" content="우리 아이에게 딱 맞는 아동발달센터를 찾아보세요. 언어치료, 감각통합치료, 놀이치료, 발달검사, 인지학습 전문 센터를 지역별로 검색하고 비교하세요. 아동발달센터 컨설팅·마케팅·ERP 솔루션까지." />
                <meta name="keywords" content="아동발달센터, 언어치료, 감각통합치료, 놀이치료, 발달검사, 언어검사, 아동발달, 발달센터, 언어치료센터, 아동심리, 인지치료, 발달장애, 아동발달센터 창업, 아동발달센터 개원, 치료실 운영, 센터 ERP, 자라다" />
                <link rel="canonical" href={PLATFORM_URL} />
                <meta property="og:title" content="아동발달센터 찾기 | 자라다(Zarada)" />
                <meta property="og:description" content="우리 아이에게 딱 맞는 아동발달센터를 찾아보세요. 전국 언어치료·감각통합·놀이치료 전문 센터 검색." />
                <meta property="og:url" content={PLATFORM_URL} />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="ko_KR" />
                <meta property="og:site_name" content="자라다 Zarada" />
                <meta property="og:image" content={`${PLATFORM_URL}/zaradalogo.png`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="아동발달센터 찾기 | 자라다(Zarada)" />
                <meta name="twitter:description" content="전국 아동발달센터 검색. 언어치료·감각통합·놀이치료·발달검사 전문센터." />
                <meta name="robots" content="index, follow" />
                <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />

                {/* JSON-LD: Organization + ItemList */}
                {centers.length > 0 && (
                    <script type="application/ld+json">{JSON.stringify({
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "Organization",
                                "name": "자라다 Zarada",
                                "url": PLATFORM_URL,
                                "logo": `${PLATFORM_URL}/zaradalogo.png`,
                                "description": "아동발달센터 컨설팅, 마케팅, 운영 솔루션을 제공하는 통합 파트너. 언어치료, 감각통합, 놀이치료, 발달검사 전문.",
                                "address": { "@type": "PostalAddress", "addressLocality": "성남시", "addressRegion": "경기도", "addressCountry": "KR" },
                                "sameAs": [],
                                "hasOfferCatalog": {
                                    "@type": "OfferCatalog", "name": "아동발달센터 솔루션",
                                    "itemListElement": [
                                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "아동발달센터 컨설팅", "description": "아동발달센터 개원 및 운영 컨설팅" } },
                                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "아동발달 마케팅 대행", "description": "언어치료, 감각통합치료 등 아동발달 분야 전문 마케팅" } },
                                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "센터 운영 ERP 솔루션", "description": "치료 스케줄, 상담일지, 청구 관리 통합 시스템" } },
                                    ]
                                }
                            },
                            {
                                "@type": "WebSite",
                                "url": PLATFORM_URL,
                                "name": "자라다 - 아동발달센터 찾기",
                                "description": "전국 아동발달센터를 검색하세요. 언어치료, 감각통합, 놀이치료, 발달검사 전문 센터.",
                                "potentialAction": {
                                    "@type": "SearchAction",
                                    "target": `${PLATFORM_URL}/?q={search_term_string}`,
                                    "query-input": "required name=search_term_string"
                                }
                            },
                            {
                                "@type": "ItemList",
                                "name": "전국 아동발달센터 목록",
                                "description": "자라다 파트너 아동발달센터 — 언어치료, 감각통합, 놀이치료, 미술치료 전문",
                                "numberOfItems": centers.length,
                                "itemListElement": centers.map((c, i) => ({
                                    "@type": "ListItem",
                                    "position": i + 1,
                                    "item": {
                                        "@type": "MedicalClinic",
                                        "name": c.name,
                                        "address": c.address || "대한민국",
                                        "telephone": c.phone || "",
                                        "url": `${PLATFORM_URL}/centers/${c.slug}`,
                                        "medicalSpecialty": "아동발달, 언어치료, 감각통합치료, 놀이치료",
                                        ...(c.logo_url ? { "image": c.logo_url } : {}),
                                        ...(c.weekday_hours ? { "openingHours": `Mo-Fr ${c.weekday_hours}` } : {})
                                    }
                                }))
                            },
                            {
                                "@type": "FAQPage",
                                "mainEntity": [
                                    {
                                        "@type": "Question",
                                        "name": "아동발달센터에서는 어떤 치료를 받을 수 있나요?",
                                        "acceptedAnswer": { "@type": "Answer", "text": "아동발달센터에서는 언어치료, 감각통합치료, 놀이치료, 미술치료, 인지학습치료, 사회성 그룹치료 등 다양한 발달 치료 프로그램을 제공합니다. 전문 치료사가 아이의 발달 수준을 평가하고 맞춤 치료 계획을 수립합니다." }
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "언어치료는 몇 살부터 시작하나요?",
                                        "acceptedAnswer": { "@type": "Answer", "text": "언어치료는 보통 18개월~2세부터 시작할 수 있습니다. 또래보다 언어 발달이 느리거나, 발음이 부정확하거나, 의사소통에 어려움이 있다면 전문가 상담을 받아보시는 것이 좋습니다." }
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "아동발달센터 개원 시 어떤 준비가 필요한가요?",
                                        "acceptedAnswer": { "@type": "Answer", "text": "아동발달센터 개원에는 적합한 위치 선정, 전문 치료사 채용, 치료실 인테리어, 운영 시스템(ERP) 구축, 마케팅 전략 수립 등이 필요합니다. 자라다에서는 컨설팅부터 운영 솔루션까지 원스톱으로 지원합니다." }
                                    }
                                ]
                            }
                        ]
                    })}</script>
                )}
            </Helmet>

            {/* ✨ Header — 로고만 표시 (로그인 버튼은 푸터로 이동) */}
            <header
                className={cn(
                    "w-full px-6 md:px-12 py-5 flex items-center fixed top-0 z-[100] transition-all duration-300",
                    isScrolled
                        ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm"
                        : "bg-transparent py-5"
                )}
            >
                <Link to="/" className="flex items-center group">
                    <img
                        src="/zarada_tree_logo.png"
                        alt="자라다 - 아동발달센터 통합 솔루션"
                        className="h-14 md:h-16 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                        style={!isScrolled ? { filter: 'brightness(0) invert(1)' } : undefined}
                    />
                </Link>
            </header>

            {/* 🚀 Hero Section */}
            <main className="flex-1 flex flex-col">
                <div className="relative overflow-hidden" style={{ background: 'linear-gradient(to right, #7E3FBD 0%, #8040BF 35%, #A045AF 55%, #C04D98 75%, #DB5E8A 100%)' }}>
                    <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-pink-300/8 rounded-full blur-[120px]" />
                    <div className="absolute top-[30%] right-[25%] w-[250px] h-[250px] bg-purple-300/5 rounded-full blur-[100px]" />

                <div className="relative z-10 flex flex-col items-center pt-28 md:pt-36 lg:pt-40 pb-16 md:pb-24 px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4 md:space-y-5">
                         <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl">
                            우리 아이에게 딱 맞는<br />발달 센터, <span className="text-pink-200">자라다</span>에서 찾으세요.
                        </h1>
                        <p className="text-sm md:text-lg text-white/70 font-medium max-w-xl mx-auto leading-relaxed">
                            전국의 전문 <strong className="text-white">언어치료</strong>·<strong className="text-white">감각통합</strong> 프로그램을 제공하는 기관들을 찾아 비교하고 바로 예약하고 체험해보세요.
                        </p>
                    </motion.div>

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
                        className="mt-6 md:mt-10 w-full max-w-2xl relative z-[60]"
                    >
                        <div className="bg-white rounded-full p-1.5 md:p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)] flex items-center hover:shadow-[0_25px_70px_rgba(0,0,0,0.16)] transition-shadow duration-500">
                            <form onSubmit={handleEnter} className="flex-1 flex items-center pl-4 md:pl-6">
                                <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none px-3 md:px-4 py-3 md:py-3.5 text-slate-800 font-bold text-sm md:text-base placeholder-slate-300"
                                    placeholder="센터 이름 또는 지역을 검색하세요 (예: 강남, 언어치료)"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={scrollToCenters}
                                className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-violet-500 hover:bg-violet-600 text-white rounded-full transition-colors shadow-lg shadow-violet-400/30 shrink-0 mr-0.5"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
                        className="mt-8 md:mt-10 flex items-center gap-6 md:gap-10"
                    >
                        {[
                            { icon: Star, color: 'text-amber-300', bg: 'bg-white/10', label: `${centers.length}개 센터` },
                            { icon: Users, color: 'text-emerald-300', bg: 'bg-white/10', label: '전문 치료사' },
                            { icon: Heart, color: 'text-rose-300', bg: 'bg-white/10', label: '맞춤 프로그램' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2.5">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg)}>
                                    <item.icon size={16} className={item.color} />
                                </div>
                                <span className="text-white/90 text-sm font-bold">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {fetchError && (
                        <div className="mt-6 mx-auto max-w-xl p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-sm font-bold text-center">
                            {fetchError}
                        </div>
                    )}
                </div>
                </div>
            </main>

            {/* 🏢 센터 찾기 섹션 — 카드 그리드 */}
            <section ref={centerGridRef} className="relative z-20 bg-white pt-10 md:pt-16 pb-16 md:pb-24 scroll-mt-16">
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">

                    {/* Section Header + Filter — 한 줄로 통합 */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                센터 찾기
                            </h2>
                            <p className="text-slate-400 font-medium text-sm mt-1">전국 <span className="text-indigo-600 font-bold">{centers.length}</span>개 센터에서 아이에게 맞는 치료를 만나보세요</p>
                        </motion.div>

                        {/* Region Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {regions.map(region => (
                                <button
                                    key={region}
                                    onClick={() => { setActiveRegion(region); setKeyword(''); }}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 shrink-0",
                                        activeRegion === region
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                            : "bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"
                                    )}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading */}
                    {isInitialLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-slate-400 font-bold text-sm">센터 목록을 불러오는 중...</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!isInitialLoading && filteredCenters.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Search className="w-7 h-7 text-indigo-300" />
                            </div>
                            <p className="text-slate-400 font-bold text-base">
                                {keyword ? `'${keyword}'와 일치하는 센터가 없습니다.` : '해당 지역에 등록된 센터가 없습니다.'}
                            </p>
                            <button onClick={() => { setActiveRegion('전체'); setKeyword(''); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                전체 센터 보기 →
                            </button>
                        </div>
                    )}

                    {/* ✨ Card Grid — 예시 이미지 수준 디자인 */}
                    {!isInitialLoading && filteredCenters.length > 0 && (
                        <motion.div
                            key={`${activeRegion}-${keyword}`}
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
                        >
                            {filteredCenters.map((center, idx) => {
                                const region = extractRegion(center.address);
                                const palette = CARD_COLORS[idx % CARD_COLORS.length];

                                return (
                                    <motion.button
                                        key={center.id}
                                        variants={cardVariants}
                                        onClick={() => handleSelect(center)}
                                        className="group text-left bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
                                    >
                                        {/* 좌측 액센트 바 */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: palette.accent }} />

                                        {/* 센터 헤더 */}
                                        <div className="px-5 pt-5 pb-3 flex items-start gap-3.5 pl-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                                                center.logo_url ? 'bg-slate-50 border border-slate-100' : palette.iconBg
                                            )}>
                                                {center.logo_url ? (
                                                    <img src={center.logo_url} alt={center.name} className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    <span className={cn("font-black text-lg", palette.iconText)}>{center.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[15px] font-black text-slate-800 leading-snug truncate group-hover:text-violet-700 transition-colors">
                                                    {center.name}
                                                </h3>
                                                <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5", palette.badgeBg, palette.badgeText)}>
                                                    {region}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 정보 */}
                                        <div className="px-5 pl-6 pb-3 space-y-1">
                                            <div className="flex items-start gap-2">
                                                <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                                                <span className="text-xs text-slate-500 font-medium leading-snug line-clamp-1">{center.address || '주소 정보 없음'}</span>
                                            </div>
                                            {center.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={13} className="text-slate-400 shrink-0" />
                                                    <span className="text-xs text-slate-500 font-medium">{center.phone}</span>
                                                </div>
                                            )}
                                            {center.weekday_hours && (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-slate-400 shrink-0" />
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        평일 {center.weekday_hours}
                                                        {center.saturday_hours && ` · 토 ${center.saturday_hours}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 하단 버튼 */}
                                        <div className="mx-5 ml-6 mb-4 mt-1">
                                            <div className="flex items-center justify-between text-xs font-bold py-2 px-3.5 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                                                <span>자세히 보기</span>
                                                <ChevronRight size={15} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* 📋 자라다 소개 — 프리미엄 섹션 */}
            <section className="py-20 md:py-28 bg-gradient-to-b from-white to-slate-50">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-14 md:mb-16">
                        <p className="text-sm font-black uppercase tracking-[0.25em] mb-3" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Why Zarada</p>
                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">아동발달센터의<br className="md:hidden" /> 새로운 기준</h2>
                        <p className="text-slate-400 font-medium text-sm md:text-base mt-3 max-w-xl mx-auto">전문적인 치료 환경과 첨단 시스템으로 아이와 부모님, 원장님 모두를 지원합니다</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {[
                            {
                                gradient: 'from-violet-500 to-purple-600',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                ),
                                title: '부모님을 위한 센터 찾기',
                                desc: '우리 아이의 발달 단계와 필요에 맞는 전문 센터를 찾아보세요. 언어치료, 감각통합, 놀이치료, 미술치료, 인지학습치료 등 다양한 전문 분야의 치료사와 시설을 지역별로 비교하고 선택할 수 있습니다.',
                                points: ['지역별 전문 센터 검색', '치료 분야별 비교', '실시간 예약 및 상담'],
                            },
                            {
                                gradient: 'from-fuchsia-500 to-pink-600',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                ),
                                title: '개원 및 운영 솔루션',
                                desc: '아동발달센터 개원부터 성공적인 운영까지. 입지 분석, 인테리어, 치료사 채용, 마케팅 전략, 프로그램 구축까지 원스톱으로 컨설팅합니다.',
                                points: ['입지 선정 및 시장 분석', '브랜딩 및 마케팅 전략', 'ERP 시스템 구축 지원'],
                            },
                            {
                                gradient: 'from-emerald-500 to-teal-600',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                ),
                                title: '데이터 기반 치료 관리',
                                desc: '치료 스케줄, 상담일지, 발달 평가, 비용 청구, 보험 처리까지 하나의 통합 시스템에서 효율적으로 관리하세요. AI 기반 자동 리포트까지 지원합니다.',
                                points: ['스케줄 및 상담 기록 관리', '발달 평가 및 AI 리포트', '베테랑 청구 자동화'],
                            },
                        ].map(item => (
                            <div key={item.title} className="bg-white rounded-2xl p-7 md:p-8 border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 group">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg bg-gradient-to-br", item.gradient)}>
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-violet-700 transition-colors">{item.title}</h3>
                                <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4">{item.desc}</p>
                                <ul className="space-y-2">
                                    {item.points.map(point => (
                                        <li key={point} className="flex items-center gap-2.5 text-[13px] font-bold text-slate-600">
                                            <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-br", item.gradient)} />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🏗️ Corporate Footer */}
            <footer className="py-16 md:py-24 px-4 md:px-8 bg-[#1B1D25] text-white relative">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 pb-12 md:pb-16 border-b border-white/5 items-start">
                        <div className="md:col-span-4 space-y-6">
                            <a href="https://zarada.co.kr/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group w-fit">
                                <img src="/zarada_tree_logo.png" alt="Zarada Logo" className="h-12 w-auto object-contain transition-transform group-hover:scale-110" style={{ filter: 'brightness(0) invert(1)' }} />
                            </a>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed max-w-xs">
                                아이들의 무한한 가능성을 데이터로 증명하는<br />차세대 아동발달센터 솔루션 Zarada입니다.
                            </p>
                            <a href="https://zarada.co.kr/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                컨설팅/마케팅 문의 →
                            </a>
                        </div>
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-8 md:gap-12 md:pl-16 md:border-l md:border-white/5">
                            <div className="sm:col-span-5 space-y-4">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Office</h4>
                                <ul className="space-y-3 text-[13px] text-slate-300 font-bold leading-relaxed">
                                    <li className="grid grid-cols-[50px,1fr] gap-2"><span className="text-slate-500">본사</span><span className="break-keep">경기도 성남시 수정구 청계산로4길 17, 4F</span></li>
                                    <li className="grid grid-cols-[50px,1fr] gap-2"><span className="text-slate-500">연구소</span><span className="break-keep">서울 송파구 석촌호수로12길 51 201호</span></li>
                                </ul>
                            </div>
                            <div className="sm:col-span-3 space-y-4">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Corp No.</h4>
                                <p className="text-[13px] text-slate-300 font-bold tracking-wider whitespace-nowrap">188 - 87 - 02240</p>
                            </div>
                            <div className="sm:col-span-4 space-y-4">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Contact</h4>
                                <div className="space-y-2 text-[13px] text-slate-300 font-bold">
                                    <div className="flex gap-2"><span className="text-slate-500 w-4">T.</span><span>02-2039-1167</span></div>
                                    <div className="flex gap-2"><span className="text-slate-500 w-4">F.</span><span>070-7547-1177</span></div>
                                    <div className="text-indigo-400 font-black pt-1 hover:text-indigo-300 transition-colors cursor-pointer">office@zarada.co.kr</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                    <p className="text-xs font-black text-slate-500 tracking-tight">© Zarada Co., Ltd. All Rights Reserved.</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-8">
                        <Link
                            to={!role ? "/login" : (role === 'super_admin' ? "/master/centers" : (role === 'parent' ? "/parent/home" : "/app/dashboard"))}
                            className="text-[10px] font-black text-slate-600 hover:text-indigo-400 transition-colors uppercase tracking-widest py-2"
                        >
                            {!role ? "Admin Login" : "Workspace"}
                        </Link>
                        <Link to="/policy/privacy" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest py-2">Privacy Policy</Link>
                        <Link to="/policy/terms" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest py-2">Terms of Service</Link>
                    </div>
                </div>
            </footer>

            {/* ♿ SEO: 검색엔진용 숨겨진 시맨틱 콘텐츠 */}
            <div className="sr-only" aria-hidden="false">
                <h2>전국 아동발달센터 목록</h2>
                <p>자라다(Zarada)는 전국의 아동발달센터를 연결하는 통합 플랫폼입니다. 언어치료, 감각통합치료, 놀이치료, 미술치료, 인지학습치료, 발달검사, 언어검사 등 다양한 아동발달 치료 서비스를 제공하는 센터를 검색하실 수 있습니다.</p>
                <p>아동발달센터 개원을 준비하시는 원장님, 소아과·재활의학과 병원 관계자분들은 자라다의 컨설팅, 마케팅, ERP 솔루션을 통해 성공적인 센터 운영을 시작하세요.</p>
                <nav aria-label="센터 목록">
                    <ul>
                        {centers.map(c => (
                            <li key={c.id}>
                                <a href={`${PLATFORM_URL}/centers/${c.slug}`}>
                                    {c.name} - {c.address} {c.phone && `전화: ${c.phone}`} {c.weekday_hours && `운영시간: 평일 ${c.weekday_hours}`}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};
