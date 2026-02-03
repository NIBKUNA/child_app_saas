import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';

// Custom SVG Icons
const Icons = {
    award: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" stroke="currentColor" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" />
        </svg>
    ),
    heart: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" />
        </svg>
    ),
    users: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="4" stroke="currentColor" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" />
            <circle cx="17" cy="11" r="3" stroke="currentColor" />
            <path d="M21 21v-1.5a3 3 0 00-3-3h-.5" stroke="currentColor" />
        </svg>
    ),
    clock: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <path d="M12 6v6l4 2" stroke="currentColor" />
        </svg>
    ),
    arrowRight: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" />
        </svg>
    ),
};

export function AboutPage() {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const { branding, loading } = useCenterBranding();
    const isDark = theme === 'dark';

    // ✨ [Anti-Flicker] Prevent showing hardcoded defaults before branding/settings are ready
    if (loading) return null;

    const centerName = branding?.name || center?.name || '아동발달센터';

    const introText = branding?.settings?.about_intro_text || getSetting('about_intro_text') || `아이는 믿는 만큼 자라고, 사랑받는 만큼 행복해집니다.\n${centerName}는 아이들의 건강한 성장을 위해 진심을 다합니다.`;
    const mainImage = branding?.settings?.about_main_image || getSetting('about_main_image');
    const descTitle = branding?.settings?.about_desc_title || getSetting('about_desc_title') || "따뜻한 시선으로\n아이의 잠재력을 발굴합니다";
    const descBody = branding?.settings?.about_desc_body || getSetting('about_desc_body') || `${centerName}는 각 분야별 석/박사 출신의 전문 치료진들이 협력하여 아동 개개인에게 최적화된 맞춤 치료 프로그램을 제공합니다.\n\n단순히 증상을 개선하는 것을 넘어, 아이가 스스로 긍정적인 자아를 형성하고 세상과 소통하며 행복하게 살아갈 수 있도록 돕는 것이 우리의 목표입니다.`;

    const galleryRaw = branding?.settings?.about_gallery || getSetting('about_gallery' as any);
    const galleryImages = typeof galleryRaw === 'string' ? galleryRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];


    const values = [
        { icon: Icons.award, title: "검증된 전문성", desc: "석/박사급 치료진의 체계적 접근", color: isDark ? "bg-slate-800" : "bg-white", brandColor: true },
        { icon: Icons.heart, title: "진정성 있는 치료", desc: "아이 중심의 따뜻한 케어", color: isDark ? "bg-rose-900/50 text-rose-400" : "bg-rose-50 text-rose-600" },
        { icon: Icons.users, title: "체계적인 협진", desc: "다학제적 협력 시스템", color: isDark ? "bg-emerald-900/50 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
        { icon: Icons.clock, title: "충분한 상담", desc: "부모님과의 깊은 소통", color: isDark ? "bg-amber-900/50 text-amber-400" : "bg-amber-50 text-amber-600" },
    ];

    return (
        <div className={cn("min-h-screen transition-colors", isDark ? "bg-slate-950" : "bg-[#F8FAFC]")}>
            <Helmet>
                <title>센터 소개 - {centerName}</title>
                <meta name="description" content={introText.slice(0, 160)} />
            </Helmet>

            <section className="relative py-24 px-6 overflow-hidden" style={{ backgroundColor: branding?.brand_color || undefined }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

                <div className="container mx-auto max-w-4xl relative z-10 text-center text-white">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">About Us</span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-[-0.05em] mb-6">센터 소개</h1>
                        <p className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line">{introText}</p>
                    </motion.div>
                </div>
            </section>

            <div className={cn("relative -mt-12 z-20 rounded-t-[50px] px-4 pb-24 transition-colors", isDark ? "bg-slate-950" : "bg-[#F8FAFC]")}>
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16">
                        {values.map((item, idx) => (
                            <motion.div key={idx} className={cn("rounded-[28px] p-6 text-center border", isDark ? "bg-slate-900 border-slate-800 shadow-lg" : "bg-white border-slate-100 shadow-lg shadow-slate-100")} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto", item.color)} style={item.brandColor ? { backgroundColor: (branding?.brand_color || '#000') + '10', color: branding?.brand_color || undefined } : undefined}>
                                    {item.icon("w-7 h-7")}
                                </div>
                                <h3 className={cn("font-black text-sm mb-1", isDark ? "text-white" : "text-slate-800")}>{item.title}</h3>
                                <p className={cn("text-xs font-medium text-slate-400")}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div className={cn("mt-16 rounded-[50px] overflow-hidden border", isDark ? "bg-slate-900 border-slate-800 shadow-2xl shadow-black/30" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50")} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="relative h-[350px] lg:h-auto">
                                {mainImage ? <img src={mainImage} alt="Center" className="absolute inset-0 w-full h-full object-cover" /> : <div className={cn("absolute inset-0 flex items-center justify-center", isDark ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-400")}>센터 이미지</div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r"></div>
                            </div>
                            <div className="p-10 md:p-16 flex flex-col justify-center space-y-6">
                                <h2 className={cn("text-3xl font-black tracking-[-0.05em] leading-tight whitespace-pre-line", isDark ? "text-white" : "text-slate-900")}>{descTitle}</h2>
                                <p className={cn("font-medium leading-relaxed whitespace-pre-line", isDark ? "text-slate-400" : "text-slate-500")}>{descBody}</p>
                                <Link to={getSetting('about_cta_link') || (center?.slug ? `/centers/${center.slug}/contact` : '/contact')} className="inline-flex items-center gap-2 font-bold text-sm hover:underline mt-4" style={{ color: branding?.brand_color || undefined }}>
                                    {getSetting('about_cta_text') || '상담 예약하기'} {Icons.arrowRight("w-4 h-4")}
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* ✨ Premium Center Gallery Section */}
                    {galleryImages.length > 0 && (
                        <div className="mt-32 space-y-12">
                            <div className="text-center space-y-4">
                                <h2 className={cn("text-3xl md:text-4xl font-black", isDark ? "text-white" : "text-slate-900")}>센터 둘러보기</h2>
                                <p className={cn("text-base font-medium opacity-60", isDark ? "text-slate-400" : "text-slate-600")}>우리 아이들이 꿈을 키워나가는 따뜻한 공간입니다.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {galleryImages.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        className={cn(
                                            "relative aspect-[4/3] rounded-[32px] overflow-hidden group border",
                                            isDark ? "border-white/5 shadow-2xl" : "border-slate-100 shadow-xl shadow-slate-200/50"
                                        )}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <img
                                            src={img}
                                            alt={`Center Gallery ${idx + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
