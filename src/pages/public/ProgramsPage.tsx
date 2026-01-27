// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
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

const CUSTOM_PROGRAM_ICONS: Record<string, React.FC<{ className?: string }>> = {
    'MessageCircle': SpeechTherapyIcon,
    'Palette': PlayTherapyIcon,
    'Brain': CognitiveTherapyIcon,
    'Activity': SensoryTherapyIcon,
    'Users': SocialGroupIcon,
    'FileSearch': AssessmentIcon,
    'default': SpeechTherapyIcon
};

export function ProgramsPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding } = useCenterBranding();
    const isDark = theme === 'dark';

    const brandColor = branding?.brand_color || '#6366f1';
    const centerName = branding.name || center?.name || '아동발달센터';
    const introText = branding.settings?.programs_intro_text || getSetting('programs_intro_text') || "아이의 고유한 특성을 존중하며,\n단계별 1:1 맞춤형 솔루션을 제공합니다.";

    const programsJson = branding.settings?.programs_list || getSetting('programs_list');
    const dynamicPrograms = programsJson ? (typeof programsJson === 'string' ? JSON.parse(programsJson) : programsJson) : [];
    const programs = dynamicPrograms.length > 0 ? dynamicPrograms : DEFAULT_PROGRAMS;

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>치료 프로그램 - {centerName}</title>
            </Helmet>

            {/* ✨ Premium Hero Section */}
            <section className="relative py-32 overflow-hidden">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10" style={{ backgroundColor: brandColor }}></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10" style={{ backgroundColor: brandColor }}></div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span
                            className="inline-block px-5 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase mb-8 border"
                            style={{ backgroundColor: brandColor + '15', color: brandColor, borderColor: brandColor + '30' }}
                        >
                            Excellence in Care
                        </span>
                        <h1 className={cn(
                            "text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            프로그램 안내
                        </h1>
                        <p className={cn(
                            "mx-auto max-w-2xl text-xl font-medium leading-relaxed opacity-60 whitespace-pre-line",
                            isDark ? "text-slate-300" : "text-slate-600"
                        )}>
                            {introText}
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-6 pb-40 relative z-10">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {programs.map((program: any, idx: number) => {
                        const IconComponent = CUSTOM_PROGRAM_ICONS[program.icon_name] || CUSTOM_PROGRAM_ICONS['default'];
                        return (
                            <motion.div
                                key={idx}
                                className={cn(
                                    "group relative rounded-[50px] p-10 border transition-all duration-500 hover:-translate-y-3 flex flex-col h-full",
                                    isDark ? "bg-[#141620] border-white/5 hover:border-white/10" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"
                                )}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                {/* Hover background detail */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-white/[0.02] transition-all rounded-[50px]"></div>

                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center mb-10 transition-transform duration-500 group-hover:scale-110 relative shrink-0"
                                    style={{ backgroundColor: brandColor + '10', color: brandColor }}
                                >
                                    <IconComponent className="w-12 h-12" />
                                </div>

                                <h3 className={cn("text-2xl font-black mb-2 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                    {program.title}
                                </h3>
                                <p className="text-xs font-black uppercase tracking-widest opacity-30 mb-6">{program.eng}</p>

                                <p className={cn(
                                    "text-base font-medium leading-relaxed mb-10 opacity-60 flex-1",
                                    isDark ? "text-slate-400" : "text-slate-500"
                                )} style={{ wordBreak: 'keep-all' }}>
                                    {program.desc}
                                </p>

                                <div className={cn(
                                    "p-6 rounded-[32px] border transition-colors mt-auto",
                                    isDark ? "bg-white/5 border-white/5 group-hover:bg-white/10" : "bg-slate-50 border-slate-100"
                                )}>
                                    <h4 className={cn("font-black text-[10px] mb-4 uppercase tracking-[0.2em] opacity-40", isDark ? "text-white" : "text-slate-900")}>추천 대상</h4>
                                    <ul className="space-y-3">
                                        {program.targets.map((target: string, tidx: number) => (
                                            <li key={tidx} className="flex items-center gap-3 text-xs font-bold opacity-70">
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: brandColor }}></div>
                                                <span>{target}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ✨ Final CTA Section */}
                <motion.div
                    className="mt-32 rounded-[60px] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl"
                    style={{ backgroundColor: brandColor }}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <h3 className="text-3xl md:text-5xl font-black mb-8 text-white tracking-tighter leading-tight">
                            우리 아이에게 가장 필요한 치료,<br />
                            전문가와 상담해보세요.
                        </h3>
                        <p className="text-white/70 text-lg font-medium mb-12 max-w-xl">
                            검증된 임상 경험을 가진 전문 치료사진이<br />
                            아이의 발달 상황을 세심하게 체크해드립니다.
                        </p>
                        <Link to={center?.slug ? `/centers/${center.slug}/contact` : '/contact'}>
                            <motion.button
                                className="px-12 py-6 bg-white rounded-full font-black text-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-4"
                                style={{ color: brandColor }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                무료 상담 예약하기 {Icons.arrowRight("w-6 h-6")}
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
