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
import { Shield, Award, ChevronRight } from 'lucide-react';
import type { Database } from '@/types/database.types';

type Therapist = Database['public']['Tables']['therapists']['Row'] & { profile_image?: string; system_role?: string; hire_type?: string; specialties?: string; career?: string; };

export function TherapistsPage() {
    const navigate = useNavigate();
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading: brandingLoading } = useCenterBranding();
    const isDark = theme === 'dark';

    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (center?.id) {
            fetchPublicTherapists();
        }
    }, [center?.id]);

    const fetchPublicTherapists = async () => {
        try {
            // 🌐 사이트 전시용 프로필만 조회: website_visible=true & 활성 상태만 표시
            // 치료사 배치 마스터에서 관리하는 사이트 공개 프로필 정보를 가져옴
            const { data, error } = await supabase
                .from('therapists')
                .select('*')
                .eq('center_id', center!.id)
                .eq('is_active', true)
                .eq('website_visible', true)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTherapists((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching therapists:', error);
        } finally {
            setLoading(false);
        }
    };

    if (brandingLoading || loading) return null;

    const brandColor = branding?.brand_color || '#6366f1';
    const centerName = branding?.name || center?.name || '아동발달센터';
    const introText = getSetting('therapists_intro_text' as any) || "우리 아이의 성장을 함께할,\n분야별 최고의 전문가들을 소개합니다.";

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>치료사 소개 - {centerName}</title>
                <meta name="description" content={`${centerName}의 전문 치료진을 소개합니다. ${therapists.map(t => t.name).slice(0, 3).join(', ')} 선생님 등 분야별 최고의 전문가들이 우리 아이와 함께합니다.`} />
                <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
                <meta property="og:title" content={`치료사 소개 - ${centerName}`} />
                <meta property="og:description" content={`${centerName}의 전문 치료진을 소개합니다. 분야별 최고의 전문가들이 함께합니다.`} />
                <meta property="og:url" content={`${window.location.origin}${window.location.pathname}`} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content={centerName} />
                <meta property="og:locale" content="ko_KR" />
                {branding?.logo_url && <meta property="og:image" content={branding.logo_url} />}
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
                <div className="container mx-auto max-w-7xl pt-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
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
                                        "group flex flex-col gap-6 p-8 rounded-[50px] border transition-all duration-500 hover:-translate-y-2",
                                        isDark ? "bg-[#141620] border-white/5 hover:border-white/10" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"
                                    )}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    {/* 🎨 New Text-Focused Header */}
                                    <div className="flex items-start gap-5">
                                        {/* Extremely Shrunk Profile Image */}
                                        <div className="w-20 h-24 shrink-0 rounded-[20px] overflow-hidden relative shadow-lg border-2 border-slate-50 dark:border-white/5 bg-slate-100">
                                            {staff.profile_image ? (
                                                <img src={staff.profile_image} alt={staff.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Award className="w-6 h-6 opacity-20" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 pt-1">
                                            <div className="flex flex-col">
                                                <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">{staff.name}</div>
                                                <div className="inline-flex">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                                                        {staff.system_role === 'admin' ? '운영 원장' : staff.hire_type === 'fulltime' ? '수석 치료사' : '치료사'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📜 Content Box (Expanded Career Area) */}
                                    <div className="flex-1 space-y-7 flex flex-col">
                                        {/* Bio - Subdued */}
                                        <p className={cn("text-xs font-bold leading-relaxed opacity-40 line-clamp-2 px-1 italic border-l-2 pl-4",
                                            isDark ? "text-slate-400 border-white/10" : "text-slate-600 border-slate-100")}>
                                            "{staff.bio || `아이들의 행복한 내일을 위해 진심을 다해 소통하겠습니다.`}"
                                        </p>

                                        <div className="space-y-7 flex-1 flex flex-col pt-2">
                                            {/* Career - The Real Hero */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                    Professional Career
                                                </div>
                                                <ul className="space-y-3.5">
                                                    {(staff.career || '관련 학과 졸업\n임상 경력 보유').split('\n').filter(line => line.trim()).slice(0, 6).map((line, i) => (
                                                        <li key={i} className="flex gap-3 text-[14px] font-black leading-snug group/line">
                                                            <div className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ backgroundColor: brandColor }}></div>
                                                            <span className={cn(isDark ? "text-slate-200" : "text-slate-800")}>{line.trim()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Specialties - Modern Chips */}
                                            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5">
                                                <div className="flex flex-wrap gap-2">
                                                    {(staff.specialties || '언어치료, 발달지원').split(',').map((s, i) => (
                                                        <span key={i} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight",
                                                            isDark ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500")}>
                                                            {s.trim()}
                                                        </span>
                                                    ))}
                                                </div>
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
