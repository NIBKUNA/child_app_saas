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
    const [centerName, setCenterName] = useState<string>('');
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const { data: settings } = await supabase
                    .from('admin_settings')
                    .select('*')
                    .eq('key', 'center_name');

                const name = settings?.[0]?.value;
                if (!name) {
                    const { data: center } = await supabase
                        .from('centers')
                        .select('name')
                        .limit(1)
                        .maybeSingle();
                    if (center?.name) setCenterName(center.name);
                } else {
                    setCenterName(name);
                }
            } catch (e) {
                console.log('Splash branding fetch error:', e);
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
                        <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest uppercase opacity-80">
                            {centerName || import.meta.env.VITE_CENTER_NAME}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
