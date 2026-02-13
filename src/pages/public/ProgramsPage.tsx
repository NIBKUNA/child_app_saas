import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { useLocalSEO } from '@/hooks/useLocalSEO';
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

interface Program {
    title: string;
    description?: string;
    desc?: string; // legacy support
    targets?: string[];
    eng?: string;
    icon_name?: string;
}

export function ProgramsPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading } = useCenterBranding(); // ✨ Added loading
    const seo = useLocalSEO();
    const isDark = theme === 'dark';

    // ✨ [Anti-Flicker] Prevent showing hardcoded defaults before branding/settings are ready
    if (loading) return null;

    const brandColor = branding?.brand_color || '#6366f1';
    const centerName = branding?.name || center?.name || '아동발달센터';
    const introText = branding?.settings?.programs_intro_text || getSetting('programs_intro_text' as any) || "아이의 고유한 특성을 존중하며,\n단계별 1:1 맞춤형 솔루션을 제공합니다.";

    const programsJson = branding?.settings?.programs_list || getSetting('programs_list' as any);
    const dynamicPrograms = programsJson ? (typeof programsJson === 'string' ? JSON.parse(programsJson) : programsJson) : [];
    const programs: Program[] = dynamicPrograms.length > 0 ? dynamicPrograms : (DEFAULT_PROGRAMS as any as Program[]);

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>
            <Helmet>
                <title>{seo.pageTitle('programs')}</title>
                <meta name="description" content={seo.pageDesc('programs')} />
                <meta name="keywords" content={seo.pageKeywords('programs')} />
                <link rel="canonical" href={seo.canonical('/programs')} />
                <meta property="og:title" content={seo.pageTitle('programs')} />
                <meta property="og:description" content={seo.pageDesc('programs')} />
                <meta property="og:url" content={seo.canonical('/programs')} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content={seo.centerName} />
                <meta property="og:locale" content="ko_KR" />
                {branding?.logo_url && <meta property="og:image" content={branding.logo_url} />}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "MedicalBusiness",
                        "name": centerName,
                        "description": introText,
                        "url": window.location.href,
                        "hasOfferCatalog": {
                            "@type": "OfferCatalog",
                            "name": "발달 치료 프로그램",
                            "itemListElement": programs.flatMap((program: any) => {
                                // ✨ SEO Magic: Multi-Region Targeting
                                // Take top 3 keywords as 'Regions' to create multiple service offers
                                const seoKeywords = branding.settings?.seo_keywords || getSetting('seo_keywords') || '';
                                const regions = seoKeywords.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 3);

                                // If no keywords, return just the original program
                                if (regions.length === 0) {
                                    return [{
                                        "@type": "Offer",
                                        "itemOffered": {
                                            "@type": "Service",
                                            "name": program.title,
                                            "description": program.desc || program.description,
                                            "audience": {
                                                "@type": "PeopleAudience",
                                                "audienceType": (program.targets || []).join(', ')
                                            }
                                        }
                                    }];
                                }

                                // Create an offer for each region
                                return regions.map((region: string) => ({
                                    "@type": "Offer",
                                    "itemOffered": {
                                        "@type": "Service",
                                        "name": `${region} ${program.title}`, // e.g. "송파 언어치료", "위례 언어치료"
                                        "description": program.desc || program.description,
                                        "audience": {
                                            "@type": "PeopleAudience",
                                            "audienceType": (program.targets || []).join(', ')
                                        }
                                    }
                                }));
                            })
                        }
                    })}
                </script>
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
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">Excellence in Care</span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-[-0.05em] mb-6">프로그램 안내</h1>
                        <p className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line leading-relaxed">
                            {introText}
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className={cn("relative -mt-12 z-20 rounded-t-[50px] px-4 transition-colors", isDark ? "bg-[#0a0c10]" : "bg-[#f8fafc]")}>

                <div className="container mx-auto px-6 pb-40 relative z-10">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pt-24">
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

                                    <div className="flex-1 flex flex-col">
                                        <h3 className={cn("text-2xl font-black mb-1", isDark ? "text-white" : "text-slate-900")}>
                                            {program.title}
                                        </h3>
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-30", isDark ? "text-white" : "text-slate-500")}>
                                            {program.eng}
                                        </p>
                                        <p className={cn("text-base font-medium leading-relaxed mb-10 opacity-60", isDark ? "text-slate-400" : "text-slate-600")} style={{ wordBreak: 'keep-all' }}>
                                            {program.desc || program.description}
                                        </p>

                                        {(program.targets || []).length > 0 && (
                                            <div className={cn("p-8 rounded-[32px] border transition-colors mt-auto", isDark ? "bg-white/5 border-white/5 group-hover:bg-white/10" : "bg-slate-50 border-slate-100")}>
                                                <h4 className={cn("font-black text-[10px] mb-5 uppercase tracking-[0.2em] opacity-40", isDark ? "text-white" : "text-slate-900")}>추천 대상</h4>
                                                <ul className="space-y-3.5">
                                                    {(program.targets || []).map((target: string, tidx: number) => (
                                                        <li key={tidx} className="flex items-start gap-3 text-xs font-bold opacity-70 leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: brandColor }}></div>
                                                            <span className={isDark ? "text-slate-300" : "text-slate-600"}>{target}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ✨ Bottom Call to Action */}
                    <motion.div
                        className="mt-16 md:mt-32 rounded-[32px] md:rounded-[60px] p-8 md:p-16 relative overflow-hidden text-center shadow-2xl shadow-indigo-200/50"
                        style={{ backgroundColor: brandColor }}
                        initial={{ opacity: 0, y: 40 }}
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
                                    className="px-8 md:px-12 py-4 md:py-6 bg-white rounded-full font-black text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 md:gap-4"
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
        </div >
    );
}
