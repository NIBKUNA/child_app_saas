// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Heart, CheckCircle2, Star, Quote, ChevronDown, ArrowRight, Bell
} from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { supabase } from '@/lib/supabase';
import { GrowthIcon, HeartCareIcon, StarIcon, BackgroundShapes } from '@/components/icons/BrandIcons';
import { PlayTherapyIcon, SpeechTherapyIcon, SensoryTherapyIcon, ArtTherapyIcon } from '@/components/icons/ProgramIcons';

const DEFAULT_CONTENT = {
    brandName: "행복아동발달센터",
    hero: {
        titleFirst: "아이의",
        titlePoint: "행복",
        titleLast: "이\n우리의 시작입니다",
        description: "전문적인 치료사와 따뜻한 환경 속에서\n우리 아이의 잠재력이 아름답게 피어납니다.",
        ctaText: "무료 상담 신청하기",
        defaultBgImage: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&q=80&w=2000"
    },
    values: [
        { title: "근거 기반 치료", desc: "검증된 임상 데이터를 바탕으로 아이에게 가장 적합한 프로그램을 제안합니다." },
        { title: "가족 중심 케어", desc: "아이를 넘어 부모님의 마음까지 세심하게 살피는 통합 지지 시스템을 운영합니다." },
        { title: "지속적인 성장", desc: "치료실 밖에서도 아이의 성장이 이어지도록 체계적인 사후 관리를 제공합니다." }
    ],
    story: {
        quote: "아이들의 웃음이\n자라나는 두 번째 집",
        description: "행복아동발달센터는 단순히 치료를 위한 공간을 넘어, 아이들이 정서적으로 안정을 찾고 스스로의 힘을 키워가는 따뜻한 보금자리를 지향합니다.",
        image: "https://images.unsplash.com/photo-1587653263995-422546a72569?auto=format&fit=crop&q=80&w=1200"
    }
};

