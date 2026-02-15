import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { Building2, Film, Moon, Sun, Shield, LayoutGrid, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';
import { AnimatePresence, motion } from 'framer-motion';

export function MasterLayout() {
    const { user, role, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ✨ Super Admin Security Check
    const isSuper = role === 'super_admin' || checkSuperAdmin(user?.email);

    React.useEffect(() => {
        if (!loading && !isSuper) {
            alert('접근 권한이 없습니다. (Super Admin Only)');
            const hostname = window.location.hostname;
            const isMainDomain = ['app.myparents.co.kr', 'localhost', '127.0.0.1'].includes(hostname)
                || hostname.endsWith('.vercel.app');
            if (isMainDomain) {
                navigate('/');
            } else {
                window.location.href = 'https://app.myparents.co.kr/';
            }
        }
    }, [loading, isSuper, navigate]);

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    if (loading || !isSuper) return null;

    const navItems = [
        { icon: Building2, label: '전체 센터 관리', path: '/master/centers' },
        { icon: Film, label: '홍보 콘텐츠', path: '/master/promo' },
    ];

    const currentPageLabel = navItems.find(i => location.pathname.startsWith(i.path))?.label || '전체 센터 관리';

    const SidebarContent = () => (
        <>
            {/* Nav */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path !== '/master' && location.pathname.startsWith(item.path));
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-1 mb-4">
                    <button
                        onClick={toggleTheme}
                        className={cn("flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all", theme === 'light' ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white")}
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={cn("flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all", theme === 'dark' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white")}
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={() => {
                        setIsMobileMenuOpen(false);
                        // 커스텀 도메인에서 접속한 경우 메인 플랫폼 도메인으로 이동
                        const hostname = window.location.hostname;
                        const isMainDomain = ['app.myparents.co.kr', 'localhost', '127.0.0.1'].includes(hostname)
                            || hostname.endsWith('.vercel.app');
                        if (isMainDomain) {
                            navigate('/');
                        } else {
                            window.location.href = 'https://app.myparents.co.kr/';
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
                >
                    <LayoutGrid className="w-4 h-4" />
                    통합페이지
                </button>

                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        const hostname = window.location.hostname;
                        const isMainDomain = ['app.myparents.co.kr', 'localhost', '127.0.0.1'].includes(hostname)
                            || hostname.endsWith('.vercel.app');
                        if (isMainDomain) {
                            navigate('/login');
                        } else {
                            window.location.href = 'https://app.myparents.co.kr/login';
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    로그아웃
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0 relative overflow-hidden">
                {/* Brand */}
                <div
                    className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                    onClick={() => navigate('/master/centers')}
                >
                    <Shield className="w-6 h-6 text-indigo-500" />
                    <span className="font-black text-xl tracking-tighter">Zarada</span>
                </div>

                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Slide-in Sidebar */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900 text-white flex flex-col z-50 md:hidden shadow-2xl"
                        >
                            {/* Brand + Close */}
                            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => { navigate('/master/centers'); setIsMobileMenuOpen(false); }}
                                >
                                    <Shield className="w-6 h-6 text-indigo-500" />
                                    <span className="font-black text-xl tracking-tighter">Zarada</span>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto min-w-0">
                <header className="h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            aria-label="메뉴 열기"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="font-black text-base md:text-xl truncate">
                            {currentPageLabel}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-500 flex items-center justify-center text-[10px] md:text-xs font-black text-white">
                            S
                        </div>
                        <span className="font-bold text-xs md:text-sm hidden sm:inline">Super Admin</span>
                    </div>
                </header>

                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
