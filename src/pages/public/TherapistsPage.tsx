// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-28
 * 🖋️ Description: "치료사 선생님들의 전문성과 진심을 전합니다."
 */
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { supabase } from '@/lib/supabase';
import { Shield, Award, BookOpen, Heart, Mail, Phone, Link as LinkIcon, ChevronRight } from 'lucide-react';

export function TherapistsPage() {
    const navigate = useNavigate();
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading: brandingLoading } = useCenterBranding();
    const isDark = theme === 'dark';

    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (center?.id) {
            fetchPublicTherapists();
        }
    }, [center?.id]);

    const fetchPublicTherapists = async () => {
        try {
            // Fetch therapists belonging to this center that are marked as website_visible
            // If website_visible field doesn't exist yet, we'll fetch all active therapists as a fallback
            const { data, error } = await supabase
                .from('therapists')
                .select('*')
                .eq('center_id', center.id)
                .eq('system_status', 'active')
                .eq('website_visible', true)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTherapists(data || []);
        } catch (error) {
            console.error('Error fetching therapists:', error);
        } finally {
            setLoading(false);
        }
    };

    if (brandingLoading || loading) return null;

    const brandColor = branding?.brand_color || '#6366f1';
    const centerName = branding.name || center?.name || '아동발달센터';
    const introText = getSetting('therapists_intro_text') || "우리 아이의 성장을 함께할,\n분야별 최고의 전문가들을 소개합니다.";

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>치료사 소개 - {centerName}</title>
            </Helmet>

            {/* ✨ Premium Hero Section */}
            <section className="relative py-24 px-6 overflow-hidden" style={{ backgroundColor: brandColor }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

                <div className="container mx-auto max-w-4xl relative z-10 text-center text-white">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">Our Experts</span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-[-0.05em] mb-6">치료사 소개</h1>
                        <p className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line">
                            {introText}
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className={cn("relative -mt-12 z-20 rounded-t-[50px] px-4 pb-40 transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
                <div className="container mx-auto max-w-6xl pt-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
                        {therapists.length === 0 ? (
                            <div className="text-center py-20 opacity-30 col-span-full">
                                <Shield className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-xl font-bold">등록된 선생님 정보가 없습니다.</p>
                            </div>
                        ) : (
                            therapists.map((staff, idx) => (
                                <motion.div
                                    key={staff.id}
                                    className={cn(
                                        "group flex flex-col gap-8 p-10 rounded-[60px] border transition-all duration-500 hover:-translate-y-2",
                                        isDark ? "bg-[#141620] border-white/5 hover:border-white/10" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"
                                    )}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    {/* 📷 Profile Image Box */}
                                    <div className="relative shrink-0 flex justify-center">
                                        <div className="w-full aspect-[4/5] max-w-[300px] rounded-[40px] overflow-hidden relative shadow-2xl">
                                            {staff.profile_image ? (
                                                <img src={staff.profile_image} alt={staff.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300">
                                                    <Award className="w-16 h-16 opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-30">No Profile Image</span>
                                                </div>
                                            )}
                                            {/* Name Tag Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                                                <div className="text-2xl font-black">{staff.name}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                    {staff.system_role === 'admin' ? '운영 원장' : staff.hire_type === 'fulltime' ? '수석 치료사' : '치료사'}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Abstract background detail */}
                                        <div className="absolute -z-10 -top-4 -right-4 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: brandColor }}></div>
                                    </div>

                                    {/* 📜 Content Box */}
                                    <div className="flex-1 space-y-8 flex flex-col">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                                                <Heart className="w-3 h-3" style={{ color: brandColor }} />
                                                Introduction
                                            </div>
                                            <h3 className={cn("text-2xl font-black mb-4 leading-tight whitespace-pre-line", isDark ? "text-white" : "text-slate-900")}>
                                                {staff.bio || `아이들의 행복한 내일을 위해\n진심을 다해 소통하겠습니다.`}
                                            </h3>
                                            <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: brandColor }}></div>
                                        </div>

                                        <div className="space-y-8 flex-1">
                                            {/* Specialties */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                                                    <Shield className="w-4 h-4" /> 주요 분야
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(staff.specialties || '언어치료, 발달지원').split(',').map((s, i) => (
                                                        <span key={i} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold", isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600")}>
                                                            {s.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Career */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                                                    <Award className="w-4 h-4" /> 주요 약력
                                                </div>
                                                <ul className="space-y-3">
                                                    {(staff.career || '관련 학과 졸업\n임상 경력 보유').split('\n').map((line, i) => (
                                                        <li key={i} className="flex gap-3 text-sm font-medium leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: brandColor }}></div>
                                                            <span className={isDark ? "text-slate-300" : "text-slate-600"}>{line.trim()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* ✨ Bottom Call to Action (Shared Style) */}
                    <motion.div
                        className="mt-32 rounded-[60px] p-16 relative overflow-hidden text-center shadow-2xl shadow-indigo-200/50"
                        style={{ backgroundColor: brandColor }}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <h3 className="text-3xl md:text-5xl font-black mb-8 text-white tracking-tighter leading-tight">
                                어떤 선생님과 상담하고 싶으신가요?
                            </h3>
                            <p className="text-white/70 text-lg font-medium mb-12 max-w-xl">
                                우리 아이의 상황에 맞는 전문 치료사를 추천해드립니다.<br />
                                지금 바로 상담 예약을 신청해보세요.
                            </p>
                            <button
                                className="px-12 py-6 bg-white rounded-full font-black text-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-4"
                                style={{ color: brandColor }}
                                onClick={() => navigate(center?.slug ? `/centers/${center.slug}/contact` : '/contact')}
                            >
                                무료 상담 예약하기 <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
