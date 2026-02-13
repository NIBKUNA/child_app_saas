import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext'; // ✨ Import
import { Search, ArrowRight, MapPin, Users, Brain, Wallet, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

import { motion } from 'framer-motion';

interface Center {
    id: string;
    name: string;
    slug: string | null;
    address: string | null;
}

export const GlobalLanding = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [keyword, setKeyword] = useState('');
    const [centers, setCenters] = useState<Center[]>([]);
    const [filteredCenters, setFilteredCenters] = useState<Center[]>([]);


    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // ✨ [Hook] Handle scroll for header appearance
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    // ✨ [Data] Fetch All Active Centers
    useEffect(() => {
        const fetchCenters = async () => {
            setIsInitialLoading(true);
            try {
                const { data, error } = await supabase
                    .from('centers')
                    .select('id, name, slug, address')
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                if (data) {
                    setCenters(data);
                    setFilteredCenters(data);
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

    // ✨ [Search] Filter Logic
    useEffect(() => {
        if (!keyword.trim()) {
            setFilteredCenters(centers);
        } else {
            const lowerKeyword = keyword.toLowerCase();
            setFilteredCenters(centers.filter(c =>
                c.name.toLowerCase().includes(lowerKeyword) ||
                (c.slug && c.slug.toLowerCase().includes(lowerKeyword)) ||
                (c.address && c.address.toLowerCase().includes(lowerKeyword))
            ));
        }
    }, [keyword, centers]);

    const handleSelect = (center: Center) => {
        if (center.slug) {
            localStorage.setItem('zarada_center_slug', center.slug);
        }

        // Navigation Logic
        if (center.slug) {
            const isSuperAdmin = role === 'super_admin' || localStorage.getItem('zarada_user_role') === 'super_admin';
            navigate(`/centers/${center.slug}${isSuperAdmin ? '' : '?login=true'}`);
        }
    };

    const handleEnter = (e: React.FormEvent) => {
        e.preventDefault();
        if (filteredCenters.length > 0) {
            handleSelect(filteredCenters[0]);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
            <Helmet>
                <title>자라다(Zarada) | 아동발달센터 통합 관리 솔루션</title>
                <meta name="description" content="우리 아이가 다니는 아동발달센터를 검색하세요. 자라다는 아동발달센터의 효율적인 운영과 아이들의 성장을 돕는 차세대 ERP 솔루션입니다." />
            </Helmet>

            {/* ✨ Premium Header */}
            <header
                className={cn(
                    "w-full px-6 md:px-12 py-6 flex justify-between items-center fixed top-0 z-[100] transition-all duration-300",
                    isScrolled
                        ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm"
                        : "bg-transparent py-6"
                )}
            >
                <Link to="/" className="flex items-center group">
                    <img
                        src="/zarada_tree_logo.png"
                        alt="Zarada Logo"
                        className="h-16 w-auto object-contain transition-all duration-300 group-hover:scale-110"
                        style={!isScrolled ? { filter: 'brightness(0) invert(1)' } : undefined}
                    />
                </Link>
                <div className="flex items-center gap-6">
                    {/* Partner Login 버튼 제거 (사용자 요청) */}
                </div>
            </header>

            {/* 🚀 Main Hero Section */}
            <main className="flex-1 flex flex-col relative">
                {/* Dynamic Background Area */}
                <div className="absolute top-0 left-0 right-0 h-[85vh] bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] overflow-hidden">
                    {/* Abstract Decorative Elements */}
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px]" />

                    {/* Bottom Wave/Curve */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-white" style={{ borderRadius: '100% 100% 0 0 / 100% 100% 0 0' }} />
                </div>

                <div className="relative z-10 flex flex-col items-center pt-32 md:pt-48 pb-20 md:pb-32 px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Hero Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black tracking-widest uppercase">
                            <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
                            Next-Gen ERP for Child Centers
                        </div>

                        {/* High-Impact Headline */}
                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] drop-shadow-2xl">
                            아동발달센터의<br />
                            확실한 파트너.
                        </h1>

                        <p className="text-lg md:text-2xl text-indigo-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
                            우리 아이가 다니는 센터를 검색하고<br />
                            성장을 위한 자라다의 모든 솔루션을 경험하세요.
                        </p>
                    </motion.div>

                    {/* ✨ The Grand Search Box */}
                    <div className="mt-10 md:mt-16 w-full max-w-3xl relative">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="relative z-[60] bg-white rounded-full p-2 md:p-3 shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex items-center hover:scale-[1.01] transition-all duration-500"
                        >
                            <form onSubmit={handleEnter} className="flex-1 flex items-center pl-6">
                                <Search className="w-7 h-7 text-indigo-500" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none px-4 md:px-6 py-4 md:py-6 text-slate-800 font-extrabold text-lg md:text-2xl placeholder-slate-300"
                                    placeholder="센터 이름을 검색하세요"
                                />
                            </form>
                            {centers.length > 0 && (
                                <div className="hidden md:flex items-center justify-center px-6 border-l border-slate-100">
                                    <span className="text-sm font-black text-indigo-600 whitespace-nowrap">{centers.length}개 센터</span>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {fetchError && (
                        <div className="mt-8 mx-auto max-w-xl p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-200 text-sm font-bold text-center">
                            {fetchError}
                        </div>
                    )}

                    {/* ✨ Marquee Center Ticker (default view) */}
                    {!keyword && centers.length > 0 && !isInitialLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="mt-10 w-full max-w-5xl mx-auto overflow-hidden"
                        >
                            <p className="text-center text-indigo-200 text-xs font-black uppercase tracking-[0.3em] mb-4">
                                우리 아이의 센터를 클릭하세요
                            </p>
                            <div className="relative">
                                {/* Fade edges */}
                                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
                                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />
                                <div className="marquee-track flex gap-3 py-2">
                                    {/* Double the items for seamless loop */}
                                    {[...centers, ...centers].map((center, idx) => (
                                        <button
                                            key={`${center.id}-${idx}`}
                                            onClick={() => handleSelect(center)}
                                            className="group flex items-center gap-2.5 px-5 py-2.5 bg-indigo-600 rounded-full hover:bg-indigo-700 hover:scale-105 transition-all duration-300 whitespace-nowrap shrink-0 shadow-md shadow-indigo-500/20"
                                        >
                                            <MapPin size={14} className="text-indigo-200 group-hover:text-white transition-colors" />
                                            <span className="text-white font-bold text-sm">{center.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ✨ Search Results (visible only when typing) */}
                    {keyword && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 w-full max-w-3xl mx-auto px-4"
                        >
                            {filteredCenters.length > 0 ? (
                                <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden divide-y divide-slate-50">
                                    {filteredCenters.map(center => (
                                        <button
                                            key={center.id}
                                            onClick={() => handleSelect(center)}
                                            className="group w-full p-5 text-left hover:bg-indigo-50 transition-all flex items-center gap-4"
                                        >
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors truncate">{center.name}</div>
                                                <p className="text-slate-400 text-xs font-bold mt-0.5 truncate">{center.address || '대한민국'}</p>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-500 transition-all shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-white/50 font-black text-lg">'{keyword}'와 일치하는 센터가 없습니다.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {isInitialLoading && (
                        <div className="mt-12 py-8 flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-white/40 font-bold text-sm">센터 목록 로딩 중...</p>
                        </div>
                    )}

                    {/* 🔍 SEO: Crawlable center list + JSON-LD structured data */}
                    {centers.length > 0 && (
                        <Helmet>
                            <meta name="keywords" content={centers.map(c => `${c.name} ${c.address || ''}`).join(', ') + ', 아동발달센터, 언어치료, 놀이치료, 감각통합치료'} />
                            <script type="application/ld+json">{JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "ItemList",
                                "name": "자라다 아동발달센터 목록",
                                "description": "자라다(Zarada) 파트너 아동발달센터 전국 목록",
                                "numberOfItems": centers.length,
                                "itemListElement": centers.map((c, i) => ({
                                    "@type": "ListItem",
                                    "position": i + 1,
                                    "item": {
                                        "@type": "LocalBusiness",
                                        "name": c.name,
                                        "address": c.address || '대한민국',
                                        "url": `https://app.myparents.co.kr/centers/${c.slug}`
                                    }
                                }))
                            })}</script>
                        </Helmet>
                    )}
                </div>

                {/* 📊 Interactive Dashboard Infographic */}
                <div className="relative mt-12 px-4 md:px-8 max-w-5xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden p-6 md:p-10 border border-slate-700/50 relative"
                    >
                        {/* Ambient glow */}
                        <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">Zarada ERP Dashboard</p>
                                <h3 className="text-white text-lg md:text-xl font-black mt-1">센터 운영의 모든 것, 한눈에</h3>
                            </div>
                        </div>

                        {/* 4 Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 relative z-10">
                            {[
                                { label: '아이 관리', value: '1,247', sub: '+23 이번 달', IconComp: Users, color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', accent: 'text-violet-400', iconColor: 'text-violet-400' },
                                { label: '치료 세션', value: '8,432', sub: '월 평균', IconComp: Brain, color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', accent: 'text-blue-400', iconColor: 'text-blue-400' },
                                { label: '자동 정산', value: '₩92M', sub: '이번 달 매출', IconComp: Wallet, color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', accent: 'text-emerald-400', iconColor: 'text-emerald-400' },
                                { label: '스케줄 관리', value: '324', sub: '이번 주 예약', IconComp: CalendarDays, color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', accent: 'text-amber-400', iconColor: 'text-amber-400' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                                    className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-4 md:p-5`}
                                >
                                    <stat.IconComp size={22} className={`${stat.iconColor} mb-2`} />
                                    <div className="text-white font-black text-xl md:text-2xl tracking-tight">{stat.value}</div>
                                    <div className="text-slate-400 text-[11px] font-bold mt-0.5">{stat.label}</div>
                                    <div className={`${stat.accent} text-[10px] font-bold mt-1`}>{stat.sub}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom Row: Chart + Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                            {/* Bar Chart — 주간 세션 추이 */}
                            <div className="md:col-span-3 bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-slate-300 text-xs font-black">주간 세션 추이</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500" /><span className="text-slate-500 text-[9px] font-bold">언어</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-violet-500" /><span className="text-slate-500 text-[9px] font-bold">감각</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /><span className="text-slate-500 text-[9px] font-bold">놀이</span></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-white text-lg font-black">152</span>
                                    <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">+12.5% ↑</span>
                                </div>
                                {/* Chart area with grid lines */}
                                <div className="relative h-32">
                                    {/* Horizontal grid lines */}
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="absolute left-0 right-0 border-t border-slate-700/30" style={{ bottom: `${i * 33.3}%` }} />
                                    ))}
                                    {/* Trend line (SVG overlay) */}
                                    <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 600 128" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#818cf8" />
                                                <stop offset="100%" stopColor="#a78bfa" />
                                            </linearGradient>
                                        </defs>
                                        <polyline
                                            fill="none"
                                            stroke="url(#lineGrad)"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            points="50,105 150,70 250,82 350,45 450,22 550,58"
                                            className="chart-line"
                                        />
                                        {/* Data points */}
                                        {[[50, 105], [150, 70], [250, 82], [350, 45], [450, 22], [550, 58]].map(([cx, cy], i) => (
                                            <circle key={i} cx={cx} cy={cy} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="2" className="chart-dot" style={{ animationDelay: `${1 + i * 0.1}s` }} />
                                        ))}
                                    </svg>
                                    {/* Bars */}
                                    <div className="flex items-end gap-2 h-full relative z-0">
                                        {[
                                            { h: 25, day: '월', colors: 'from-indigo-600 via-indigo-500 to-indigo-400' },
                                            { h: 50, day: '화', colors: 'from-indigo-600 via-indigo-500 to-violet-400' },
                                            { h: 38, day: '수', colors: 'from-violet-600 via-violet-500 to-indigo-400' },
                                            { h: 70, day: '목', colors: 'from-violet-600 via-purple-500 to-indigo-400' },
                                            { h: 92, day: '금', colors: 'from-indigo-600 via-purple-500 to-violet-400' },
                                            { h: 48, day: '토', colors: 'from-slate-600 via-slate-500 to-slate-400' },
                                        ].map((bar, i) => (
                                            <div key={bar.day} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full rounded-lg relative overflow-hidden" style={{ height: `${bar.h}%` }}>
                                                    <div
                                                        className={`absolute bottom-0 left-0 right-0 rounded-lg bg-gradient-to-t ${bar.colors} opacity-80`}
                                                        style={{ animation: `barGrow 0.8s ease-out ${0.8 + i * 0.08}s both` }}
                                                    />
                                                    {/* Shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-lg" style={{ animation: `barGrow 0.8s ease-out ${0.8 + i * 0.08}s both` }} />
                                                </div>
                                                <span className="text-slate-500 text-[9px] font-bold">{bar.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Timeline */}
                            <div className="md:col-span-2 bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
                                <span className="text-slate-300 text-xs font-black block mb-4">오늘의 일정</span>
                                <div className="space-y-3">
                                    {[
                                        { time: '09:00', name: '김○○', type: '언어치료', color: 'bg-blue-400' },
                                        { time: '10:30', name: '이○○', type: '감각통합', color: 'bg-violet-400' },
                                        { time: '13:00', name: '박○○', type: '놀이치료', color: 'bg-emerald-400' },
                                        { time: '14:30', name: '최○○', type: '인지치료', color: 'bg-amber-400' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.time}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 1.0 + i * 0.12, duration: 0.4 }}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="text-slate-500 text-[10px] font-mono font-bold w-10 shrink-0">{item.time}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.color} shrink-0`} />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-white text-xs font-bold">{item.name}</span>
                                                <span className="text-slate-500 text-[10px] font-bold ml-2">{item.type}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* 🤝 Partners Section (White Area) */}
            <div className="py-24 bg-white">
                <div className="flex justify-center items-center gap-16 grayscale opacity-30 select-none">
                    <div className="text-slate-300 font-black text-3xl tracking-tighter">NAVER</div>
                    <div className="text-slate-300 font-black text-3xl tracking-tighter">GOOGLE</div>
                </div>
            </div>

            {/* 🏗️ Corporate Footer */}
            <footer className="py-24 px-8 bg-[#1B1D25] text-white relative">
                <div className="max-w-6xl mx-auto">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 pb-16 border-b border-white/5 items-start">

                        {/* 1. Brand Section */}
                        <div className="md:col-span-4 space-y-8">
                            <a
                                href="https://zarada.co.kr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 group w-fit"
                            >
                                <img src="/zarada_tree_logo.png" alt="Zarada Logo" className="h-12 w-auto object-contain transition-transform group-hover:scale-110" style={{ filter: 'brightness(0) invert(1)' }} />
                            </a>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed max-w-xs">
                                아이들의 무한한 가능성을 데이터로 증명하는<br />
                                차세대 아동발달센터 솔루션 Zarada입니다.
                            </p>
                            <a href="https://zarada.co.kr/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                컨설팅/마케팅 문의 →
                            </a>
                        </div>

                        {/* 2. Info Section (Separated by border) */}
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-10 md:gap-12 md:pl-16 md:border-l md:border-white/5">

                            {/* OFFICE */}
                            <div className="sm:col-span-5 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Office</h4>
                                <ul className="space-y-4 text-[13px] text-slate-300 font-bold leading-relaxed">
                                    <li className="grid grid-cols-[60px,1fr] gap-2">
                                        <span className="text-slate-500">본사</span>
                                        <span className="break-keep">경기도 성남시 수정구 청계산로4길 17, 4F</span>
                                    </li>
                                    <li className="grid grid-cols-[60px,1fr] gap-2">
                                        <span className="text-slate-500">연구소</span>
                                        <span className="break-keep">서울 송파구 석촌호수로12길 51 201호</span>
                                    </li>
                                </ul>
                            </div>

                            {/* CORP NO. */}
                            <div className="sm:col-span-3 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Corp No.</h4>
                                <p className="text-[13px] text-slate-300 font-bold tracking-wider whitespace-nowrap">188 - 87 - 02240</p>
                            </div>

                            {/* CONTACT */}
                            <div className="sm:col-span-4 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Contact</h4>
                                <div className="space-y-4 text-[13px] text-slate-300 font-bold">
                                    <div className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-3">
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 w-4">T.</span>
                                            <span className="whitespace-nowrap">02-2039-1167</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 w-4">F.</span>
                                            <span className="whitespace-nowrap">070-7547-1177</span>
                                        </div>
                                    </div>
                                    <div className="text-indigo-400 font-black pt-1 hover:text-indigo-300 transition-colors cursor-pointer">office@zarada.co.kr</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Bottom Bar Container */}
                <div className="max-w-6xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-black text-slate-500 tracking-tight">
                        © Zarada Co., Ltd. All Rights Reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-8">
                        <Link to="/policy/privacy" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest py-2">Privacy Policy</Link>
                        <Link to="/policy/terms" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest py-2">Terms of Service</Link>
                        <Link
                            to={!role ? "/login" : (role === 'super_admin' ? "/master/centers" : (role === 'parent' ? "/parent/home" : "/app/dashboard"))}
                            className="px-4 py-2 rounded-full border border-white/5 text-[10px] font-black text-slate-500 hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest"
                        >
                            {!role ? "Partner Portal" : "Workspace"}
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .marquee-track {
                    animation: marquee-scroll 25s linear infinite;
                }
                .marquee-track:hover {
                    animation-play-state: paused;
                }

                @keyframes barGrow {
                    0% { height: 0%; }
                    100% { height: 100%; }
                }

                .chart-line {
                    stroke-dasharray: 1200;
                    stroke-dashoffset: 1200;
                    animation: drawLine 1.5s ease-out 0.8s forwards;
                }
                @keyframes drawLine {
                    to { stroke-dashoffset: 0; }
                }

                .chart-dot {
                    opacity: 0;
                    transform-origin: center;
                    animation: dotAppear 0.3s ease-out forwards;
                }
                @keyframes dotAppear {
                    0% { opacity: 0; r: 0; }
                    100% { opacity: 1; r: 4; }
                }
            `}} />
        </div>
    );
};

