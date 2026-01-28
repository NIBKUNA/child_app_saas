// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { supabase } from '@/lib/supabase';
import { GrowthIcon, HeartCareIcon, StarIcon, BackgroundShapes } from '@/components/icons/BrandIcons';
import { PlayTherapyIcon, SpeechTherapyIcon, SensoryTherapyIcon, ArtTherapyIcon } from '@/components/icons/ProgramIcons';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { HeroBackground } from '@/components/public/HeroBackground';
import { useCenter } from '@/contexts/CenterContext';

// Custom SVG Icons (no Lucide)
const SvgIcons = {
    chevronDown: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" stroke="currentColor" />
        </svg>
    ),
    arrowRight: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" />
        </svg>
    ),
    quote: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.548 16.227 3 15 3 13.044c0-3.347 2.48-6.332 6.264-8.044L10.5 6.5c-2.352 1.15-3.88 2.882-4.098 4.69.09-.016.178-.024.266-.024a2.5 2.5 0 010 5c-1.38 0-2.5-1.12-2.5-2.5a.5.5 0 01.015-.105zm10.333 0C13.881 16.227 13.333 15 13.333 13.044c0-3.347 2.48-6.332 6.264-8.044L20.833 6.5c-2.352 1.15-3.88 2.882-4.098 4.69.09-.016.178-.024.266-.024a2.5 2.5 0 010 5c-1.38 0-2.5-1.12-2.5-2.5a.5.5 0 01.015-.105z" />
        </svg>
    ),
    bell: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" />
        </svg>
    ),
};

const DEFAULT_CONTENT = {
    brandName: import.meta.env.VITE_CENTER_NAME || "아동발달센터",
    hero: {
        titleFirst: "아동발달의 중심",
        titlePoint: "아이의 행복",
        titleLast: "이\n자라나는 특별한 공간",
        description: "언어치료, 감각통합, 미술/놀이치료 전문 기관.\n최고의 치료사진과 함께 우리 아이의 잠재력을 키워주세요.",
        ctaText: "상담 문의하기",
        defaultBgImage: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&q=80&w=2000,https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=2000,https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=2000"
    },
    values: [
        { title: "근거 기반 치료", desc: "검증된 임상 데이터를 바탕으로 아이에게 가장 적합한 프로그램을 제안합니다." },
        { title: "가족 중심 케어", desc: "아이를 넘어 부모님의 마음까지 세심하게 살피는 통합 지지 시스템을 운영합니다." },
        { title: "지속적인 성장", desc: "치료실 밖에서도 아이의 성장이 이어지도록 체계적인 사후 관리를 제공합니다." }
    ],
    story: {
        quote: "아이들의 웃음이\n자라나는 두 번째 집",
        description: `${import.meta.env.VITE_CENTER_NAME || '아동발달센터'}는 단순히 치료를 위한 공간을 넘어, 아이들이 정서적으로 안정을 찾고 스스로의 힘을 키워가는 따뜻한 보금자리를 지향합니다.`,
        image: "https://images.unsplash.com/photo-1587653263995-422546a72569?auto=format&fit=crop&q=80&w=1200"
    }
};

