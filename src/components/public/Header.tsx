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
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { useCenter } from '@/contexts/CenterContext';
import { isSuperAdmin } from '@/config/superAdmin';
import { createPortal } from 'react-dom';

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
    user: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" />
            <circle cx="12" cy="7" r="4" stroke="currentColor" />
        </svg>
    ),
    logout: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" />
        </svg>
    ),
    home: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" />
            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" />
        </svg>
    ),
    globe: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" />
        </svg>
    )
};

interface NavItem {
    name: string;
    href: string;
    external?: boolean;
}

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, role, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // 👑 [Sovereign Rule] Immediate Super Admin recognition for reliable navigation
    const isSuper = isSuperAdmin(user?.email);

    // ✨ [Fix] Unconditional Hook Call - Always fetch branding
    const { branding, loading } = useCenterBranding();
    const { center } = useCenter();

    if (loading) return null;

    const handleLogout = async () => {
        await signOut();
        navigate(basePath || '/');
        setIsMenuOpen(false);
    };

    const basePath = center?.slug ? `/centers/${center.slug}` : '';

    const navigation: NavItem[] = [
        { name: '홈', href: basePath || '/' },
        { name: '센터 소개', href: `${basePath}/about` },
        { name: '프로그램', href: `${basePath}/programs` },
        { name: '치료사 소개', href: `${basePath}/therapists` },
        { name: '문의하기', href: `${basePath}/contact` },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 w-full border-b shadow-sm transition-all duration-300",
            isDark
                ? "border-slate-800 bg-slate-950/80 backdrop-blur-xl"
                : "border-slate-200/60 bg-white/80 backdrop-blur-xl"
        )}>
            <div className="container mx-auto px-4 md:px-6">
                <div className="relative flex h-20 items-center justify-between">
                    {/* Left: Logo */}
                    <div className="z-10 flex items-center">
                        <Link to={basePath || '/'} className={cn("flex items-center gap-2 group")}>
                            {loading ? (
                                <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ) : branding.logo_url ? (
                                <img
                                    src={branding.logo_url}
                                    alt={branding.name || ''}
                                    className="h-12 md:h-14 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                                    style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
                                />
                            ) : (
                                <span className="text-xl font-black tracking-tighter" style={{ color: branding.brand_color || undefined }}>
                                    Zarada
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Center: Navigation (Mathematically Centered) */}
                    <div className="hidden md:flex absolute inset-x-0 bottom-0 top-0 items-center justify-center pointer-events-none">
                        <nav className="flex items-center gap-8 pointer-events-auto">
                            {navigation.map((item) =>
                                item.external ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "text-[13px] font-bold transition-all hover:scale-105 flex items-center gap-1.5 px-4 py-2 rounded-full",
                                            "bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/20",
                                            isDark ? "text-indigo-300" : "text-indigo-600"
                                        )}
                                    >
                                        <span className="relative">
                                            {item.name}
                                        </span>
                                    </a>
                                ) : (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            "text-[14px] font-semibold transition-all hover:opacity-100 relative group py-1",
                                            isActive(item.href)
                                                ? (isDark ? "text-white" : "text-slate-900")
                                                : (isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                                        )}
                                    >
                                        {item.name}
                                        <motion.span
                                            className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                                            initial={false}
                                            animate={{
                                                scaleX: isActive(item.href) ? 1 : 0,
                                                opacity: isActive(item.href) ? 1 : 0,
                                                backgroundColor: branding.brand_color || undefined
                                            }}
                                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                        />
                                    </Link>
                                )
                            )}
                        </nav>
                    </div>

                    {/* Right: Actions */}
                    <div className="z-10 hidden md:flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 group",
                                isDark ? "hover:text-amber-400" : "hover:text-indigo-500"
                            )}
                        >
                            {isDark ? Icons.sun("w-5 h-5 transition-transform group-hover:rotate-45") : Icons.moon("w-5 h-5 transition-transform group-hover:-rotate-12")}
                        </button>

                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {user ? (
                            <div className="relative flex items-center gap-2">
                                {(() => {
                                    const rawEmail = user?.email || '';
                                    const isSuper = isSuperAdmin(rawEmail);
                                    const isParent = !isSuper && (role === 'parent');

                                    return (
                                        <>
                                            <Link
                                                to={isParent ? "/parent/home" : "/app/dashboard"}
                                                className={cn(
                                                    "text-[12px] font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm border",
                                                    isDark
                                                        ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-slate-100"
                                                )}
                                            >
                                                {isParent ? "👶 마이 페이지" : "⚙️ 업무 시스템"}
                                            </Link>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                                    onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all border",
                                                        isDark
                                                            ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                                                            : "bg-white border-slate-200 text-slate-400 hover:text-slate-900"
                                                    )}
                                                >
                                                    {Icons.user("w-5 h-5")}
                                                </button>

                                                <AnimatePresence>
                                                    {showUserMenu && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className={cn(
                                                                "absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl p-1.5 z-[60]",
                                                                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                                                            )}
                                                        >
                                                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                                                <p className="text-[10px] text-slate-400 font-medium truncate">계정 정보</p>
                                                                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold truncate">{user.email}</p>
                                                            </div>
                                                            <Link
                                                                to="/"
                                                                className={cn(
                                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-colors",
                                                                    isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                {Icons.home("w-4 h-4 opacity-50")}
                                                                플랫폼 홈
                                                            </Link>
                                                            {isSuper && (
                                                                <Link
                                                                    to="/master/centers"
                                                                    className={cn(
                                                                        "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-colors text-indigo-600 dark:text-indigo-400",
                                                                        isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                                                                    )}
                                                                >
                                                                    {Icons.globe("w-4 h-4 opacity-70")}
                                                                    마스터 콘솔
                                                                </Link>
                                                            )}
                                                            <button
                                                                onClick={handleLogout}
                                                                className={cn(
                                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-colors text-red-500",
                                                                    isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                                                                )}
                                                            >
                                                                {Icons.logout("w-4 h-4 opacity-70")}
                                                                로그아웃
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <Link
                                to={center?.slug ? `/centers/${center.slug}/login` : "/login"}
                                className={cn(
                                    "text-[12px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm",
                                    isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-slate-800"
                                )}
                            >
                                로그인
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
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
                                "fixed top-[80px] left-0 right-0 bottom-0 z-[9999] md:hidden overflow-hidden",
                                isDark ? "bg-slate-950/95" : "bg-white/95",
                                "backdrop-blur-xl"
                            )}
                        >
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
                                            {item.external ? (
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn(
                                                        "block text-4xl font-black tracking-tighter transition-all py-3 flex items-center gap-3",
                                                        isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                                                    )}
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    {item.name}
                                                    <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                </a>
                                            ) : (
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
                                            )}
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
                                                const isSuper = isSuperAdmin(rawEmail);
                                                const isParent = !isSuper && (role === 'parent');

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
                                                        to="/app/dashboard"
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

                                    <div className="pt-2">
                                        <Link
                                            to="/"
                                            className={cn("w-full py-4 flex items-center justify-center gap-2 text-lg font-black transition-all rounded-2xl shadow-lg",
                                                isDark ? "bg-slate-800 text-white" : "bg-slate-900 text-white shadow-slate-200"
                                            )}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            {isSuper ? '통합 관리 페이지로' : '플랫폼 홈으로 돌아가기'}
                                        </Link>
                                    </div>

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