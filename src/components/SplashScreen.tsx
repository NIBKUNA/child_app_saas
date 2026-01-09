// @ts-nocheck
/* eslint-disable */
/**
 * ============================================
 * 🎨 ZARADA MASTER TEMPLATE - SplashScreen
 * Premium "Mysterious Blur Fade-in" Effect
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
                        .single();
                    if (center?.name) setCenterName(center.name);
                } else {
                    setCenterName(name);
                }
            } catch (e) {
                console.log('Splash branding fetch error:', e);
            }
        };

        fetchBranding();

        const exitTimer = setTimeout(() => setIsExiting(true), 2000);
        const completeTimer = setTimeout(() => onComplete(), 2600);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    // Letter animation for "Zarada"
    const zaradaLetters = "Zarada".split("");

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 50%, #e0e7ff 100%)'
                    }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(20px)' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    {/* Floating Gradient Orb */}
                    <motion.div
                        className="absolute w-[500px] h-[500px] rounded-full opacity-30"
                        style={{
                            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)'
                        }}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0.3 }}
                        transition={{ duration: 2.5, ease: 'easeOut' }}
                    />

                    {/* Main Content - Mysterious Blur Fade-in */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center"
                        initial={{ opacity: 0, filter: 'blur(30px)', y: 20 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        transition={{
                            duration: 1.2,
                            delay: 0.2,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                    >
                        {/* Zarada Typography */}
                        <div className="flex items-center">
                            {zaradaLetters.map((letter, i) => (
                                <motion.span
                                    key={i}
                                    className="font-black tracking-tighter"
                                    style={{
                                        fontSize: 'clamp(3.5rem, 12vw, 5rem)',
                                        color: i === 0 ? 'var(--theme-primary, #4F46E5)' : '#0F172A',
                                        fontFamily: 'system-ui, -apple-system, sans-serif'
                                    }}
                                    initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.4 + i * 0.06,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </div>

                        {/* Subtle Line */}
                        <motion.div
                            className="w-16 h-[2px] mt-6 rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, #4F46E5, transparent)' }}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1 }}
                        />

                        {/* Center Name */}
                        <motion.p
                            className="mt-6 text-lg font-semibold text-slate-500 tracking-wide"
                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                        >
                            {centerName || '아동발달센터'}
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
