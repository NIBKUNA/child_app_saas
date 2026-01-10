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
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeProvider';

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
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // ✨ [Instant Logo/Name] 기존 캐시 로직 100% 유지
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem(LOGO_CACHE_KEY) || '');
    const [centerName, setCenterName] = useState(() => localStorage.getItem(NAME_CACHE_KEY) || '행복아동발달센터');
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const { data: settingsData } = await supabase
                    .from('admin_settings')
                    .select('key, value')
                    .in('key', ['center_logo', 'center_name']);

                let finalLogo = '';
                let finalName = '';

                if (settingsData) {
                    settingsData.forEach((item: any) => {
                        if (item.key === 'center_logo') finalLogo = item.value;
                        if (item.key === 'center_name') finalName = item.value;
                    });
                }

                if (!finalName) {
                    const { data: centerData } = await supabase.from('centers').select('name').limit(1).single();
                    if (centerData?.name) finalName = centerData.name;
                }

                if (finalLogo) {
                    setLogoUrl(finalLogo);
                    localStorage.setItem(LOGO_CACHE_KEY, finalLogo);
                }
                if (finalName) {
                    setCenterName(finalName);
                    localStorage.setItem(NAME_CACHE_KEY, finalName);
                }
            } catch (error) {
                console.error('Failed to fetch branding:', error);
            }
        };
        fetchBranding();
    }, []);

    const navigation = [
        { name: '홈', href: '/' },
        { name: '센터 소개', href: '/about' },
        { name: '프로그램', href: '/programs' },
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
                        <Link to="/" className={cn("flex items-center gap-2 font-bold text-xl", isDark ? "text-white" : "text-primary")}>
                            {logoUrl ? (
                                <div className={`h-8 min-w-[100px] flex items-center ${!imageLoaded ? 'logo-skeleton' : ''}`}>
                                    <img
                                        src={logoUrl}
                                        alt={centerName}
                                        className={cn(
                                            "h-8 w-auto object-contain transition-all duration-150",
                                            imageLoaded ? 'opacity-100' : 'opacity-0'
                                        )}
                                        style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
                                        loading="eager"
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => {
                                            localStorage.removeItem(LOGO_CACHE_KEY);
                                            setLogoUrl('');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🧸</span>
                                    <span>{centerName}</span>
                                </div>
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
                            <Link to="/login" className={cn("text-sm font-medium transition-colors", isDark ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-primary")}>로그인</Link>
                            <Link to="/contact" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">상담 예약</Link>
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
                            className={cn("p-2", isDark ? "text-slate-400" : "text-muted-foreground")}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? Icons.close("w-6 h-6") : Icons.menu("w-6 h-6")}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className={cn("md:hidden border-t text-left", isDark ? "border-slate-800" : "")}>
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn("block px-3 py-2 rounded-md text-base font-medium transition-colors",
                                    isActive(item.href)
                                        ? (isDark ? "bg-slate-800 text-indigo-400" : "bg-primary/10 text-primary")
                                        : (isDark ? "text-slate-400 hover:bg-slate-800" : "text-muted-foreground hover:bg-accent")
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >{item.name}</Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}