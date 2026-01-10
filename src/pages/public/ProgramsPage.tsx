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
 * 🎨 ZARADA PREMIUM - ProgramsPage with Dark Mode
 * ============================================
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import {
    SpeechTherapyIcon,
    PlayTherapyIcon,
    CognitiveTherapyIcon,
    SensoryTherapyIcon,
    SocialGroupIcon,
    AssessmentIcon
} from '@/components/icons/ProgramIcons';

// Custom SVG Icons
const Icons = {
    arrowRight: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" />
        </svg>
    ),
};

// Custom SVG icon mapping
const CUSTOM_PROGRAM_ICONS: Record<string, React.FC<{ className?: string }>> = {
    'MessageCircle': SpeechTherapyIcon,
    'Palette': PlayTherapyIcon,
    'Brain': CognitiveTherapyIcon,
    'Activity': SensoryTherapyIcon,
    'Users': SocialGroupIcon,
    'FileSearch': AssessmentIcon,
    // Fallback
    'default': SpeechTherapyIcon
};

export function ProgramsPage() {
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const introText = getSetting('programs_intro_text') || "아이의 고유한 특성을 존중하며,\n단계별 1:1 맞춤형 솔루션을 제공합니다.";

    const programsJson = getSetting('programs_list');
    const dynamicPrograms = programsJson ? JSON.parse(programsJson) : [];
    const programs = dynamicPrograms.length > 0 ? dynamicPrograms : DEFAULT_PROGRAMS;

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-slate-950" : "bg-[#F8FAFC]")}>
            <Helmet>
                <title>치료 프로그램 - 행복아동발달센터</title>
                <meta name="description" content="언어치료, 놀이치료, 감각통합치료 등 전문적인 발달 지원 프로그램을 안내합니다." />
            </Helmet>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 py-24 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-xl"></div>

                <div className="container mx-auto max-w-4xl relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-black tracking-wider uppercase mb-6">
                            Our Programs
                        </span>
                        <h1
                            className="text-4xl md:text-5xl font-black tracking-[-0.05em] mb-6"
                            style={{ wordBreak: 'keep-all' }}
                        >
                            프로그램 안내
                        </h1>
                        <p
                            className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line"
                            style={{ wordBreak: 'keep-all' }}
                        >
                            {introText}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Floating Cards Container */}
            <div className={cn(
                "relative -mt-12 z-20 rounded-t-[50px] px-4 pb-24 transition-colors",
                isDark ? "bg-slate-950" : "bg-[#F8FAFC]"
            )}>
                {/* Background Pattern - reduced opacity in dark mode */}
                <div className={cn(
                    "absolute inset-0 overflow-hidden pointer-events-none",
                    isDark ? "opacity-10" : "opacity-30"
                )}>
                    <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                        <defs>
                            <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#E0E7FF" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                        </defs>
                        <circle cx="350" cy="100" r="120" fill="url(#bgGrad)" />
                        <circle cx="50" cy="300" r="80" fill="url(#bgGrad)" />
                    </svg>
                </div>

                <div className="container mx-auto max-w-6xl pt-20 relative z-10">

                    {/* Programs Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {programs.map((program: any, idx: number) => {
                            const IconComponent = CUSTOM_PROGRAM_ICONS[program.icon_name] || CUSTOM_PROGRAM_ICONS['default'];

                            return (
                                <motion.div
                                    key={program.title}
                                    className={cn(
                                        "rounded-[40px] p-8 border transition-all duration-500 hover:-translate-y-2",
                                        isDark
                                            ? "bg-slate-900 border-slate-800 shadow-lg shadow-black/20 hover:shadow-xl"
                                            : "bg-white border-slate-100 shadow-xl shadow-slate-100 hover:shadow-2xl"
                                    )}
                                    initial={{ opacity: 0, y: 60 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 20,
                                        delay: idx * 0.1
                                    }}
                                >
                                    <div className="mb-6">
                                        <IconComponent className="w-16 h-16" />
                                    </div>
                                    <h3 className={cn(
                                        "text-xl font-black mb-1 tracking-tight",
                                        isDark ? "text-white" : "text-slate-900"
                                    )}>{program.title}</h3>
                                    <p className={cn(
                                        "text-sm font-medium mb-4",
                                        isDark ? "text-slate-500" : "text-slate-400"
                                    )}>{program.eng}</p>
                                    <p
                                        className={cn(
                                            "text-sm font-medium leading-relaxed mb-6",
                                            isDark ? "text-slate-400" : "text-slate-500"
                                        )}
                                        style={{ wordBreak: 'keep-all' }}
                                    >
                                        {program.desc}
                                    </p>
                                    <div className={cn(
                                        "p-5 rounded-2xl border",
                                        isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
                                    )}>
                                        <h4 className={cn(
                                            "font-black text-xs mb-3 uppercase tracking-wider",
                                            isDark ? "text-slate-300" : "text-slate-700"
                                        )}>추천 대상</h4>
                                        <ul className={cn(
                                            "text-xs font-medium space-y-2",
                                            isDark ? "text-slate-400" : "text-slate-500"
                                        )}>
                                            {program.targets.map((target: string, tidx: number) => (
                                                <li key={tidx} className="flex items-start gap-2">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                                        isDark ? "bg-indigo-500" : "bg-indigo-400"
                                                    )}></span>
                                                    <span>{target}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* CTA Section */}
                    <motion.div
                        className="mt-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[50px] p-12 text-center text-white relative overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-xl"></div>
                        <h3
                            className="text-2xl md:text-3xl font-black mb-4 tracking-[-0.03em] relative z-10"
                            style={{ wordBreak: 'keep-all' }}
                        >
                            우리 아이에게 맞는 프로그램이 궁금하신가요?
                        </h3>
                        <p className="text-white/70 font-medium mb-8 relative z-10">무료 초기 상담을 통해 알아보세요.</p>
                        <Link to="/contact">
                            <motion.button
                                className="px-8 py-4 bg-white text-indigo-700 rounded-full font-black text-lg shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-3 mx-auto relative z-10 ring-2 ring-white/20"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                상담 예약하기 {Icons.arrowRight("w-5 h-5")}
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
