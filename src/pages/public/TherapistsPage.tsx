import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { centerPath } from '@/config/domain';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { supabase } from '@/lib/supabase';
import { Shield, Award, ChevronRight, ChevronDown } from 'lucide-react';
import { useLocalSEO } from '@/hooks/useLocalSEO';

// 🔒 [완전 분리] therapist_profiles 테이블 — therapists(직원관리)와 독립
type TherapistProfile = {
    id: string;
    center_id: string;
    display_name: string;
    bio?: string | null;
    career?: string | null;
    specialties?: string | null;
    profile_image?: string | null;
    website_visible: boolean;
    sort_order: number;
    created_at: string;
};

export function TherapistsPage() {
    const navigate = useNavigate();
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading: brandingLoading } = useCenterBranding();
    const isDark = theme === 'dark';

    const [therapists, setTherapists] = useState<TherapistProfile[]>([]);;
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('전체');
    // ✨ [Hook Order Fix] All hooks MUST be called before any early return
    const seo = useLocalSEO();

    useEffect(() => {
        if (center?.id) {
            fetchPublicTherapists();
        }
    }, [center?.id]);

    const fetchPublicTherapists = async () => {
        if (!center?.id) return;
        try {
            // 🔒 [완전 분리] therapist_profiles 테이블에서 조회
            // therapists(직원관리)와 완전 독립 — 배치 마스터에서 관리하는 공개 프로필
            const { data, error } = await (supabase.from)('therapist_profiles')
                .select('*')
                .eq('center_id', center.id)
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
    const introText = getSetting('therapists_intro_text' as any) || "우리 아이의 성장을 함께할,\n분야별 최고의 전문가들을 소개합니다.";

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>{seo.pageTitle('therapists')}</title>
                <meta name="description" content={seo.pageDesc('therapists')} />
                <meta name="keywords" content={seo.pageKeywords('therapists')} />
                <link rel="canonical" href={seo.canonical('/therapists')} />
                <meta property="og:title" content={seo.pageTitle('therapists')} />
                <meta property="og:description" content={seo.pageDesc('therapists')} />
                <meta property="og:url" content={seo.canonical('/therapists')} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content={seo.centerName} />
                <meta property="og:locale" content="ko_KR" />
                {branding?.logo_url && <meta property="og:image" content={branding.logo_url} />}
                <script type="application/ld+json">{JSON.stringify(seo.structuredData('therapists'))}</script>
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

                    {/* 🏷️ Specialty Filter Tabs */}
                    {(() => {
                        // Extract unique specialties from therapists
                        const specialtySet = new Set<string>();
                        therapists.forEach(t => {
                            if (t.specialties) {
                                t.specialties.split(',').forEach(s => {
                                    const trimmed = s.trim();
                                    if (trimmed) specialtySet.add(trimmed);
                                });
                            }
                        });
                        const categories = ['전체', ...Array.from(specialtySet)];

                        // Only show tabs if there are 2+ categories
                        if (categories.length <= 2) return null;

                        return (
                            <div className="flex flex-wrap justify-center gap-3 mb-16">
                                {categories.map(cat => {
                                    const count = cat === '전체'
                                        ? therapists.length
                                        : therapists.filter(t => t.specialties?.includes(cat)).length;
                                    const isActive = activeFilter === cat;

                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveFilter(cat)}
                                            className={cn(
                                                "px-6 py-3 rounded-full font-black text-sm transition-all duration-300 border-2",
                                                isActive
                                                    ? "text-white shadow-lg scale-105"
                                                    : isDark
                                                        ? "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700 shadow-sm"
                                            )}
                                            style={isActive ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
                                        >
                                            {cat}
                                            <span className={cn(
                                                "ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                                                isActive ? "bg-white/20" : isDark ? "bg-slate-700" : "bg-slate-100"
                                            )}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {/* Therapist Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        {therapists.length === 0 ? (
                            <div className="text-center py-20 opacity-30 col-span-full">
                                <Shield className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-xl font-bold">등록된 선생님 정보가 없습니다.</p>
                            </div>
                        ) : (
                            therapists
                                .filter(staff => activeFilter === '전체' || staff.specialties?.includes(activeFilter))
                                .map((staff, idx) => (
                                    <TherapistCard key={staff.id} staff={staff} idx={idx} brandColor={brandColor} isDark={isDark} />
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
                                onClick={() => navigate(centerPath(center?.slug, '/contact'))}
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

// ✨ Bio 미작성 시 자동 표시될 다양한 기본 멘트
const DEFAULT_BIOS = [
    '아이들의 행복한 내일을 위해 진심을 다해 소통하겠습니다.',
    '한 걸음 한 걸음, 아이의 속도에 맞춰 함께 걸어갑니다.',
    '아이 한 명 한 명의 가능성을 믿고, 최선을 다합니다.',
    '따뜻한 눈높이로 아이의 세상을 이해하겠습니다.',
    '작은 변화가 큰 성장이 되는 순간을 함께합니다.',
    '아이의 웃음이 저의 가장 큰 보람입니다.',
    '전문성과 따뜻함으로 아이의 발달을 지원합니다.',
    '부모님과 함께 아이의 내일을 설계합니다.',
];

// --- ✨ [Collapsible] Therapist Profile Card ---
function TherapistCard({ staff, idx, brandColor, isDark }: { staff: TherapistProfile; idx: number; brandColor: string; isDark: boolean }) {
    const [expanded, setExpanded] = useState(false);

    // 경력 데이터를 섹션별로 파싱
    const careerLines = (staff.career || '관련 학과 졸업\n임상 경력 보유').split('\n').filter(line => line.trim());

    // 섹션 분리: "현)", "전)", "자격)" 등의 헤더를 기준으로 그룹핑
    const sections: { header: string | null; items: string[] }[] = [];
    let currentSection: { header: string | null; items: string[] } = { header: null, items: [] };

    careerLines.forEach(line => {
        const trimmed = line.trim();
        const isHeader = trimmed.endsWith(')') && trimmed.length <= 10;
        if (isHeader) {
            if (currentSection.header !== null || currentSection.items.length > 0) {
                sections.push(currentSection);
            }
            currentSection = { header: trimmed, items: [] };
        } else {
            currentSection.items.push(trimmed.replace(/^[-·•]\s*/, ''));
        }
    });
    if (currentSection.header !== null || currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    const PREVIEW_SECTIONS = 1; // 기본 표시 섹션 수
    const hasMore = sections.length > PREVIEW_SECTIONS;
    const visibleSections = expanded ? sections : sections.slice(0, PREVIEW_SECTIONS);

    return (
        <motion.div
            className={cn(
                "group flex flex-col gap-6 p-8 rounded-[50px] border transition-all duration-500 hover:-translate-y-2",
                isDark ? "bg-[#141620] border-white/5 hover:border-white/10" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"
            )}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
        >
            {/* Header */}
            <div className="flex items-start gap-5">
                <div className="w-20 h-24 shrink-0 rounded-[20px] overflow-hidden relative shadow-lg border-2 border-slate-50 dark:border-white/5 bg-slate-100">
                    {staff.profile_image ? (
                        <img src={staff.profile_image} alt={staff.display_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Award className="w-6 h-6 opacity-20" />
                        </div>
                    )}
                </div>
                <div className="flex-1 pt-1">
                    <div className="flex flex-col">
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1">{staff.display_name}</div>
                        <div className="inline-flex">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                                {staff.specialties || '치료사'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-7 flex flex-col">
                <p className={cn("text-xs font-bold leading-relaxed opacity-40 line-clamp-2 px-1 italic border-l-2 pl-4",
                    isDark ? "text-slate-400 border-white/10" : "text-slate-600 border-slate-100")}>
                    "{staff.bio || DEFAULT_BIOS[idx % DEFAULT_BIOS.length]}"
                </p>

                <div className="space-y-4 flex-1 flex flex-col pt-2">
                    {/* Career Sections */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                            Professional Career
                        </div>

                        {visibleSections.map((section, si) => (
                            <div key={si} className="space-y-2">
                                {section.header && (
                                    <div className={cn("pt-3 first:pt-0 pb-1", si > 0 && "border-t border-slate-100 dark:border-white/5")}>
                                        <span className={cn("text-[11px] font-black uppercase tracking-[0.15em]", isDark ? "text-indigo-400" : "text-indigo-600")}>
                                            {section.header}
                                        </span>
                                    </div>
                                )}
                                <ul className="space-y-2">
                                    {section.items.map((item, ii) => (
                                        <li key={ii} className="flex gap-3 text-[13px] font-bold leading-snug pl-1">
                                            <div className="w-1.5 h-1.5 rounded-full mt-[6px] shrink-0 opacity-40" style={{ backgroundColor: brandColor }} />
                                            <span className={cn(isDark ? "text-slate-300" : "text-slate-700")}>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* 더보기/접기 토글 */}
                        {hasMore && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className={cn(
                                    "w-full mt-3 py-2.5 rounded-2xl text-[11px] font-black tracking-wide flex items-center justify-center gap-1.5 transition-all",
                                    isDark
                                        ? "bg-white/5 text-slate-400 hover:bg-white/10"
                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                )}
                            >
                                {expanded ? '접기' : `약력 더보기 (+${sections.length - PREVIEW_SECTIONS})`}
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
                            </button>
                        )}
                    </div>

                    {/* Specialties */}
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
    );
}
