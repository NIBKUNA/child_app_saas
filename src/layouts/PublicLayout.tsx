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

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTrafficSource } from '@/hooks/useTrafficSource';
import { Footer } from '@/components/public/Footer';
import { useTheme } from '@/contexts/ThemeProvider';

// Theme toggle icons
const ThemeIcons = {
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

export function PublicLayout() {
    const { user, role, signOut } = useAuth();
    const { getSetting, loading: settingsLoading } = useAdminSettings();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const logoUrl = getSetting('center_logo');
    const centerName = getSetting('center_name');
    const isDark = theme === 'dark';

    useTrafficSource();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const renderLogo = () => {
        if (logoUrl) {
            return <img src={logoUrl} alt="센터 로고" className="h-10 w-auto object-contain" />;
        }
        if (centerName) {
            return <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{centerName}</span>;
        }
        if (settingsLoading) {
            return <div className={`h-10 w-32 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />;
        }
        return (
            <>
                <span className="text-2xl">🧸</span>
                <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>행복아동발달센터</span>
            </>
        );
    };

    return (
        <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <header className={`fixed top-0 left-0 right-0 backdrop-blur-md z-50 border-b ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-gray-100'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        {renderLogo()}
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/about" className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-blue-600'}`}>센터 소개</Link>
                        <Link to="/programs" className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-blue-600'}`}>프로그램</Link>
                        <Link to="/blog" className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-blue-600'}`}>블로그</Link>
                        <Link to="/contact" className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-blue-600'}`}>문의하기</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-100 text-slate-600'}`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? ThemeIcons.sun("w-5 h-5") : ThemeIcons.moon("w-5 h-5")}
                        </button>

                        {user ? (
                            <>
                                {role !== 'parent' && (
                                    <Link
                                        to="/app"
                                        className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        ⚙️ {role === 'admin' ? '관리자 대시보드' : '업무 시스템 접속'}
                                    </Link>
                                )}

                                {role === 'parent' && (
                                    <Link
                                        to="/parent/home"
                                        className="text-sm font-bold text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full hover:bg-yellow-100 transition-all border border-yellow-200"
                                    >
                                        👶 내 아이 센터
                                    </Link>
                                )}

                                <button onClick={handleLogout} className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={`text-sm font-semibold px-4 py-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>로그인</Link>
                                <Link to="/contact" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">상담 예약</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default PublicLayout;