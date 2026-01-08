// @ts-nocheck
/* eslint-disable */
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Calendar, Users, CreditCard, LogOut, Menu, X,
    Coins, Briefcase, Baby, Stethoscope, Home, BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

// ✨ [수정] 각 메뉴 아이템에 '접근 가능한 역할(roles)' 정의 추가
export const MENU_ITEMS = [
    {
        name: '대시보드',
        path: '/app/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'staff'] // 관리자와 직원만 가능
    },
    {
        name: '상담문의',
        path: '/app/leads',
        icon: Users,
        roles: ['admin', 'staff']
    },
    {
        name: '상담일지',
        path: '/app/consultations',
        icon: BookOpen,
        roles: ['admin', 'therapist'] // ✨ 치료사와 관리자만 가능
    },
    {
        name: '치료 일정',
        path: '/app/schedule',
        icon: Calendar,
        roles: ['admin', 'therapist', 'staff'] // 모두 가능
    },
    {
        name: '아동 관리',
        path: '/app/children',
        icon: Baby,
        roles: ['admin', 'therapist', 'staff']
    },
    {
        name: '직원 관리',
        path: '/app/therapists',
        icon: Stethoscope,
        roles: ['admin'] // ✨ 관리자 전용
    },
    {
        name: '프로그램',
        path: '/app/programs',
        icon: Briefcase,
        roles: ['admin', 'staff']
    },
    {
        name: '수납 관리',
        path: '/app/billing',
        icon: CreditCard,
        roles: ['admin', 'staff']
    },
    {
        name: '급여 관리',
        path: '/app/settlement',
        icon: Coins,
        roles: ['admin'] // ✨ 관리자 전용
    },
];

export function Sidebar() {
    const location = useLocation();
    // ✨ role 가져오기
    const { role, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try { await signOut(); } catch (error) { console.error('Logout failed:', error); }
    };

    // ✨ [핵심] 현재 내 role이 메뉴의 allowed roles에 포함되어 있는지 확인하여 필터링
    // role이 로딩 중이거나 없으면 빈 배열(메뉴 숨김) 처리
    const filteredMenuItems = MENU_ITEMS.filter(item =>
        role && item.roles.includes(role)
    );

    return (
        <>
            <button className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <aside className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 text-white transition-transform duration-300 w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6">
                        <h1 className="text-2xl font-black tracking-tighter text-yellow-400">
                            ZARADA
                            <span className="text-white text-xs font-normal ml-1">
                                {role === 'admin' ? 'Admin' : role === 'therapist' ? 'Therapist' : 'Staff'}
                            </span>
                        </h1>
                    </div>

                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 font-bold mb-4 border border-slate-700/50">
                            <Home className="w-5 h-5" /> 홈페이지
                        </Link>

                        <div className="h-px bg-slate-800 my-2 mx-2"></div>

                        {/* ✨ 필터링된 메뉴만 렌더링 */}
                        {filteredMenuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isActive ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} onClick={() => setIsOpen(false)}>
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-white'}`} />{item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all font-bold"><LogOut className="w-5 h-5" />로그아웃</button></div>
                </div>
            </aside>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}
        </>
    );
}