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

import { Outlet } from 'react-router-dom';
import { useTrafficSource } from '@/hooks/useTrafficSource';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenterBranding } from '@/hooks/useCenterBranding';

export function PublicLayout() {
    const { theme } = useTheme();
    const { loading } = useCenterBranding();
    const isDark = theme === 'dark';

    useTrafficSource();

    // ✨ [Anti-Flicker] Prevent showing default header/footer before branding is ready
    // If we have cache, loading will be false instantly. If not, show skeleton/minimal bg.
    if (loading) return (
        <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <div className="flex-1 pt-20 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <Header />

            <main className="flex-1" style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' }}>
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default PublicLayout;