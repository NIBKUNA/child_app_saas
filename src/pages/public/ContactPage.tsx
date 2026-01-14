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
import { ConsultationSurveyForm } from '@/components/public/ConsultationSurveyForm';
import { useCenterBranding } from '@/hooks/useCenterBranding'; // ✨ Use Centralized Hook
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// ... icons (unchanged) ...
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
    const { branding, loading } = useCenterBranding(); // ✨ Use uniform data source
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <>
            <Helmet>
                <title>문의 및 오시는 길 - {branding?.name || '센터'}</title>
                <meta name="description" content="센터 위치 안내, 운영 시간, 상담 예약 문의 방법을 안내해드립니다." />
            </Helmet>

            <div className={cn(
                "py-12 md:py-20 transition-colors",
                isDark ? "bg-slate-900" : "bg-orange-50/50"
            )}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center pb-[env(safe-area-inset-bottom,24px)]">
                    <h1 className={cn(
                        "text-3xl font-bold tracking-tight sm:text-4xl mb-6",
                        isDark ? "text-white" : "text-slate-900"
                    )}>
                        문의 및 오시는 길
                    </h1>
                    <p className={cn(
                        "mx-auto max-w-2xl text-lg leading-relaxed",
                        isDark ? "text-slate-400" : "text-slate-600"
                    )}>
                        궁금하신 점이 있다면 언제든 편하게 문의해주세요.<br />
                        친절하고 상세하게 안내해 드리겠습니다.
                    </p>
                </div>
            </div>

            <section className={cn(
                "py-16 md:py-24 transition-colors",
                isDark ? "bg-slate-950" : "bg-white"
            )}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ✨ 반응형 수정: xl 이상에서만 그리드 2열, 그 외는 세로 스택 */}
                    <div className="grid gap-8 xl:gap-12 xl:grid-cols-2 xl:items-start">
                        {/* Information Section */}
                        <div className="space-y-6 h-fit xl:sticky xl:top-24">
                            <div className={cn(
                                "p-6 sm:p-8 rounded-[32px] border shadow-lg space-y-6 transition-colors",
                                isDark
                                    ? "bg-slate-900 border-slate-800"
                                    : "bg-white border-slate-100 shadow-slate-200/50"
                            )}>
                                <h2 className={cn(
                                    "text-xl font-black flex items-center gap-2",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>
                                    {Icons.mapPin(cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600"))}
                                    센터 정보
                                </h2>
                                <div className="space-y-4">
                                    <div className={cn(
                                        "flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 rounded-2xl",
                                        isDark ? "bg-slate-800" : "bg-slate-50"
                                    )}>
                                        <div className={cn("shrink-0 font-bold", isDark ? "text-white" : "text-slate-900")}>주소</div>
                                        <div className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-600")}>{branding?.address || '주소 정보가 없습니다.'}</div>
                                    </div>
                                    <div className={cn(
                                        "flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 rounded-2xl",
                                        isDark ? "bg-slate-800" : "bg-slate-50"
                                    )}>
                                        <div className={cn("shrink-0 font-bold", isDark ? "text-white" : "text-slate-900")}>전화</div>
                                        <div className={cn("text-lg font-bold", isDark ? "text-slate-200" : "text-slate-800")}>{branding?.phone || '전화번호가 없습니다.'}</div>
                                    </div>
                                    <div className={cn(
                                        "flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 rounded-2xl",
                                        isDark ? "bg-slate-800" : "bg-slate-50"
                                    )}>
                                        <div className={cn("shrink-0 font-bold", isDark ? "text-white" : "text-slate-900")}>이메일</div>
                                        <div className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-600")}>{branding?.email || '이메일 정보가 없습니다.'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className={cn(
                                "p-6 sm:p-8 rounded-[32px] border shadow-lg space-y-6 transition-colors",
                                isDark
                                    ? "bg-slate-900 border-slate-800"
                                    : "bg-white border-slate-100 shadow-slate-200/50"
                            )}>
                                <h2 className={cn(
                                    "text-xl font-black flex items-center gap-2",
                                    isDark ? "text-white" : "text-slate-900"
                                )}>
                                    {Icons.clock(cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600"))}
                                    운영 시간
                                </h2>
                                <div className="space-y-4">
                                    <div className={cn(
                                        "flex justify-between border-b pb-3",
                                        isDark ? "border-slate-700" : "border-slate-100"
                                    )}>
                                        <span className={cn("font-bold", isDark ? "text-slate-400" : "text-slate-600")}>평일 (월-금)</span>
                                        {/* ✨ [Fix] Use dynamic data, no hardcoding */}
                                        <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>{branding?.weekday_hours || '정보 없음'}</span>
                                    </div>
                                    <div className={cn(
                                        "flex justify-between border-b pb-3",
                                        isDark ? "border-slate-700" : "border-slate-100"
                                    )}>
                                        <span className={cn("font-bold", isDark ? "text-slate-400" : "text-slate-600")}>토요일</span>
                                        {/* ✨ [Fix] Use dynamic data, no hardcoding */}
                                        <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>{branding?.saturday_hours || '정보 없음'}</span>
                                    </div>
                                    <div className="flex justify-between text-rose-500 font-black">
                                        <span>일요일/공휴일</span>
                                        <span>{branding?.holiday_text || '휴무'}</span>
                                    </div>
                                </div>
                                <p className={cn(
                                    "text-xs p-4 rounded-xl leading-relaxed font-medium",
                                    isDark ? "bg-amber-900/30 text-amber-300" : "bg-orange-50 text-slate-500"
                                )}>
                                    * 모든 상담 및 치료는 100% 예약제로 운영됩니다.<br />
                                    * 방문 전 반드시 예약 부탁드립니다.
                                </p>
                            </div>
                        </div>

                        {/* Inquiry Form Section */}
                        <div className={cn(
                            "p-6 sm:p-8 lg:p-10 rounded-[40px] border shadow-xl transition-colors",
                            isDark
                                ? "bg-slate-900 border-slate-800"
                                : "bg-white border-slate-200 shadow-indigo-600/5"
                        )}>
                            <h2 className={cn(
                                "text-2xl font-black mb-8 flex items-center gap-3",
                                isDark ? "text-white" : "text-slate-900"
                            )}>
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    isDark ? "bg-indigo-900 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                                )}>
                                    {Icons.calendar("w-6 h-6")}
                                </div>
                                상담 예약 신청
                            </h2>
                            <ConsultationSurveyForm />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}