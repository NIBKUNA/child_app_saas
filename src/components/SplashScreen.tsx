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
 * 🎨 ZARADA - Simple Clean SplashScreen
 * Minimal design with centered logo and center name
 * ============================================
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    // ✨ [Optimization] Initialize based on current URL to prevent flickering of wrong names
    const [centerName, setCenterName] = useState<string>(() => {
        const isCenterPath = window.location.pathname.includes('/centers/');
        return isCenterPath ? '' : '(주)자라다';
    });
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                // 특정 지점 주소(/centers/지점명)가 아닐 때는 무조건 '(주)자라다' 표시
                const isCenterPath = window.location.pathname.includes('/centers/');

                if (!isCenterPath) {
                    setCenterName('(주)자라다');
                    return;
                }

                const { data: settings } = await (supabase
                    .from('admin_settings') as any)
                    .select('*')
                    .eq('key', 'center_name');

                const name = settings?.[0]?.value;
                if (!name) {
                    const { data: center } = await (supabase
                        .from('centers') as any)
                        .select('name')
                        .limit(1)
                        .maybeSingle();
                    if (center?.name) setCenterName(center.name);
                } else {
                    setCenterName(name);
                }
            } catch {
                // Splash branding fetch error - silently ignored
            }
        };

        fetchBranding();

        const exitTimer = setTimeout(() => setIsExiting(true), 1800);
        const completeTimer = setTimeout(() => onComplete(), 2200);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    // ✨ [Optimization] Determine display name based on current path
    const isCenterPath = window.location.pathname.includes('/centers/');
    const displayName = isCenterPath
        ? (centerName || import.meta.env.VITE_CENTER_NAME || '(주)자라다')
        : '(주)자라다';

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center min-h-screen bg-white"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    {/* Main Content - Centered */}
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        {/* Logo Text Only - Clean */}
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900">
                            <span className="text-indigo-600">Z</span>arada
                        </h1>
                        {/* ✨ Center Name Integration */}
                        <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest uppercase opacity-80 text-center">
                            {displayName}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
