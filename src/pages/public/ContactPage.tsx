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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ConsultationSurveyForm } from '@/components/public/ConsultationSurveyForm';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useAdminSettings } from '@/hooks/useAdminSettings';

// Custom SVG Icons
const Icons = {
    mapPin: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" />
            <circle cx="12" cy="10" r="3" stroke="currentColor" />
        </svg>
    ),
    clock: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <path d="M12 6v6l4 2" stroke="currentColor" />
        </svg>
    ),
    calendar: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" />
        </svg>
    ),
};

export function ContactPage() {
    const { branding, loading } = useCenterBranding();
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (loading) return null;

    const weekdayHours = getSetting('center_weekday_hours') || branding?.weekday_hours || '09:00 - 19:00';
    const saturdayHours = getSetting('center_saturday_hours') || branding?.saturday_hours || '09:00 - 16:00';
    const holidayText = getSetting('center_holiday_text') || branding?.holiday_text || '매주 일요일 및 공휴일';
    const brandColor = branding?.brand_color || '#6366f1';

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>문의 및 오시는 길 - {branding?.name || '센터'}</title>
                <meta name="description" content="센터 위치 안내, 운영 시간, 상담 예약 문의 방법을 안내해드립니다." />
            </Helmet>

            {/* ✨ Premium Hero Section (Uniform Branding) */}
            <section className="relative py-24 px-6 overflow-hidden" style={{ backgroundColor: brandColor }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

                <div className="container mx-auto max-w-4xl relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">Get In Touch</span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-[-0.05em] mb-6">문의 및 오시는 길</h1>
                        <p className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line leading-relaxed">
                            아이의 밝은 내일을 위한 첫 걸음,<br />
                            자라다가 가장 따뜻한 목소리로 답하겠습니다.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className={cn("relative -mt-12 z-20 rounded-t-[50px] px-4 pt-24 transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
                <section className="container mx-auto px-6 pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* 1. Left Contact & Map Column */}
                        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                            {/* Contact Info Card */}
                            <motion.div
                                className={cn(
                                    "p-10 rounded-[50px] border shadow-2xl",
                                    isDark ? "bg-[#141620] border-white/5" : "bg-white border-slate-100"
                                )}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="space-y-10">
                                    <h3 className={cn("text-2xl font-black mb-10 flex items-center gap-4", isDark ? "text-white" : "text-slate-900")}>
                                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
                                            {Icons.mapPin("w-6 h-6")}
                                        </div>
                                        센터 정보
                                    </h3>

                                    <div className="space-y-8">
                                        <div className="group">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400">주소</p>
                                            <p className={cn("text-lg font-bold leading-relaxed", isDark ? "text-slate-300" : "text-slate-700")}>
                                                {branding?.address || '서울특별시 송파구 위례로...'}
                                            </p>
                                        </div>

                                        <div className="group">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400">전화</p>
                                            <p className="text-3xl font-black tracking-tight" style={{ color: brandColor }}>
                                                {branding?.phone || '02-000-0000'}
                                            </p>
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 dark:border-white/5 space-y-6">
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-amber-500 transition-colors">
                                                    {Icons.clock("w-5 h-5")}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">평일</p>
                                                    <p className={cn("text-sm font-black", isDark ? "text-slate-200" : "text-slate-600")}>{weekdayHours}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                    {Icons.calendar("w-5 h-5")}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">토요일</p>
                                                    <p className={cn("text-sm font-black", isDark ? "text-slate-200" : "text-slate-600")}>{saturdayHours}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* 📝 Request Form Column (Right) */}
                        <motion.div
                            className="lg:col-span-7"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className={cn(
                                "p-10 md:p-14 rounded-[60px] border shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative overflow-hidden",
                                isDark ? "bg-[#141620] border-white/5" : "bg-white border-slate-200"
                            )}>
                                {/* Decorative background gradient for form */}
                                <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: brandColor }}></div>

                                <div className="relative z-10">
                                    <h2 className={cn("text-3xl font-black mb-10 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                        상담 예약 신청
                                    </h2>
                                    <p className="mb-12 text-sm font-bold opacity-50 leading-relaxed">
                                        아래 양식을 작성해 주시면 확인 후 전문 치료사가 직접 연락드려<br />
                                        아이에게 가장 필요한 상담 일정을 잡아드리겠습니다.
                                    </p>

                                    <ConsultationSurveyForm centerId={branding?.id} />
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </section>
            </div>
        </div>
    );
}