import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, MapPin, Phone, Clock, Search, ChevronRight } from 'lucide-react';
import { PLATFORM_URL } from '@/config/domain';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Center {
    id: string;
    name: string;
    slug: string | null;
    address: string | null;
    phone: string | null;
    logo_url: string | null;
    weekday_hours: string | null;
    saturday_hours: string | null;
}

const CARD_COLORS = [
    { bg: 'from-violet-500/10 to-purple-500/5', accent: '#7C3AED', border: 'border-violet-200/60', badge: 'bg-violet-100 text-violet-700', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
    { bg: 'from-emerald-500/10 to-teal-500/5', accent: '#059669', border: 'border-emerald-200/60', badge: 'bg-emerald-100 text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    { bg: 'from-amber-500/10 to-orange-500/5', accent: '#D97706', border: 'border-amber-200/60', badge: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    { bg: 'from-rose-500/10 to-pink-500/5', accent: '#E11D48', border: 'border-rose-200/60', badge: 'bg-rose-100 text-rose-700', iconBg: 'bg-rose-100', iconText: 'text-rose-600' },
    { bg: 'from-sky-500/10 to-blue-500/5', accent: '#0284C7', border: 'border-sky-200/60', badge: 'bg-sky-100 text-sky-700', iconBg: 'bg-sky-100', iconText: 'text-sky-600' },
    { bg: 'from-fuchsia-500/10 to-purple-500/5', accent: '#C026D3', border: 'border-fuchsia-200/60', badge: 'bg-fuchsia-100 text-fuchsia-700', iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600' },
];

function extractRegion(address: string | null): string {
    if (!address) return '기타';
    const parts = address.split(' ');
    if (parts.length >= 2) {
        const sido = parts[0].replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
        return `${sido} ${parts[1]}`;
    }
    return parts[0] || '기타';
}

function extractSido(address: string | null): string {
    if (!address) return '기타';
    const part = address.split(' ')[0];
    return part.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '') || '기타';
}

export function CenterDirectory() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [activeRegion, setActiveRegion] = useState('전체');

    useEffect(() => {
        async function fetchCenters() {
            try {
                const { data, error } = await supabase
                    .from('centers')
                    .select('id, name, slug, address, phone, logo_url, weekday_hours, saturday_hours')
                    .eq('is_active', true)
                    .order('name');
                if (error) throw error;
                setCenters(data || []);
            } catch (err) {
                console.error('Failed to load centers', err);
            } finally {
                setLoading(false);
            }
        }
        fetchCenters();
    }, []);

    const regions = useMemo(() => {
        const sidoSet = new Set<string>();
        centers.forEach(c => sidoSet.add(extractSido(c.address)));
        return ['전체', ...Array.from(sidoSet).sort()];
    }, [centers]);

    const filteredCenters = useMemo(() => {
        let result = centers;
        if (activeRegion !== '전체') result = result.filter(c => extractSido(c.address) === activeRegion);
        if (keyword.trim()) {
            const lw = keyword.toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(lw) || (c.address && c.address.toLowerCase().includes(lw)));
        }
        return result;
    }, [keyword, activeRegion, centers]);

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
    const cardVariants = { hidden: { opacity: 0, y: 24, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } } };

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4 md:px-8">
            <Helmet>
                <title>전국 아동발달센터 찾기 - 자라다(Zarada) | 언어치료・감각통합・발달검사</title>
                <meta name="description" content="전국의 자라다 아동발달센터 지점 정보를 확인하세요. 언어치료, 감각통합, 놀이치료, 미술치료, 발달검사 전문 센터를 지역별로 찾아보세요." />
                <meta name="keywords" content="아동발달센터 찾기, 언어치료센터, 감각통합치료, 놀이치료, 발달센터 위치, 발달검사, 언어검사, 아동발달센터 개원, 자라다" />
                <link rel="canonical" href={`${PLATFORM_URL}/centers`} />
                <meta property="og:title" content="전국 아동발달센터 찾기 - 자라다(Zarada)" />
                <meta property="og:description" content="전국의 자라다 아동발달센터 지점 정보를 확인하세요." />
                <meta property="og:url" content={`${PLATFORM_URL}/centers`} />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="ko_KR" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": "전국 아동발달센터 목록 — 언어치료·감각통합 전문",
                        "description": "전국의 자라다 아동발달센터 지점 안내",
                        "numberOfItems": centers.length,
                        "itemListElement": centers.map((c, i) => ({
                            "@type": "ListItem",
                            "position": i + 1,
                            "item": {
                                "@type": "MedicalClinic",
                                "name": c.name,
                                "address": c.address || '',
                                "telephone": c.phone || '',
                                "url": `${PLATFORM_URL}/centers/${c.slug || c.id}`,
                                "medicalSpecialty": "아동발달, 언어치료, 감각통합치료"
                            }
                        }))
                    })}
                </script>
            </Helmet>

            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-3">우리 동네 센터 찾기</h1>
                    <p className="text-slate-500 text-base font-medium">전국 <span className="text-indigo-600 font-bold">{centers.length}</span>개의 아동발달센터가 아이들과 함께하고 있습니다.</p>
                </div>

                <div className="mb-8 space-y-4">
                    <div className="max-w-xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-800 font-bold text-base placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                placeholder="센터 이름 또는 지역을 검색하세요"
                            />
                        </div>
                    </div>
                    {regions.length > 2 && (
                        <div className="flex justify-center gap-2 flex-wrap">
                            {regions.map(region => (
                                <button
                                    key={region}
                                    onClick={() => { setActiveRegion(region); setKeyword(''); }}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300",
                                        activeRegion === region
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                            : "bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"
                                    )}
                                >{region}</button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>
                ) : filteredCenters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center"><Search className="w-7 h-7 text-indigo-300" /></div>
                        <p className="text-slate-400 font-bold text-base">{keyword ? `'${keyword}'와 일치하는 센터가 없습니다.` : '해당 지역에 등록된 센터가 없습니다.'}</p>
                        <button onClick={() => { setActiveRegion('전체'); setKeyword(''); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">전체 센터 보기 →</button>
                    </div>
                ) : (
                    <motion.div key={`${activeRegion}-${keyword}`} variants={containerVariants} initial="hidden" animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
                    >
                        {filteredCenters.map((center, idx) => {
                            const region = extractRegion(center.address);
                            const initial = center.name.charAt(0);
                            const palette = CARD_COLORS[idx % CARD_COLORS.length];
                            return (
                                <motion.div key={center.id} variants={cardVariants}>
                                    <Link
                                        to={`/centers/${center.slug || center.id}`}
                                        className={cn(
                                            "group block rounded-2xl p-5 md:p-6 border-2 transition-all duration-300 relative overflow-hidden",
                                            "bg-gradient-to-br hover:shadow-xl hover:-translate-y-1",
                                            palette.bg, palette.border, "hover:border-indigo-300"
                                        )}
                                    >
                                        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" style={{ background: palette.accent }} />
                                        <div className="flex items-start gap-3 mb-3 relative z-10">
                                            <div className={cn("w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", palette.iconBg)}>
                                                {center.logo_url ? (
                                                    <img src={center.logo_url} alt={center.name} className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    <span className={cn("font-black text-lg", palette.iconText)}>{initial}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-black text-slate-800 group-hover:text-indigo-700 transition-colors leading-snug truncate">{center.name}</h3>
                                                <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1", palette.badge)}>{region}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 relative z-10 mb-4">
                                            <div className="flex items-start gap-2">
                                                <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                                                <span className="text-[13px] text-slate-500 font-medium leading-snug line-clamp-1">{center.address || '주소 정보 없음'}</span>
                                            </div>
                                            {center.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={13} className="text-slate-400 shrink-0" />
                                                    <span className="text-[13px] text-slate-500 font-medium">{center.phone}</span>
                                                </div>
                                            )}
                                            {center.weekday_hours && (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-slate-400 shrink-0" />
                                                    <span className="text-[13px] text-slate-500 font-medium">
                                                        평일 {center.weekday_hours}{center.saturday_hours && ` · 토 ${center.saturday_hours}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors pt-3 border-t border-slate-200/50 relative z-10">
                                            <span>자세히 보기</span>
                                            <ChevronRight size={15} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default CenterDirectory;
