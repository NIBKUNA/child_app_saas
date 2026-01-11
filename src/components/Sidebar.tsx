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
/**
 * ============================================
 * 🎨 ZARADA - Zenith Sidebar v2
 * Custom Minimalist SVG Icons + Dark Mode
 * No Lucide/Emoji - Pure Inline SVG
 * ============================================
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { useState, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";

// ============================================
// 🔐 SIDEBAR STATE PERSISTENCE KEY
// ============================================
const SIDEBAR_STORAGE_KEY = 'zarada_sidebar_open_groups';

// ============================================
// 🎨 MINIMALIST HIGH-END SVG ICONS
// Theme-aware stroke colors
// ============================================
const Icons = {
    // 센터 현황 그룹 아이콘
    centerStatus: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" stroke="currentColor" />
            <path d="M7 16l4-6 4 4 5-8" stroke="currentColor" />
        </svg>
    ),
    dashboard: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" />
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" />
        </svg>
    ),
    calendar: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" />
        </svg>
    ),
    billing: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" />
            <path d="M2 10h20" stroke="currentColor" />
        </svg>
    ),
    // 회원 관리 그룹 아이콘
    members: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="4" stroke="currentColor" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" />
            <circle cx="17" cy="11" r="3" stroke="currentColor" />
            <path d="M21 21v-1.5a3 3 0 00-3-3h-.5" stroke="currentColor" />
        </svg>
    ),
    leads: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" stroke="currentColor" />
            <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="currentColor" />
        </svg>
    ),
    consultation: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z" stroke="currentColor" />
            <path d="M8 10h8M8 14h4" stroke="currentColor" />
        </svg>
    ),
    child: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" stroke="currentColor" />
            <path d="M3 21v-2a7 7 0 017-7h4a7 7 0 017 7v2" stroke="currentColor" />
        </svg>
    ),
    // 인사 관리 그룹 아이콘
    hr: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" />
            <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M12 12v4M9 14h6" stroke="currentColor" />
        </svg>
    ),
    staff: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" stroke="currentColor" />
            <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" />
            <path d="M15 3a4 4 0 010 8" stroke="currentColor" opacity="0.5" />
        </svg>
    ),
    salary: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" stroke="currentColor" />
            <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9M9 12h4.5a1.5 1.5 0 010 3H9" stroke="currentColor" />
        </svg>
    ),
    // 시스템 설정 그룹 아이콘
    system: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" stroke="currentColor" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" />
        </svg>
    ),
    program: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
            <path d="M9 3v18M3 9h18" stroke="currentColor" />
        </svg>
    ),
    blog: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" />
            <path d="M6 8h12M6 12h8M6 16h4" stroke="currentColor" />
        </svg>
    ),
    settings: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" stroke="currentColor" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" stroke="currentColor" />
        </svg>
    ),
    // 공통 아이콘
    globe: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" />
            <path d="M2 12h20" stroke="currentColor" />
        </svg>
    ),
    logout: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" />
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
    chevronDown: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" stroke="currentColor" />
        </svg>
    ),
    chevronRight: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" stroke="currentColor" />
        </svg>
    ),
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
};

// ============================================
// ZENITH SIDEBAR - 4대 분류 메뉴 구조 (Reorganized)
// [Insight] → [Operations] → [Management] → [Platform]
// ============================================
const MENU_GROUPS = [
    {
        name: '통계',  // Insight
        icon: Icons.centerStatus,
        items: [
            { name: '대시보드', path: '/app/dashboard', icon: Icons.dashboard, roles: ['super_admin', 'admin', 'staff'] },
        ]
    },
    {
        name: '센터 운영',  // Operations
        icon: Icons.calendar,
        items: [
            { name: '치료 일정', path: '/app/schedule', icon: Icons.calendar, roles: ['super_admin', 'admin', 'therapist', 'staff'] },
            { name: '수납 관리', path: '/app/billing', icon: Icons.billing, roles: ['super_admin', 'admin', 'staff'] },
            { name: '상담일지', path: '/app/consultations', icon: Icons.consultation, roles: ['super_admin', 'admin', 'therapist'] },
            { name: '프로그램 관리', path: '/app/programs', icon: Icons.program, roles: ['super_admin', 'admin', 'staff'] },
        ]
    },
    {
        name: '리소스 관리',  // Management
        icon: Icons.members,
        items: [
            { name: '상담문의', path: '/app/leads', icon: Icons.leads, roles: ['super_admin', 'admin', 'staff'] },
            { name: '아동 관리', path: '/app/children', icon: Icons.child, roles: ['super_admin', 'admin', 'therapist', 'staff'] },
            { name: '직원 관리', path: '/app/therapists', icon: Icons.staff, roles: ['super_admin', 'admin'] },
            { name: '급여 관리', path: '/app/settlement', icon: Icons.salary, roles: ['super_admin', 'admin'] },
        ]
    },
    {
        name: '시스템',  // Platform
        icon: Icons.system,
        items: [
            { name: '블로그 관리', path: '/app/blog', icon: Icons.blog, roles: ['super_admin'] },
            { name: '사이트 설정', path: '/app/settings', icon: Icons.settings, roles: ['super_admin'] },
        ]
    }
];

// ============================================
// 🌙 Theme Toggle Switch Component
// ============================================
function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative flex items-center w-14 h-7 rounded-full transition-all duration-300 gpu-accelerate",
                isDark
                    ? "bg-indigo-600 shadow-lg shadow-indigo-500/30"
                    : "bg-slate-200 dark:bg-slate-700"
            )}
            aria-label="Toggle theme"
        >
            <span
                className={cn(
                    "absolute w-5 h-5 rounded-full bg-white dark:bg-slate-200 shadow-md transition-all duration-300 flex items-center justify-center",
                    isDark ? "left-8" : "left-1"
                )}
            >
                {isDark ? Icons.moon("w-3 h-3 text-indigo-600") : Icons.sun("w-3 h-3 text-amber-500")}
            </span>
        </button>
    );
}

export function Sidebar() {
    const location = useLocation();
    const { role, signOut } = useAuth();
    const { theme, isSuperAdmin } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    // 🔐 Initialize openGroups from localStorage or default to empty (all closed)
    const [openGroups, setOpenGroups] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.log('Sidebar state load error:', e);
        }
        return []; // Default: all accordions closed
    });

    // 🔄 Save openGroups to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(openGroups));
        } catch (e) {
            console.log('Sidebar state save error:', e);
        }
    }, [openGroups]);

    // 🎯 Auto-expand the group containing the current path
    const findGroupForPath = useCallback((pathname: string): string | null => {
        for (const group of MENU_GROUPS) {
            if (group.items.some(item => pathname === item.path || pathname.startsWith(item.path + '/'))) {
                return group.name;
            }
        }
        return null;
    }, []);

    // 🔄 Sync with current route on navigation
    useEffect(() => {
        const currentGroup = findGroupForPath(location.pathname);
        if (currentGroup && !openGroups.includes(currentGroup)) {
            setOpenGroups(prev => [...prev, currentGroup]);
        }
    }, [location.pathname, findGroupForPath]);

    const toggleGroup = (groupName: string) => {
        setOpenGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
    };

    const handleLogout = async () => {
        try { await signOut(); } catch (error) { console.error('Logout failed:', error); }
    };

    const isDark = theme === 'dark';

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md gpu-accelerate border border-slate-200 dark:border-slate-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? Icons.close("w-6 h-6 text-slate-900 dark:text-white") : Icons.menu("w-6 h-6 text-slate-900 dark:text-white")}
            </button>

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-40 h-screen transition-transform duration-300 w-64 shadow-2xl gpu-accelerate",
                "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 mb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h1 className={cn(
                                "text-2xl font-black tracking-tighter flex items-center gap-2",
                                "text-indigo-600 dark:text-yellow-400"
                            )}>
                                ZARADA
                                {isSuperAdmin && (
                                    <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Super
                                    </span>
                                )}
                            </h1>
                            <ThemeToggle />
                        </div>
                        {/* ✨ [Super Admin] 일반 등급 배지 대신 전용 UI */}
                        {!isSuperAdmin && (
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border inline-block text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                {role}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Homepage Link */}
                        <Link
                            to="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold border text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                        >
                            {Icons.globe("w-5 h-5 text-blue-500 dark:text-blue-400")}
                            홈페이지 바로가기
                        </Link>

                        {/* Menu Groups */}
                        {MENU_GROUPS.map((group) => {
                            // ✨ [Super Admin] isSuperAdmin이면 모든 메뉴 표시, 아니면 role 기반 필터링
                            const visibleItems = isSuperAdmin
                                ? group.items
                                : group.items.filter(item => role && item.roles.includes(role));
                            if (visibleItems.length === 0) return null;
                            const isGroupOpen = openGroups.includes(group.name);

                            return (
                                <div key={group.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleGroup(group.name)}
                                        className="flex items-center justify-between w-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    >
                                        <span className="flex items-center gap-2">
                                            {group.icon("w-4 h-4")}
                                            {group.name}
                                        </span>
                                        {isGroupOpen ? Icons.chevronDown("w-3.5 h-3.5") : Icons.chevronRight("w-3.5 h-3.5")}
                                    </button>

                                    {isGroupOpen && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                            {visibleItems.map((item) => {
                                                const isActive = location.pathname === item.path;
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm gpu-accelerate",
                                                            isActive
                                                                ? "bg-indigo-600 dark:bg-yellow-400 text-white dark:text-slate-900 shadow-lg"
                                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                                                        )}
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        {item.icon(cn("w-4 h-4", isActive ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500"))}
                                                        {item.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                        >
                            {Icons.logout("w-4 h-4")} 로그아웃
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden gpu-accelerate"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}