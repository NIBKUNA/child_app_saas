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

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "100vh" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={cn(
                            "fixed inset-0 top-[64px] z-40 md:hidden overflow-hidden",
                            isDark ? "bg-slate-950/95" : "bg-white/95",
                            "backdrop-blur-md"
                        )}
                    >
                        <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn("text-2xl font-bold transition-colors py-2 border-b border-transparent hover:border-current w-full",
                                        isActive(item.href)
                                            ? (isDark ? "text-indigo-400" : "text-primary")
                                            : (isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >{item.name}</Link>
                            ))}

                            <hr className={cn("border-t my-2", isDark ? "border-slate-800" : "border-slate-100")} />

                            {user ? (
                                <div className="flex flex-col gap-4">
                                    {(() => {
                                        const rawEmail = user.email || '';
                                        const isSuperAdminEmail = rawEmail.toLowerCase().trim() === 'anukbin@gmail.com';
                                        const isParent = !isSuperAdminEmail && (role === 'parent');

                                        return isParent ? (
                                            <Link
                                                to="/parent/home"
                                                className="flex items-center justify-center w-full py-3 text-lg font-bold text-yellow-700 bg-yellow-100 rounded-xl hover:bg-yellow-200 transition-all"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                👶 마이 페이지
                                            </Link>
                                        ) : (
                                            <Link
                                                to="/app"
                                                className="flex items-center justify-center w-full py-3 text-lg font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                ⚙️ 업무 시스템 접속
                                            </Link>
                                        );
                                    })()}
                                    <button
                                        onClick={handleLogout}
                                        className={cn("w-full py-3 text-lg font-medium transition-colors rounded-xl border",
                                            isDark ? "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-red-400" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500"
                                        )}
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <Link
                                        to="/login"
                                        className={cn("flex items-center justify-center w-full py-3 text-lg font-medium transition-colors rounded-xl border",
                                            isDark ? "border-slate-800 text-white hover:bg-slate-800" : "border-slate-200 text-slate-900 hover:bg-slate-50"
                                        )}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        로그인
                                    </Link>
                                    <Link
                                        to="/contact"
                                        className="flex items-center justify-center w-full py-3 text-lg font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg transition-all"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        상담 예약 하기
                                    </Link>
                                </div>
                            )}

                            <div className="pt-4 mt-auto mb-20">
                                <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>
                                    © 2026 Zarada Child Development Center.<br />All rights reserved.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}