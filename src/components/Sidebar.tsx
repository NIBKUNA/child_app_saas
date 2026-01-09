// @ts-nocheck
/* eslint-disable */
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Calendar, Users, CreditCard, LogOut, Menu, X,
    Coins, Briefcase, Baby, Stethoscope, Home, BookOpen, Settings,
    ChevronDown, ChevronRight, Globe, ClipboardList
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from "@/lib/utils";

const MENU_GROUPS = [
    {
        name: '기본 관리',
        items: [
            { name: '대시보드', path: '/app/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
            { name: '치료 일정', path: '/app/schedule', icon: Calendar, roles: ['admin', 'therapist', 'staff'] },
        ]
    },
    {
        name: '상담 및 기록',
        items: [
            { name: '상담문의', path: '/app/leads', icon: Users, roles: ['admin', 'staff'] },
            { name: '상담일지', path: '/app/consultations', icon: BookOpen, roles: ['admin', 'therapist'] },
        ]
    },
    {
        name: '이용자 및 인사',
        items: [
            { name: '아동 관리', path: '/app/children', icon: Baby, roles: ['admin', 'therapist', 'staff'] },
            { name: '직원 관리', path: '/app/therapists', icon: Stethoscope, roles: ['admin'] },
        ]
    },
    {
        name: '재무 및 서비스',
        items: [
            { name: '프로그램', path: '/app/programs', icon: Briefcase, roles: ['admin', 'staff'] },
            { name: '수납 관리', path: '/app/billing', icon: CreditCard, roles: ['admin', 'staff'] },
            { name: '급여 관리', path: '/app/settlement', icon: Coins, roles: ['admin'] },
        ]
    },
    {
        name: '운영 설정',
        items: [
            { name: '블로그 관리', path: '/app/blog', icon: ClipboardList, roles: ['admin', 'manager'] },
            { name: '사이트 관리', path: '/app/settings', icon: Settings, roles: ['admin', 'manager'] },
        ]
    }
];

export function Sidebar() {
    const location = useLocation();
    const { role, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<string[]>(MENU_GROUPS.map(g => g.name));

    const toggleGroup = (groupName: string) => {
        setOpenGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
    };

    const handleLogout = async () => {
        try { await signOut(); } catch (error) { console.error('Logout failed:', error); }
    };

    return (
        <>
            <button className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* ✨ 배경색을 다시 진한 네이비(#0f172a / slate-950)로 복구 */}
            <aside className={cn(
                "fixed top-0 left-0 z-40 h-screen bg-[#0f172a] text-white transition-transform duration-300 w-64 shadow-2xl border-r border-white/5",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full">
                    <div className="p-6 mb-2">
                        <h1 className="text-2xl font-black tracking-tighter text-yellow-400 flex items-center gap-2">
                            ZARADA
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-700 px-1.5 py-0.5 rounded">
                                {role}
                            </span>
                        </h1>
                    </div>

                    <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto custom-scrollbar">
                        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all font-bold border border-white/5">
                            <Globe className="w-5 h-5 text-blue-400" /> 홈페이지 바로가기
                        </Link>

                        {MENU_GROUPS.map((group) => {
                            const visibleItems = group.items.filter(item => role && item.roles.includes(role));
                            if (visibleItems.length === 0) return null;
                            const isGroupOpen = openGroups.includes(group.name);

                            return (
                                <div key={group.name} className="space-y-1.5">
                                    <button
                                        onClick={() => toggleGroup(group.name)}
                                        className="flex items-center justify-between w-full px-4 py-1 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
                                    >
                                        {group.name}
                                        {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm",
                                                            isActive
                                                                ? "bg-yellow-400 text-[#0f172a] shadow-lg shadow-yellow-400/20"
                                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                        )}
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        <item.icon className={cn(
                                                            "w-4 h-4",
                                                            isActive ? "text-[#0f172a]" : "text-slate-500"
                                                        )} />
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

                    <div className="p-4 border-t border-white/5 bg-black/20">
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-all font-bold text-sm">
                            <LogOut className="w-4 h-4" /> 로그아웃
                        </button>
                    </div>
                </div>
            </aside>

            {isOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsOpen(false)} />}
        </>
    );
}