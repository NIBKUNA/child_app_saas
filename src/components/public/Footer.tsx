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
 * 🎨 ZARADA MASTER TEMPLATE - Footer
 * Premium Design with Dynamic SNS Icons
 * ============================================
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useCenterBranding } from '@/hooks/useCenterBranding';

// ... (Icons codes remain same, omitted for brevity if possible, or I must include them if inside file)
// Since replace_file_content replaces a block, I should just replace the component body or the imports + component start.

// Let's replace imports and the component start.

// Premium SNS Icons with hover effects
function SnsIcon({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
    if (!href) return null;
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group relative p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-100 
                       hover:bg-indigo-50 hover:border-indigo-200 hover:scale-110 
                       transition-all duration-300 ease-out shadow-sm hover:shadow-md"
        >
            <div className="text-slate-400 group-hover:text-indigo-600 transition-colors duration-300">
                {children}
            </div>
        </a>
    );
}

// ... Icon components assumed to be stable ... 

export function Footer() {
    const { branding } = useCenterBranding();
    const { settings } = branding;

    const displayCenterName = branding.name;
    const hasSnsLinks = settings.sns_instagram || settings.sns_facebook || settings.sns_youtube || settings.sns_blog;

    return (
        <footer className="bg-gradient-to-b from-slate-50 to-slate-100/50 border-t border-slate-100">
            <div className="container mx-auto px-6 md:px-8 py-16 md:py-20">

                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

                    {/* Brand Column */}
                    <div className="md:col-span-4 space-y-6">
                        <Link to="/" className="inline-flex items-center gap-3 group">
                            {branding.logo_url ? (
                                <img src={branding.logo_url} alt={branding.name} className="h-10 w-auto" />
                            ) : (
                                <span
                                    className="text-3xl font-black tracking-tighter text-slate-800 group-hover:text-indigo-600 transition-colors"
                                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                                >
                                    <span className="text-indigo-600">{branding.name.charAt(0)}</span>{branding.name.slice(1)}
                                </span>
                            )}
                        </Link>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                            아이들의 <span className="text-slate-700 font-medium">무한한 가능성</span>을 <span className="text-slate-700 font-medium">데이터</span>로 증명하는<br />
                            아동 발달 솔루션 플랫폼, <span className="text-indigo-600 font-semibold">{branding.name}</span>입니다.
                        </p>

                        {/* SNS Icons */}
                        {hasSnsLinks && (
                            <div className="flex gap-3 pt-2">
                                <SnsIcon href={settings.sns_instagram} label="Instagram">
                                    <InstagramIcon />
                                </SnsIcon>
                                <SnsIcon href={settings.sns_facebook} label="Facebook">
                                    <FacebookIcon />
                                </SnsIcon>
                                <SnsIcon href={settings.sns_youtube} label="YouTube">
                                    <YouTubeIcon />
                                </SnsIcon>
                                <SnsIcon href={settings.sns_blog} label="Blog">
                                    <BlogIcon />
                                </SnsIcon>
                            </div>
                        )}
                    </div>

                    {/* Center Info */}
                    <div className="md:col-span-4 space-y-5">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            센터 정보
                        </h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3 text-slate-600">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                <span className="leading-relaxed">{branding.address || '주소를 등록해주세요.'}</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <Phone size={16} className="shrink-0 text-slate-400" />
                                <span className="font-semibold">{branding.phone || '00-0000-0000'}</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <Mail size={16} className="shrink-0 text-slate-400" />
                                <span>{branding.email || 'contact@center.com'}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Operating Hours */}
                    <div className="md:col-span-4 space-y-5">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            운영 시간
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between text-slate-600 py-2 border-b border-slate-100">
                                <span className="font-medium">평일</span>
                                <span className="font-semibold text-slate-800">{branding.weekday_hours || '09:00 - 19:00'}</span>
                            </li>
                            <li className="flex justify-between text-slate-600 py-2 border-b border-slate-100">
                                <span className="font-medium">토요일</span>
                                <span className="font-semibold text-slate-800">{branding.saturday_hours || '09:00 - 16:00'}</span>
                            </li>
                            <li className="flex justify-between text-rose-500 py-2 font-semibold">
                                <span>휴무</span>
                                <span>{branding.holiday_text || '일요일/공휴일'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} {displayCenterName}. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-300 font-medium">
                        Powered by <span className="font-bold text-slate-400">Zarada</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Helper icons components required for compilation
function InstagramIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}
function FacebookIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}
function YouTubeIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
    );
}
function BlogIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    );
}