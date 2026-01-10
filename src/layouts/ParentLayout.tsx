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
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart2, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export function ParentLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const tabs = [
        { id: 'home', label: '홈', icon: Home, path: '/parent/home' },
        { id: 'stats', label: '발달통계', icon: BarChart2, path: '/parent/stats' },
        { id: 'logs', label: '성장일지', icon: MessageSquare, path: '/parent/logs' },
        { id: 'mypage', label: '마이', icon: User, path: '/parent/mypage' },
    ];

    return (
        <div className={cn("min-h-screen transition-colors pb-24", isDark ? "bg-slate-950" : "bg-slate-50")}>
            <Outlet />

            <PWAInstallPrompt />

            {/* Bottom Navigation */}
            <nav className={cn(
                "fixed bottom-0 left-0 right-0 z-50 px-6 py-4 flex justify-around items-center border-t backdrop-blur-xl transition-all safe-area-bottom",
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
            )}>
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all active:scale-95",
                                isActive ? "text-indigo-600" : (isDark ? "text-slate-500 hover:text-slate-400" : "text-slate-400 hover:text-slate-600")
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-2xl transition-all",
                                isActive && (isDark ? "bg-indigo-500/20" : "bg-indigo-50")
                            )}>
                                <tab.icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn("text-[10px] font-bold", isActive ? "opacity-100" : "opacity-0")}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
