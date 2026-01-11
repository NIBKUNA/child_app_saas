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
 * 🎨 ZARADA - Theme & Role Context Provider
 * Dark/Light toggle with role-based defaults
 * Super Admin detection + Data export controls
 * ============================================
 */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth, type UserRole } from './AuthContext';

// Super Admin email list (add more as needed)
const SUPER_ADMIN_EMAILS = ['admin_real_test@gmail.com', 'anukbin@gmail.com'];

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    isSuperAdmin: boolean;
    canExportData: boolean;
    canViewRevenue: boolean;
    themeClass: string;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
    isSuperAdmin: false,
    canExportData: false,
    canViewRevenue: true,
    themeClass: 'theme-staff',
});

const THEME_STORAGE_KEY = 'zarada_theme_mode';

// Get default theme based on role
function getDefaultTheme(role: UserRole): ThemeMode {
    switch (role) {
        case 'admin':
            return 'dark'; // 원장: 다크 프로페셔널 테마
        case 'therapist':
        case 'staff':
            return 'light'; // 직원: 차분한 라이트 테마
        case 'parent':
            return 'light'; // 부모: 따뜻한 파스텔 테마
        default:
            return 'light';
    }
}

// Get theme utility class based on role
function getThemeClass(role: UserRole, theme: ThemeMode): string {
    if (theme === 'dark') return 'dark';

    switch (role) {
        case 'admin':
            return 'theme-admin';
        case 'therapist':
        case 'staff':
            return 'theme-staff';
        case 'parent':
            return 'theme-parent';
        default:
            return 'theme-staff';
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { role, user } = useAuth();

    // Initialize theme from localStorage or role-based default
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return getDefaultTheme(role);
    });

    // Check if current user is Super Admin (DB Role-Based - not email-based)
    const isSuperAdmin = useMemo(() => {
        return role === 'super_admin';
    }, [role]);

    // Permission flags based on role
    const canExportData = isSuperAdmin; // Only Super Admin can export
    const canViewRevenue = role === 'admin' || role === 'staff' || isSuperAdmin;

    // Theme class for body
    const themeClass = useMemo(() => getThemeClass(role, theme), [role, theme]);

    // Update theme when role changes (first login)
    useEffect(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!stored && role) {
            setThemeState(getDefaultTheme(role));
        }
    }, [role]);

    // Apply theme class to document
    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme classes first
        root.classList.remove('dark', 'theme-admin', 'theme-staff', 'theme-parent');

        // Apply new theme class
        root.classList.add(themeClass);

        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
        }
    }, [themeClass, theme]);

    // Toggle between light and dark
    const toggleTheme = () => {
        setThemeState(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem(THEME_STORAGE_KEY, next);
            return next;
        });
    };

    // Set specific theme
    const setTheme = (mode: ThemeMode) => {
        setThemeState(mode);
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            setTheme,
            isSuperAdmin,
            canExportData,
            canViewRevenue,
            themeClass,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
