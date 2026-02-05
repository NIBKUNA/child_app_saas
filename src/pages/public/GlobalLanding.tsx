import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext'; // ✨ Import
import { Search, ArrowRight, MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';

import { motion, AnimatePresence } from 'framer-motion';

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ✨ [Hook] Handle scroll for header appearance
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ✨ [Hook] Close dropdown on outside click
    useClickOutside(dropdownRef, () => {
        setIsDropdownOpen(false);
    });

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
        if (role === 'super_admin' || localStorage.getItem('zarada_user_role') === 'super_admin') {
            navigate(`/app/dashboard`);
        } else if (center.slug) {
            navigate(`/centers/${center.slug}?login=true`);
        }
        setIsDropdownOpen(false);
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
                    <img src="/zarada_tree_logo.png" alt="Zarada Logo" className="h-16 w-auto object-contain transition-transform group-hover:scale-110" />
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

                <div className="relative z-10 flex flex-col items-center pt-48 pb-32 px-4 text-center">
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
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] drop-shadow-2xl">
                            아동발달센터의<br />
                            확실한 파트너.
                        </h1>

                        <p className="text-xl md:text-2xl text-indigo-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
                            우리 아이가 다니는 센터를 검색하고<br />
                            성장을 위한 자라다의 모든 솔루션을 경험하세요.
                        </p>
                    </motion.div>

                    {/* ✨ The Grand Search Box */}
                    <div className="mt-16 w-full max-w-3xl relative" ref={dropdownRef}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className={cn(
                                "relative z-[60] bg-white rounded-[40px] p-2 md:p-3 shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex items-center transition-all duration-500",
                                isDropdownOpen ? "scale-[1.03] ring-12 ring-indigo-500/10" : "hover:scale-[1.01]"
                            )}
                        >
                            <form onSubmit={handleEnter} className="flex-1 flex items-center pl-6">
                                <Search className="w-7 h-7 text-indigo-500" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value);
                                        if (!isDropdownOpen) setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full bg-transparent border-none outline-none px-6 py-6 text-slate-800 font-extrabold text-2xl placeholder-slate-300"
                                    placeholder="지금 센터 이름을 입력하세요"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="hidden md:flex flex-col items-center justify-center px-8 border-l border-slate-100 text-slate-300 hover:text-indigo-600 transition-all gap-1"
                            >
                                <ChevronDown className={cn("w-6 h-6 transition-transform duration-500", isDropdownOpen && "rotate-180")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Select</span>
                            </button>
                        </motion.div>

                        {/* ✨ Clean Context-Aware Dropdown */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-[85%] left-4 right-4 bg-white rounded-b-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.2)] border border-t-0 border-slate-50 pt-16 pb-6 z-50"
                                >
                                    <div className="max-h-[360px] overflow-y-auto px-4 custom-scrollbar">
                                        {fetchError && (
                                            <div className="mx-4 mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-sm font-bold text-center">
                                                {fetchError}
                                            </div>
                                        )}
                                        {isInitialLoading ? (
                                            <div className="py-20 flex flex-col items-center gap-6">
                                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                                <p className="text-slate-400 font-black tracking-tight">센터 데이터를 불러오고 있습니다...</p>
                                            </div>
                                        ) : filteredCenters.length > 0 ? (
                                            <div className="grid gap-2">
                                                {filteredCenters.map(center => (
                                                    <button
                                                        key={center.id}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleSelect(center);
                                                        }}
                                                        className="group w-full p-6 text-left rounded-[32px] hover:bg-indigo-50 transition-all flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                                                                <MapPin size={28} />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-900 text-2xl group-hover:text-indigo-600 transition-colors line-clamp-1">{center.name}</div>
                                                                <p className="text-slate-400 font-bold mt-1 line-clamp-1">{center.address || '대한민국'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all text-indigo-600">
                                                            <ArrowRight size={24} />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-24 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                    <Search size={40} />
                                                </div>
                                                <p className="text-slate-400 font-black text-xl">검색 결과와 일치하는 센터가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Dashboard Preview or Graphics (Inspired by Image 2) */}
                <div className="relative mt-[-40px] px-8 max-w-5xl mx-auto w-full group">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="bg-slate-900 rounded-[40px] aspect-[16/9] shadow-2xl overflow-hidden p-3 border-4 border-slate-800 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-40 mix-blend-overlay group-hover:opacity-60 transition-opacity" />
                        <div className="w-full h-full bg-[#111827] rounded-[30px] flex items-center justify-center overflow-hidden">
                            {/* Fake Dashboard Elements or Generated Graphics */}
                            <div className="grid grid-cols-12 gap-4 w-full h-full p-8">
                                <div className="col-span-3 space-y-4">
                                    <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
                                    <div className="h-20 w-full bg-slate-800/50 rounded-2xl" />
                                    <div className="h-20 w-full bg-slate-800/50 rounded-2xl" />
                                    <div className="h-20 w-full bg-slate-800/50 rounded-2xl" />
                                </div>
                                <div className="col-span-9 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="h-40 flex-1 bg-indigo-500/10 rounded-[32px] border border-indigo-500/20" />
                                        <div className="h-40 flex-1 bg-purple-500/10 rounded-[32px] border border-purple-500/20" />
                                    </div>
                                    <div className="h-full bg-slate-800/30 rounded-[32px] border border-slate-700/50 p-8">
                                        <div className="h-4 w-48 bg-slate-700 rounded-full mb-6" />
                                        <div className="flex items-end gap-3 h-32">
                                            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                                <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-lg transition-all hover:bg-white" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    </div>
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
                                <img src="/zarada_tree_logo.png" alt="Zarada Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-110" />
                                <span className="text-2xl font-black tracking-tighter text-white group-hover:text-amber-400 transition-colors">Zarada</span>
                            </a>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed max-w-xs">
                                아이들의 무한한 가능성을 데이터로 증명하는<br />
                                차세대 아동발달센터 솔루션 Zarada입니다.
                            </p>
                        </div>

                        {/* 2. Info Section (Separated by border) */}
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-10 gap-12 md:pl-16 md:border-l md:border-white/5">

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
                            <div className="sm:col-span-2 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Corp No.</h4>
                                <p className="text-[13px] text-slate-300 font-bold tracking-wider">188 - 87 - 02240</p>
                            </div>

                            {/* CONTACT */}
                            <div className="sm:col-span-3 space-y-6">
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
                    <div className="flex items-center gap-8">
                        <Link to="/policy/privacy" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</Link>
                        <Link to="/policy/terms" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Terms of Service</Link>
                        <Link
                            to={!role ? "/login" : (role === 'super_admin' ? "/master/centers" : (role === 'parent' ? "/parent/home" : "/app/dashboard"))}
                            className="px-4 py-1.5 rounded-full border border-white/5 text-[10px] font-black text-slate-500 hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest"
                        >
                            {!role ? "Partner Portal" : "Workspace"}
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Global Scrollbar Style */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
};