export function HomePage() {
    const navigate = useNavigate();
    const { getSetting, loading } = useAdminSettings();
    const { theme } = useTheme();
    const { center } = useCenter();
    const [centerInfo, setCenterInfo] = useState<any>(null);
    const isDark = theme === 'dark';

    // ✨ Sync context center to local info for backward partial compatibility if needed, 
    // but prefer using 'center' directly.
    useEffect(() => {
        if (center) setCenterInfo(center);
    }, [center]);

    const bannerUrl = getSetting('main_banner_url');
    const noticeText = getSetting('notice_text');
    const bgImage = bannerUrl || DEFAULT_CONTENT.hero.defaultBgImage;

    const brandName = centerInfo?.name || getSetting('center_name') || DEFAULT_CONTENT.brandName;
    const canonicalUrl = `${window.location.origin}/centers/${centerInfo?.slug || centerInfo?.id || 'main'}`;

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950" />;

    return (
        <div className={`min-h-screen font-sans overflow-x-hidden transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
            <Helmet>
                <title>{brandName} - {centerInfo?.description?.slice(0, 20) || '아이의 행복한 성장을 함께합니다'}</title>
                <meta name="description" content={centerInfo?.description || DEFAULT_CONTENT.hero.description} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:title" content={brandName} />
                <meta property="og:description" content={centerInfo?.description || DEFAULT_CONTENT.hero.description} />
                <meta property="og:image" content={bgImage} />
                {getSetting('seo_keywords') && <meta name="keywords" content={getSetting('seo_keywords')} />}
            </Helmet>

            {!loading && noticeText && (
                <div className={`px-4 py-3 ${isDark ? 'bg-slate-900' : 'bg-slate-900'} text-white`}>
                    <div className="container mx-auto px-4 md:px-8 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-500">
                        {SvgIcons.bell("w-4 h-4 text-yellow-400 fill-yellow-400")}
                        <span>{noticeText}</span>
                    </div>
                </div>
            )}

            {/* ✨ 모바일 최적화: 높이 조정 및 object-position */}
            <section className="relative h-[70vh] md:h-[85vh] flex items-center overflow-hidden">
                <HeroBackground
                    bgImage={bgImage}
                    animationType={getSetting('banner_animation') || 'fade'}
                    duration={Number(getSetting('banner_duration')) || 6}
                />

                <div className="container relative z-10 mx-auto px-6 md:px-12">
                    <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        {/* Premium Tag */}
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>{DEFAULT_CONTENT.hero.titleFirst}</span>
                        </motion.div>

                        <motion.h1
                            className="text-white tracking-tighter"
                            style={{
                                fontSize: 'clamp(2rem, 8vw, 5rem)',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                whiteSpace: 'pre-line',
                                wordBreak: 'keep-all'
                            }}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                        >
                            {getSetting('home_title') || DEFAULT_CONTENT.hero.titlePoint}
                        </motion.h1>
                        {/* Remove separate h2 subtitle if title is custom or keep it as optional */}

                        <motion.p
                            className="text-white/90 font-medium leading-relaxed max-w-lg whitespace-pre-line text-lg md:text-xl drop-shadow-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            {getSetting('home_subtitle') || DEFAULT_CONTENT.hero.description}
                        </motion.p>

                        <div className="flex gap-4 pt-4">
                            <Link to={center?.slug ? `/centers/${center.slug}/contact` : '/contact'}>
                                <motion.button
                                    className="group px-8 py-4 bg-white text-slate-900 rounded-full font-black text-lg shadow-[0_10px_30px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.4)] transition-all flex items-center gap-3"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {DEFAULT_CONTENT.hero.ctaText}
                                    <div className="bg-slate-900 text-white p-1 rounded-full group-hover:bg-indigo-600 transition-colors">
                                        {SvgIcons.arrowRight("w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300")}
                                    </div>
                                </motion.button>
                            </Link>
                        </div>
                    </div >
                </div >

                <motion.div
                    className={`absolute bottom-10 left-1/2 -translate-x-1/2 ${isDark ? 'text-white/50' : 'text-white/50'}`}
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {SvgIcons.chevronDown("w-10 h-10")}
                </motion.div>
            </section >

            {/* Mobile-First Floating Cards Section */}
            < div className={`relative -mt-20 z-20 rounded-tl-[80px] rounded-tr-none px-4 pb-32 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] overflow-visible ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`
            }>
                {/* Background Abstract Shapes */}
                < BackgroundShapes />

                <div className="container mx-auto pt-24 px-2 md:px-8 relative z-10">

                    {/* Value Cards - Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {DEFAULT_CONTENT.values.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 100, delay: idx * 0.1 }}
                            >
                                <div className={`h-full rounded-[40px] p-8 md:p-10 shadow-xl border hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${isDark ? 'bg-slate-800 border-slate-700 shadow-slate-900/40' : 'bg-white border-slate-100 shadow-slate-200/40'}`}>
                                    <div className="mb-6">
                                        {idx === 0 ? <StarIcon /> : idx === 1 ? <HeartCareIcon /> : <GrowthIcon />}
                                    </div>
                                    <h3 className={`text-2xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                                    <p className={`font-medium leading-relaxed text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Story Section */}
                    <motion.div
                        className={`mt-24 relative rounded-[50px] overflow-hidden shadow-2xl border ${isDark ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' : 'bg-white border-slate-100 shadow-indigo-100/50'}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
                                {SvgIcons.quote(`w-14 h-14 ${isDark ? 'text-slate-700' : 'text-indigo-100'}`)}
                                <h3
                                    className={`text-3xl md:text-4xl font-black leading-[1.15] tracking-[-0.05em] ${isDark ? 'text-white' : 'text-slate-900'}`}
                                    style={{ wordBreak: 'keep-all' }}
                                >
                                    {getSetting('home_story_title') || DEFAULT_CONTENT.story.quote}
                                </h3>
                                <p className={`text-base font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
                                    {getSetting('home_story_body') || DEFAULT_CONTENT.story.description}
                                </p>
                                <Link
                                    to={getSetting('home_cta_link') || (center?.slug ? `/centers/${center.slug}/contact` : '/contact')}
                                    className={`inline-flex items-center gap-2 font-bold text-sm hover:underline mt-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}
                                >
                                    {getSetting('home_cta_text') || '상담 예약하기'}
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="relative h-[350px] lg:h-auto">
                                <img
                                    src={getSetting('home_story_image') || DEFAULT_CONTENT.story.image}
                                    alt="Center Concept"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-l"></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Programs Preview Section */}
                    <motion.section
                        className="mt-24 text-center"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 80 }}
                    >
                        <div className="mb-12">
                            <span className={cn(
                                "inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-4",
                                isDark ? "bg-indigo-900 text-indigo-300" : "bg-indigo-50 text-indigo-600"
                            )}>
                                Our Programs
                            </span>
                            <h2
                                className={cn(
                                    "text-3xl md:text-4xl font-black tracking-[-0.05em]",
                                    isDark ? "text-white" : "text-slate-900"
                                )}
                                style={{ wordBreak: 'keep-all' }}
                            >
                                맞춤형 발달 지원 프로그램
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {[
                                { Icon: SpeechTherapyIcon, name: '언어치료', desc: '의사소통 능력 향상', lightColor: 'from-indigo-50 to-white', darkColor: 'from-indigo-900/30 to-slate-900' },
                                { Icon: SensoryTherapyIcon, name: '감통치료', desc: '감각통합 발달 지원', lightColor: 'from-emerald-50 to-white', darkColor: 'from-emerald-900/30 to-slate-900' },
                                { Icon: ArtTherapyIcon, name: '미술치료', desc: '정서 표현 및 치유', lightColor: 'from-amber-50 to-white', darkColor: 'from-amber-900/30 to-slate-900' },
                                { Icon: PlayTherapyIcon, name: '놀이치료', desc: '사회성·정서 발달', lightColor: 'from-rose-50 to-white', darkColor: 'from-rose-900/30 to-slate-900' },
                            ].map((program, idx) => (
                                <motion.div
                                    key={idx}
                                    className={cn(
                                        "bg-gradient-to-b rounded-[28px] p-6 shadow-lg border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer",
                                        isDark
                                            ? `${program.darkColor} border-slate-800 shadow-black/20`
                                            : `${program.lightColor} border-slate-100 shadow-slate-100`
                                    )}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => navigate(center?.slug ? `/centers/${center.slug}/programs` : '/programs')}
                                >
                                    <div className="w-14 h-14 mx-auto mb-3">
                                        <program.Icon className="w-14 h-14" />
                                    </div>
                                    <p className={cn("font-black text-sm mb-1", isDark ? "text-white" : "text-slate-800")}>{program.name}</p>
                                    <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-400")}>{program.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                        <Link to={center?.slug ? `/centers/${center.slug}/programs` : '/programs'} className={cn(
                            "inline-flex items-center gap-2 mt-10 font-bold text-sm hover:underline",
                            isDark ? "text-indigo-400" : "text-indigo-600"
                        )}>
                            모든 프로그램 보기 {SvgIcons.arrowRight("w-4 h-4")}
                        </Link>
                    </motion.section>

                    {/* Trust Section - Qualitative Statements */}
                    <motion.section
                        className="mt-20 relative"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 80 }}
                    >
                        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-[50px] p-10 md:p-16 text-white relative overflow-hidden">
                            {/* Decorative - reduced blur */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-lg"></div>

                            <div className="relative z-10 text-center max-w-3xl mx-auto">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">
                                    Why Zarada
                                </span>
                                <h2
                                    className="text-3xl md:text-4xl font-black tracking-[-0.05em] mb-8"
                                    style={{ wordBreak: 'keep-all' }}
                                >
                                    신뢰할 수 있는 전문 치료진의<br />
                                    1:1 맞춤 케어
                                </h2>

                                {/* Trust Points */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                                    {[
                                        { icon: '🎓', title: '전문 자격', desc: '국가공인 치료사' },
                                        { icon: '💝', title: '개별 맞춤', desc: '1:1 집중 케어' },
                                        { icon: '📊', title: '체계적 평가', desc: '과학적 검사 도구' },
                                        { icon: '🤝', title: '부모 소통', desc: '매 회기 피드백' }
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="bg-white/10 backdrop-blur-md rounded-[24px] p-5 border border-white/10"
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <div className="text-2xl mb-2">{item.icon}</div>
                                            <p className="font-black text-sm mb-1">{item.title}</p>
                                            <p className="text-white/60 text-xs font-medium">{item.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>


                    {/* Final CTA Section */}
                    <motion.section
                        className="mt-24 mb-8 text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2
                            className={cn(
                                "text-3xl md:text-4xl font-black mb-6 tracking-[-0.05em]",
                                isDark ? "text-white" : "text-slate-900"
                            )}
                            style={{ wordBreak: 'keep-all' }}
                        >
                            아이의 첫 걸음, 함께 시작해요
                        </h2>
                        <p className={cn(
                            "font-medium mb-10 max-w-md mx-auto",
                            isDark ? "text-slate-400" : "text-slate-500"
                        )} style={{ wordBreak: 'keep-all' }}>
                            무료 초기 상담을 통해 우리 아이에게 필요한 지원을 알아보세요.
                        </p>
                        <Link to={center?.slug ? `/centers/${center.slug}/contact` : '/contact'}>
                            <motion.button
                                className={cn(
                                    "px-10 py-5 rounded-full font-black text-lg shadow-xl transition-all flex items-center gap-3 mx-auto ring-2",
                                    isDark
                                        ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/50 ring-indigo-400/30"
                                        : "bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-300 ring-slate-800/20"
                                )}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                무료 상담 예약하기
                                {SvgIcons.arrowRight("w-5 h-5")}
                            </motion.button>
                        </Link>
                    </motion.section>
                </div>
            </div >
        </div >
    );
}

function ValueItem({ icon, title, desc }) {
    return (
        <div className="space-y-6 text-left">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">{icon}</div>
            <h3 className="text-2xl font-black text-slate-900">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}