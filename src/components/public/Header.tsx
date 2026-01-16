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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenterBranding } from '@/hooks/useCenterBranding';

const LOGO_CACHE_KEY = 'cached_center_logo';
const NAME_CACHE_KEY = 'cached_center_name';

// Custom SVG Icons
const Icons = {
    menu: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" />
        </svg>
    ),
    close: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />
        </svg>
    ),
    sun: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" stroke="currentColor" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" />
        </svg>
    ),
    moon: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" />
        </svg>
    ),
};

import { createPortal } from 'react-dom';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, role, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const { branding } = useCenterBranding(); // ✨ Use Unified Hook

    const handleLogout = async () => {
        await signOut();
        navigate('/');
        setIsMenuOpen(false);
    };

    // ✨ [Clean Code] Internal cache logic removed in favor of hook

    const navigation = [
        { name: '홈', href: '/' },
        { name: '센터 소개', href: '/about' },
        { name: '프로그램', href: '/programs' },
        { name: '블로그', href: '/blog' },
        { name: '문의하기', href: '/contact' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b backdrop-blur-md shadow-sm transition-colors",
            isDark
                ? "border-slate-800 bg-slate-950/70 supports-[backdrop-filter]:bg-slate-950/60"
                : "border-white/20 bg-white/70 supports-[backdrop-filter]:bg-white/60"
        )}>
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className={cn("flex items-center gap-2 font-bold text-xl", isDark ? "text-white" : "text-primary", "group")}>
                            {branding.loading ? (
                                <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            ) : branding.logo_url ? (
                                <div className="relative h-9 w-auto">
                                    <img
                                        src={branding.logo_url}
                                        alt={branding.name}
                                        className="h-9 w-auto object-contain transition-opacity duration-300 opacity-0 data-[loaded=true]:opacity-100 group-hover:scale-105"
                                        style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
                                        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')}
                                    />
                                </div>
                            ) : (
                                <span className={cn("text-2xl font-black tracking-tighter", isDark ? "text-white group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-600", "transition-colors")} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    <span className={isDark ? "text-indigo-400" : "text-indigo-600"}>Z</span>arada
                                </span>
                            )}
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-left">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    isActive(item.href)
                                        ? (isDark ? "text-indigo-400" : "text-primary")
                                        : (isDark ? "text-slate-400" : "text-muted-foreground")
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="flex items-center gap-4">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    "p-2 rounded-full transition-colors",
                                    isDark ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-100 text-slate-600"
                                )}
                                aria-label="Toggle theme"
                            >
                                {isDark ? Icons.sun("w-5 h-5") : Icons.moon("w-5 h-5")}
                            </button>

                            {user ? (
                                (() => {
                                    // ✨ [Role Check Override] UI Level Safety Net
                                    const rawEmail = user?.email || '';
                                    const isSuperAdminEmail = rawEmail.toLowerCase().trim() === 'anukbin@gmail.com';

                                    // If super admin email, force isParent to FALSE, regardless of role state
                                    const isParent = !isSuperAdminEmail && (role === 'parent');

                                    return (
                                        <>
                                            {isParent ? (
                                                <Link
                                                    to="/parent/home"
                                                    className="text-sm font-bold text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full hover:bg-yellow-100 transition-all border border-yellow-200"
                                                >
                                                    👶 마이 페이지
                                                </Link>
                                            ) : (
                                                <Link
                                                    to="/app"
                                                    className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all flex items-center gap-2"
                                                >
                                                    ⚙️ 업무 시스템
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className={cn("text-xs font-medium px-3 py-2 rounded-full transition-colors border",
                                                    isDark ? "border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:text-red-500 hover:bg-slate-50"
                                                )}
                                            >
                                                로그아웃
                                            </button>
                                        </>
                                    );
                                })()
                            ) : (
                                <>
                                    <Link to="/login" className={cn("text-sm font-medium transition-colors", isDark ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-primary")}>로그인</Link>
                                    <Link to="/contact" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">상담 예약</Link>
                                </>
                            )}
                        </div>
                    </nav>

                    <div className="flex items-center gap-2 md:hidden">
                        {/* Mobile Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                isDark ? "text-yellow-400" : "text-slate-600"
                            )}
                            aria-label="Toggle theme"
                        >
                            {isDark ? Icons.sun("w-5 h-5") : Icons.moon("w-5 h-5")}
                        </button>
                        <button
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-800 hover:bg-slate-100"
                            )}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="메뉴"
                        >
                            {isMenuOpen ? Icons.close("w-6 h-6") : Icons.menu("w-6 h-6")}
                        </button>
                    </div>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            key="mobile-menu"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "fixed top-[64px] left-0 right-0 h-[calc(100dvh-64px)] z-[9999] md:hidden overflow-hidden",
                                isDark ? "bg-slate-950/98" : "bg-white/98",
                                "backdrop-blur-xl"
                            )}
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                            <motion.div
                                className="container mx-auto px-6 py-8 flex flex-col h-full overflow-y-auto relative z-10"
                                variants={{
                                    initial: { opacity: 0 },
                                    animate: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
                                    },
                                    exit: {
                                        opacity: 0,
                                        transition: { staggerChildren: 0.05, staggerDirection: -1 }
                                    }
                                }}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <div className="flex flex-col gap-2 mb-8">
                                    {navigation.map((item) => (
                                        <motion.div
                                            key={item.name}
                                            variants={{
                                                initial: { opacity: 0, x: -20 },
                                                animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
                                                exit: { opacity: 0, x: -20 }
                                            }}
                                        >
                                            <Link
                                                to={item.href}
                                                className={cn(
                                                    "block text-4xl font-black tracking-tighter transition-all py-3",
                                                    isActive(item.href)
                                                        ? (isDark ? "text-indigo-400 translate-x-4" : "text-slate-900 translate-x-4")
                                                        : (isDark ? "text-slate-400 hover:text-white hover:translate-x-2" : "text-slate-500 hover:text-slate-900 hover:translate-x-2")
                                                )}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {item.name}
                                                {isActive(item.href) && <span className="ml-2 text-indigo-500">.</span>}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    className="mt-auto space-y-6"
                                    variants={{
                                        initial: { opacity: 0, y: 20 },
                                        animate: { opacity: 1, y: 0, transition: { delay: 0.3 } },
                                        exit: { opacity: 0, y: 20 }
                                    }}
                                >
                                    <hr className={cn("border-t", isDark ? "border-white/10" : "border-black/5")} />

                                    {user ? (
                                        <div className="flex flex-col gap-3">
                                            {(() => {
                                                const rawEmail = user.email || '';
                                                const isSuperAdminEmail = rawEmail.toLowerCase().trim() === 'anukbin@gmail.com';
                                                const isParent = !isSuperAdminEmail && (role === 'parent');

                                                return isParent ? (
                                                    <Link
                                                        to="/parent/home"
                                                        className="w-full py-4 text-center text-lg font-bold text-slate-900 bg-[#FFD700] rounded-2xl hover:bg-[#F4C400] transition-all shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        마이 페이지
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to="/app"
                                                        className="w-full py-4 text-center text-lg font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        업무 시스템
                                                    </Link>
                                                );
                                            })()}
                                            <button
                                                onClick={handleLogout}
                                                className={cn("w-full py-4 text-center text-lg font-medium transition-colors rounded-2xl",
                                                    isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                                                )}
                                            >
                                                로그아웃
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <Link
                                                to="/contact"
                                                className={cn(
                                                    "w-full py-4 text-center text-lg font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]",
                                                    isDark
                                                        ? "bg-indigo-600 text-white shadow-indigo-900/30"
                                                        : "bg-slate-900 text-white shadow-slate-900/10"
                                                )}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                상담 예약하기
                                            </Link>
                                            <Link
                                                to="/login"
                                                className={cn("w-full py-4 text-center text-lg font-medium transition-colors rounded-2xl border-2",
                                                    isDark ? "border-slate-800 text-white hover:bg-slate-800" : "border-slate-100 text-slate-900 hover:bg-slate-50"
                                                )}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                로그인
                                            </Link>
                                        </div>
                                    )}

                                    <div className="pb-8">
                                        <p className={cn("text-xs font-medium text-center", isDark ? "text-slate-600" : "text-slate-400")}>
                                            DESIGNED BY ZARADA
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </header>
    );
}