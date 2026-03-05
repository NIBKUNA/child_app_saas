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
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';
import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { isMainDomain } from '@/config/domain';

// ============================================
// 🔐 SIDEBAR STATE PERSISTENCE KEY
// ============================================
const SIDEBAR_STORAGE_KEY = 'zarada_sidebar_open_groups';

// ============================================
// 🎨 MINIMALIST HIGH-END SVG ICONS
// Theme-aware stroke colors
// ============================================
type IconFunction = (className: string) => ReactNode;

const Icons: Record<string, IconFunction> = {
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
    // 알림 아이콘
    bell: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" />
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" />
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

interface MenuItem {
    name: string;
    path: string;
    icon: IconFunction;
    roles: Exclude<UserRole, null>[];
}

interface MenuGroup {
    name: string;
    icon: IconFunction;
    items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
    {
        name: '센터 운영',  // Operations
        icon: Icons.calendar,
        items: [
            // ✨ [Therapist] Only Schedule & Consultations
            // ✨ [Manager] Schedule, Billing, Programs
            { name: '치료 일정', path: '/app/schedule', icon: Icons.calendar, roles: ['super_admin', 'admin', 'therapist', 'manager'] },
            { name: '수납 관리', path: '/app/billing', icon: Icons.billing, roles: ['super_admin', 'admin', 'manager'] },
            { name: '상담일지', path: '/app/consultations', icon: Icons.consultation, roles: ['super_admin', 'admin', 'therapist', 'manager'] },
            { name: '프로그램 관리', path: '/app/programs', icon: Icons.program, roles: ['super_admin', 'admin', 'manager'] },
        ]
    },
    {
        name: '리소스 관리',  // Management
        icon: Icons.members,
        items: [
            { name: '상담문의', path: '/app/leads', icon: Icons.leads, roles: ['super_admin', 'admin', 'manager'] },
            { name: '아동 관리', path: '/app/children', icon: Icons.child, roles: ['super_admin', 'admin', 'manager'] },
            { name: '부모 관리', path: '/app/parents', icon: Icons.members, roles: ['super_admin', 'admin', 'manager'] },
            { name: '직원 관리', path: '/app/therapists', icon: Icons.staff, roles: ['super_admin', 'admin'] },
            { name: '급여 관리', path: '/app/settlement', icon: Icons.salary, roles: ['super_admin', 'admin'] },
        ]
    },
    {
        name: '시스템',  // Platform
        icon: Icons.system,
        items: [
            { name: '대시보드', path: '/app/dashboard', icon: Icons.dashboard, roles: ['super_admin', 'admin'] },
            { name: '사이트 설정', path: '/app/settings', icon: Icons.settings, roles: ['super_admin', 'admin', 'manager'] },
            { name: '알림 설정', path: '/app/notifications', icon: Icons.bell, roles: ['super_admin', 'admin'] },
            { name: '전체 센터 관리', path: '/master/centers', icon: Icons.globe, roles: ['super_admin'] },
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

// ============================================
// 💬 Sidebar Tooltip (for collapsed mode)
// ============================================
function SidebarTooltip({ label, children, show }: { label: string; children: React.ReactNode; show: boolean }) {
    const [visible, setVisible] = React.useState(false);
    const [pos, setPos] = React.useState({ top: 0, left: 0 });
    const ref = React.useRef<HTMLDivElement>(null);

    if (!show) return <>{children}</>;

    const handleEnter = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPos({ top: rect.top + rect.height / 2, left: rect.right + 12 });
        }
        setVisible(true);
    };

    return (
        <div ref={ref} onMouseEnter={handleEnter} onMouseLeave={() => setVisible(false)} className="relative">
            {children}
            {visible && (
                <div
                    className="fixed z-[9999] px-3 py-1.5 bg-slate-800 dark:bg-slate-600 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-100"
                    style={{ top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
                >
                    {label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800 dark:border-r-slate-600" />
                </div>
            )}
        </div>
    );
}


export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: { isOpen: boolean, onClose: () => void, isCollapsed: boolean, onToggleCollapse: () => void }) {
    const location = useLocation();
    const { role, user, signOut } = useAuth();
    const { center } = useCenter();
    const { branding } = useCenterBranding();
    const centerId = center?.id;
    const { isSuperAdmin } = useTheme();

    // ✨ [Notification] 알림 표시 상태
    const [hasUnreadInquiry, setHasUnreadInquiry] = useState(false);
    const [hasUnreadSchedule, setHasUnreadSchedule] = useState(false);

    // ✨ [Dismiss Logic] 메뉴 클릭 시 알림 숨기기 처리
    const handleMenuClick = async (itemName: string) => {
        if (onClose) onClose();
        const cid = centerId || 'global';
        try {
            if (itemName === '치료 일정') {
                // 1. 로컬 상태 즉시 해제 및 마지막 확인 시간 저장
                const now = new Date().toISOString();
                localStorage.setItem(`last_schedule_check_${cid}`, now);
                setHasUnreadSchedule(false);

                // 2. DB 읽음 처리 (백그라운드)
                if (user) {
                    supabase
                        .from('admin_notifications')
                        .update({ is_read: true })
                        .eq('user_id', user.id)
                        .eq('type', 'schedule')
                        .then(() => { });
                }
            }

            if (itemName === '상담문의') {
                // 상담문의는 로컬 스토리지에 마지막 확인 일시 저장
                localStorage.setItem(`last_inquiry_check_${cid}`, new Date().toISOString());
                setHasUnreadInquiry(false);
            }
        } catch (err) {
            console.error("Dismiss Notification Error:", err);
        }
    };

    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const cid = centerId || 'global';

                // 1. 상담문의 (어드민/슈퍼어드민만 표시)
                // 🔔 [Fix] 대기 상태(pending/new)인 문의만 알림 표시
                // 완료(completed)/취소(canceled) 처리된 문의는 알림에서 제외
                if (isSuperAdmin || role === 'admin' || role === 'manager') {
                    let query = supabase
                        .from('consultations')
                        .select('created_at', { count: 'exact', head: true })
                        .is('schedule_id', null)
                        // 🔔 대기 상태만 카운트: pending, new, 또는 status가 NULL인 경우
                        .or('status.eq.pending,status.eq.new,status.is.null');

                    if (centerId) {
                        query = query.eq('center_id', centerId);
                    }

                    const { count: inquiryCount } = await query;
                    setHasUnreadInquiry((inquiryCount || 0) > 0);
                } else {
                    setHasUnreadInquiry(false);
                }

                // 2. 치료 일정 (치료사 개인에게 등록된 알림 중 'schedule' 타입만)
                if (user) {
                    const lastScheduleCheck = localStorage.getItem(`last_schedule_check_${cid}`);

                    let q = supabase
                        .from('admin_notifications')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .eq('type', 'schedule')
                        .eq('is_read', false);

                    if (lastScheduleCheck) {
                        q = q.gt('created_at', lastScheduleCheck);
                    }

                    const { count: notificationCount } = await q;
                    setHasUnreadSchedule((notificationCount || 0) > 0);
                }
            } catch (err) {
                console.error("Sidebar Notification Check Error:", err);
            }
        };

        checkNotifications();
        // 1분마다 주기적 체크 (데스크톱 최적화)
        const timer = setInterval(checkNotifications, 60000);
        return () => clearInterval(timer);
    }, [user, role, isSuperAdmin, centerId]);

    // 🔐 Initialize openGroups from localStorage or default to empty (all closed)
    const [openGroups, setOpenGroups] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch {
            // Sidebar state load error - silently ignored
        }
        return []; // Default: all accordions closed
    });

    // 🔄 Save openGroups to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(openGroups));
        } catch {
            // Sidebar state save error - silently ignored
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, findGroupForPath]);



    // Mobile Toggle (Keep Click)
    const toggleGroup = (groupName: string) => {
        setOpenGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
    };

    const handleLogout = async () => {
        try { await signOut(); } catch (error) { console.error('Logout failed:', error); }
    };

    return (
        <>
            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-[110] h-screen transition-all duration-300",
                isCollapsed ? "w-[68px]" : "w-64",
                "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800",
                isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0 md:shadow-2xl"
            )}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={cn("border-b border-slate-200 dark:border-slate-800", isCollapsed ? "p-3" : "p-6 mb-2")}>
                        <div className="flex items-center justify-between">
                            <div className={cn("flex flex-col items-start gap-1", isCollapsed && "items-center w-full")}>
                                <Link to="/app/dashboard" className="flex items-center group">
                                    <img src={branding.logo_url || '/zarada_tree_logo.png'} alt={branding.name} className={cn("object-contain transition-transform group-hover:scale-110", isCollapsed ? "h-9 w-9" : "h-14 w-auto")} />
                                </Link>
                                {isSuperAdmin && !isCollapsed && (
                                    <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                                        SUPER ADMIN
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && <ThemeToggle />}
                        </div>
                        {!isSuperAdmin && !isCollapsed && (
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border inline-block text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                {role}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className={cn("flex-1 py-2 overflow-y-auto custom-scrollbar", isCollapsed ? "px-2" : "px-4", "space-y-4")}>
                        {/* Homepage Link */}
                        {!isCollapsed ? (
                            <Link
                                to={isMainDomain() ? (center?.slug ? `/centers/${center.slug}` : '/') : '/'}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold border text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                                onClick={onClose}
                            >
                                {Icons.globe("w-5 h-5 text-blue-500 dark:text-blue-400")}
                                홈페이지 바로가기
                            </Link>
                        ) : (
                            <SidebarTooltip label="홈페이지 바로가기" show={isCollapsed}>
                                <Link
                                    to={isMainDomain() ? (center?.slug ? `/centers/${center.slug}` : '/') : '/'}
                                    className="flex items-center justify-center p-3 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                    onClick={onClose}
                                >
                                    {Icons.globe("w-5 h-5 text-blue-500 dark:text-blue-400")}
                                </Link>
                            </SidebarTooltip>
                        )}

                        {/* Menu Groups */}
                        {MENU_GROUPS.map((group) => {
                            // ✨ [Super Admin] isSuperAdmin이면 모든 메뉴 표시, 아니면 role 기반 필터링
                            const visibleItems = isSuperAdmin
                                ? group.items
                                : group.items.filter(item => role && (item.roles as UserRole[]).includes(role));
                            if (visibleItems.length === 0) return null;
                            const isGroupOpen = openGroups.includes(group.name);

                            return (
                                <div key={group.name} className="space-y-1">
                                    {!isCollapsed ? (
                                        /* Expanded: full group header */
                                        <button
                                            onClick={() => toggleGroup(group.name)}
                                            className={cn(
                                                "flex items-center justify-between w-full px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors rounded-lg group",
                                                isGroupOpen
                                                    ? "bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-200"
                                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                {group.icon("w-4 h-4")}
                                                {group.name}
                                            </span>
                                            {isGroupOpen ? Icons.chevronDown("w-3.5 h-3.5") : Icons.chevronRight("w-3.5 h-3.5")}
                                        </button>
                                    ) : (
                                        /* Collapsed: icon-only group divider */
                                        <div className="flex items-center justify-center py-2">
                                            <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
                                        </div>
                                    )}

                                    {(isCollapsed || isGroupOpen) && (
                                        <div className={cn(
                                            isCollapsed
                                                ? "space-y-1"
                                                : "space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 border-l-2 border-slate-100 dark:border-slate-800 ml-6 pl-2 my-1"
                                        )}>
                                            {visibleItems.map((item) => {
                                                const isActive = location.pathname === item.path;
                                                const isExternal = item.path.startsWith('http');

                                                if (isExternal) {
                                                    return (
                                                        <SidebarTooltip key={item.path} label={item.name} show={isCollapsed}>
                                                            <a
                                                                href={item.path}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "flex items-center gap-3 rounded-xl transition-all duration-200 font-bold text-sm gpu-accelerate relative",
                                                                    isCollapsed ? "justify-center p-3" : "px-4 py-2.5",
                                                                    "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                                                                )}
                                                                onClick={() => handleMenuClick(item.name)}
                                                            >
                                                                {item.icon("w-4 h-4 text-emerald-500")}
                                                                {!isCollapsed && item.name}
                                                                {!isCollapsed && <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black">NEW</span>}
                                                            </a>
                                                        </SidebarTooltip>
                                                    );
                                                }

                                                return (
                                                    <SidebarTooltip key={item.path} label={item.name} show={isCollapsed}>
                                                        <Link
                                                            to={item.path}
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-xl transition-all duration-200 font-bold text-sm gpu-accelerate relative",
                                                                isCollapsed ? "justify-center p-3" : "px-4 py-2.5",
                                                                isActive
                                                                    ? "bg-indigo-600 dark:bg-yellow-400 text-white dark:text-slate-900 shadow-lg"
                                                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                                                            )}
                                                            onClick={() => handleMenuClick(item.name)}
                                                        >
                                                            {item.icon(cn("w-4 h-4", isActive ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500"))}
                                                            {!isCollapsed && item.name}

                                                            {/* Notification Dot */}
                                                            {((item.name === '상담문의' && hasUnreadInquiry) || (item.name === '치료 일정' && hasUnreadSchedule)) && (
                                                                <span className={cn("w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse", isCollapsed ? "absolute top-1 right-1" : "absolute right-3")} />
                                                            )}
                                                        </Link>
                                                    </SidebarTooltip>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                        <button
                            onClick={onToggleCollapse}
                            className="hidden md:flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl transition-all text-xs font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            {isCollapsed ? Icons.chevronRight("w-4 h-4") : (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" stroke="currentColor" /></svg>
                                    사이드바 접기
                                </>
                            )}
                        </button>
                        <SidebarTooltip label="로그아웃" show={isCollapsed}>
                            <button
                                onClick={() => {
                                    if (onClose) onClose();
                                    handleLogout();
                                }}
                                className={cn(
                                    "flex items-center gap-3 w-full rounded-xl transition-all font-bold text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950",
                                    isCollapsed ? "justify-center p-3" : "px-4 py-3"
                                )}
                            >
                                {Icons.logout("w-4 h-4")} {!isCollapsed && '로그아웃'}
                            </button>
                        </SidebarTooltip>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[105] md:hidden gpu-accelerate"
                    onClick={onClose}
                />
            )}
        </>
    );
}