export function HomePage() {
    const navigate = useNavigate();
    const { getSetting, loading } = useAdminSettings();
    const [centerInfo, setCenterInfo] = useState<any>(null);

    useEffect(() => {
        const fetchCenter = async () => {
            const { data } = await supabase.from('centers').select('*').limit(1).single();
            if (data) setCenterInfo(data);
        };
        fetchCenter();
    }, []);

    const bannerUrl = getSetting('main_banner_url');
    const noticeText = getSetting('notice_text');
    const bgImage = bannerUrl || DEFAULT_CONTENT.hero.defaultBgImage;

    // ✨ 우선순위: 관리자 설정 센터명 > DB centers 테이블 이름 > 기본 하드코딩 값
    // getSetting('center_logo')와 혼동되지 않도록 'center_name' 또는 'name' 확인이 필요할 수 있습니다.
    const brandName = getSetting('center_name') || centerInfo?.name || DEFAULT_CONTENT.brandName;

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            <Helmet>
                <title>{brandName} - 아이의 행복한 성장을 함께합니다</title>
            </Helmet>

            {!loading && noticeText && (
                <div className="bg-slate-900 text-white px-4 py-3">
                    <div className="container mx-auto px-4 md:px-8 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-500">
                        <Bell className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>{noticeText}</span>
                    </div>
                </div>
            )}

            <section className="relative h-[85vh] flex items-center overflow-hidden">
                {/* Background with slight scale animation */}
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                >
                    {/* Stronger gradient for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/50 to-slate-900/80"></div>
                </motion.div>

                <div className="container relative z-10 mx-auto px-6 md:px-12">
                    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
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
                                whiteSpace: 'nowrap',
                                wordBreak: 'keep-all'
                            }}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                        >
                            {DEFAULT_CONTENT.hero.titlePoint}
                            <span className="text-indigo-300">{DEFAULT_CONTENT.hero.titleLast.split('\n')[0]}</span>
                        </motion.h1>
                        <motion.h2
                            className="text-white tracking-tighter -mt-2"
                            style={{
                                fontSize: 'clamp(1.8rem, 7vw, 4rem)',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                whiteSpace: 'nowrap',
                                wordBreak: 'keep-all'
                            }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                        >
                            {DEFAULT_CONTENT.hero.titleLast.split('\n')[1]}
                        </motion.h2>

                        <motion.p
                            className="text-white/90 font-medium leading-relaxed max-w-lg whitespace-pre-line text-lg md:text-xl drop-shadow-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            {DEFAULT_CONTENT.hero.description}
                        </motion.p>

                        <div className="flex gap-4 pt-4">
                            <Link to="/contact">
                                <motion.button
                                    className="group px-8 py-4 bg-white text-slate-900 rounded-full font-black text-lg shadow-[0_10px_30px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.4)] transition-all flex items-center gap-3"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {DEFAULT_CONTENT.hero.ctaText}
                                    <div className="bg-slate-900 text-white p-1 rounded-full group-hover:bg-indigo-600 transition-colors">
                                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                    </div>
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ChevronDown className="w-10 h-10" />
                </motion.div>
            </section>

            {/* Mobile-First Floating Cards Section */}
            <div className="bg-slate-50 relative -mt-20 z-20 rounded-tl-[80px] rounded-tr-none px-4 pb-32 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] overflow-visible">
                {/* Background Abstract Shapes */}
                <BackgroundShapes />

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
                                <div className="h-full bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                    <div className="mb-6">
                                        {idx === 0 ? <StarIcon /> : idx === 1 ? <HeartCareIcon /> : <GrowthIcon />}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed text-lg">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Story Section */}
                    <motion.div
                        className="mt-24 relative bg-white rounded-[50px] overflow-hidden shadow-2xl shadow-indigo-100/50 border border-slate-100"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
                                <Quote className="w-14 h-14 text-indigo-100" />
                                <h3
                                    className="text-3xl md:text-4xl font-black leading-[1.15] text-slate-900 tracking-[-0.05em]"
                                    style={{ wordBreak: 'keep-all' }}
                                >
                                    {DEFAULT_CONTENT.story.quote}
                                </h3>
                                <p className="text-base text-slate-500 font-medium leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                                    {brandName}는 단순한 치료 공간이 아닙니다.
                                    아이들이 스스로 꽃피울 수 있도록
                                    <strong className="text-indigo-600"> 가장 따뜻한 햇살</strong>이 되어주겠습니다.
                                </p>
                            </div>
                            <div className="relative h-[350px] lg:h-auto">
                                <img
                                    src={getSetting('about_main_image') || DEFAULT_CONTENT.story.image}
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
                            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black tracking-wider uppercase mb-4">
                                Our Programs
                            </span>
                            <h2
                                className="text-3xl md:text-4xl font-black text-slate-900 tracking-[-0.05em]"
                                style={{ wordBreak: 'keep-all' }}
                            >
                                맞춤형 발달 지원 프로그램
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {[
                                { Icon: SpeechTherapyIcon, name: '언어치료', desc: '의사소통 능력 향상', color: 'from-indigo-50 to-white' },
                                { Icon: SensoryTherapyIcon, name: '감통치료', desc: '감각통합 발달 지원', color: 'from-emerald-50 to-white' },
                                { Icon: ArtTherapyIcon, name: '미술치료', desc: '정서 표현 및 치유', color: 'from-amber-50 to-white' },
                                { Icon: PlayTherapyIcon, name: '놀이치료', desc: '사회성·정서 발달', color: 'from-rose-50 to-white' },
                            ].map((program, idx) => (
                                <motion.div
                                    key={idx}
                                    className={`bg-gradient-to-b ${program.color} rounded-[28px] p-6 shadow-lg shadow-slate-100 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => navigate('/programs')}
                                >
                                    <div className="w-14 h-14 mx-auto mb-3">
                                        <program.Icon className="w-14 h-14" />
                                    </div>
                                    <p className="font-black text-slate-800 text-sm mb-1">{program.name}</p>
                                    <p className="text-xs text-slate-400 font-medium">{program.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                        <Link to="/programs" className="inline-flex items-center gap-2 mt-10 text-indigo-600 font-bold text-sm hover:underline">
                            모든 프로그램 보기 <ArrowRight className="w-4 h-4" />
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
                            {/* Decorative */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl"></div>

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
                            className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-[-0.05em]"
                            style={{ wordBreak: 'keep-all' }}
                        >
                            아이의 첫 걸음, 함께 시작해요
                        </h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto" style={{ wordBreak: 'keep-all' }}>
                            무료 초기 상담을 통해 우리 아이에게 필요한 지원을 알아보세요.
                        </p>
                        <Link to="/contact">
                            <motion.button
                                className="px-10 py-5 bg-slate-900 text-white rounded-full font-black text-lg shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all flex items-center gap-3 mx-auto"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                무료 상담 예약하기
                                <ArrowRight className="w-5 h-5" />
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