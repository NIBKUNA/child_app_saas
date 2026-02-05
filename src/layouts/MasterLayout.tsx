import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { LayoutDashboard, Building2, Moon, Sun, Shield, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';

export function MasterLayout() {
    const { user, role, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // ✨ Super Admin Security Check
    const isSuper = role === 'super_admin' || checkSuperAdmin(user?.email);

    React.useEffect(() => {
        if (!loading && !isSuper) {
            alert('접근 권한이 없습니다. (Super Admin Only)');
            navigate('/');
        }
    }, [loading, isSuper, navigate]);

    if (loading || !isSuper) return null;

    const navItems = [
        { icon: LayoutDashboard, label: '대시보드', path: '/master' },
        { icon: Building2, label: '전체 센터 관리', path: '/master/centers' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 relative overflow-hidden">
                {/* Brand */}
                <div
                    className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                    onClick={() => navigate('/master/centers')}
                >
                    <Shield className="w-6 h-6 text-indigo-500" />
                    <span className="font-black text-xl tracking-tighter">Zarada</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/master' && location.pathname.startsWith(item.path));
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
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
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        통합페이지
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/login');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h1 className="font-black text-xl">
                        {navItems.find(i => location.pathname.startsWith(i.path) && i.path !== '/master')?.label || '대시보드'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-black text-white">
                            S
                        </div>
                        <span className="font-bold text-sm">Super Admin</span>
                    </div>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
