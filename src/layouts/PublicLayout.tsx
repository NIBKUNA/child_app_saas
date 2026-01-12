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

// Theme toggle icons removed - now handled in Header component



export function PublicLayout() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useTrafficSource();

    return (
        <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <Header />

            <main className="flex-1 pt-20">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default PublicLayout;