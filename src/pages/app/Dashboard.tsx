
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
import { useState, useEffect, useRef } from 'react';


import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { generateIntegratedReport } from '@/utils/reportGenerator';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import {
    Crown, FileSpreadsheet
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, Line, ComposedChart, LabelList
} from 'recharts';
import { useTheme } from '@/contexts/ThemeProvider';

interface DashboardSchedule {
    id: string;
    start_time: string;
    status: string;
    child_id: string;
    service_type: string | null;
    children: {
        id: string;
        name: string;
        gender: string | null;
        birth_date: string | null;
        center_id: string | null;
    };
    therapists: {
        name: string;
        session_price_weekday: number | null;
    } | null;
    programs: {
        name: string;
    } | null;
}

interface DashboardChild {
    id: string;
    name: string;
    gender: string | null;
    birth_date: string | null;
    created_at: string;
    status: string | null;
}

interface DashboardPayment {
    amount: number;
    credit_used: number | null;
    child_id: string | null;
    paid_at: string | null;
    payment_month: string | null;
}

interface SiteVisit {
    source_category: string | null;
    visited_at: string | null;
    referrer_url: string | null;
    page_url: string | null;
    utm_campaign: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    user_agent: string | null;
}

interface DashboardLead {
    id: string;
    marketing_source: string | null;
    inflow_source: string | null;
    status: string | null;
    created_at: string | null;
    child_id: string | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
const AGE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FFCD56'];

// ✨ [FIX] Raw 소스명 → 표준 채널명 정규화 (자동 감지된 referrer 기반 소스 매핑)
function normalizeChannelName(raw: string): string {
    const lower = raw.toLowerCase().trim();
    if (lower.includes('naver') && (lower.includes('place') || lower.includes('map'))) return 'Naver Place';
    if (lower.includes('naver')) return 'Naver Blog';
    if (lower.includes('google') && (lower.includes('map'))) return 'Google Maps';
    if (lower.includes('google')) return 'Google Search';
    if (lower.includes('youtube') || lower.includes('youtu.be')) return 'Youtube';
    if (lower.includes('instagram')) return 'Instagram';
    if (lower.includes('facebook') || lower.includes('fb')) return 'Facebook';
    if (lower.includes('kakao')) return 'KakaoTalk';
    if (lower.includes('daum')) return 'Others';
    if (lower.includes('signage') || lower.includes('qr')) return 'Signage';
    if (lower.includes('flyer') || lower.includes('leaflet')) return 'Flyer';
    if (lower.includes('hospital') || lower.includes('clinic')) return 'Hospital';
    if (lower.includes('referral') || lower.includes('partner')) return 'Referral';
    if (lower === 'direct') return 'Direct';
    return raw;
}

// Dynamic tooltip props for theme support
const getTooltipProps = (isDark: boolean) => ({
    contentStyle: {
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
        boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        padding: '16px',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        color: isDark ? '#f1f5f9' : '#0f172a'
    },
    labelStyle: {
        color: isDark ? '#f1f5f9' : '#0f172a',
        fontWeight: 'bold'
    },
    itemStyle: {
        color: isDark ? '#cbd5e1' : '#475569'
    },
    cursor: { fill: isDark ? '#1e293b' : '#f8fafc', strokeWidth: 0 }
});

// Custom SVG Icons (no Lucide)
const SvgIcons = {
    dollar: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" stroke="currentColor" />
            <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9M9 12h4.5a1.5 1.5 0 010 3H9" stroke="currentColor" />
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
    calendar: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" />
        </svg>
    ),
    activity: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" />
        </svg>
    ),
    arrowUp: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l5-5 5 5M7 7h10" stroke="currentColor" />
        </svg>
    ),
    arrowDown: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 7l5 5 5-5M7 17h10" stroke="currentColor" />
        </svg>
    ),
    trendingUp: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" />
            <path d="M17 6h6v6" stroke="currentColor" />
        </svg>
    ),
    pieChart: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 118 2.83" stroke="currentColor" />
            <path d="M22 12A10 10 0 0012 2v10z" stroke="currentColor" />
        </svg>
    ),
    stethoscope: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3" stroke="currentColor" />
            <path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4" stroke="currentColor" />
            <circle cx="20" cy="10" r="2" stroke="currentColor" />
        </svg>
    ),
    clipboardCheck: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" />
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" />
            <path d="M9 14l2 2 4-4" stroke="currentColor" />
        </svg>
    ),
    crown: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" stroke="currentColor" />
            <path d="M5 20h14" stroke="currentColor" />
        </svg>
    ),
    bookOpen: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" stroke="currentColor" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke="currentColor" />
        </svg>
    ),
    share: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" stroke="currentColor" />
            <circle cx="6" cy="12" r="3" stroke="currentColor" />
            <circle cx="18" cy="19" r="3" stroke="currentColor" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" />
        </svg>
    ),
};

const KpiCard = ({ title, value, icon, trend, trendUp, color, bg, border }: { title: string; value: string; icon: any; trend: string; trendUp: boolean; color: string; bg: string; border: string }) => (
    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border ${border} ${bg} relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/30 dark:from-white/5 dark:to-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex justify-between items-start mb-3 md:mb-6">
            <div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1 tracking-wide">{title}</p>
                <h3 className="text-xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
            </div>
            <div className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-white/90 dark:bg-slate-800 ${color} shadow-sm border border-slate-100/50 dark:border-slate-700 backdrop-blur-sm`}>
                {icon("w-5 h-5 md:w-7 md:h-7")}
            </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
            <span className={`flex items-center text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg ${trendUp ? 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100/80 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                {trendUp ? SvgIcons.arrowUp("w-3 h-3 md:w-3.5 md:h-3.5 mr-0.5 md:mr-1") : SvgIcons.arrowDown("w-3 h-3 md:w-3.5 md:h-3.5 mr-0.5 md:mr-1")}{trend}
            </span>
            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium hidden md:inline">전월 대비</span>
        </div>
    </div>
);



// ✨ [FIX] SafeChart: Recharts 경고 근본 해결 + 탭 전환 대응
// 컨테이너 DOM 크기가 확보된 후에만 차트를 렌더링합니다.
const SafeChart = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // 이미 크기가 있으면 즉시 렌더
        if (el.clientWidth > 0) {
            setReady(true);
            return;
        }

        // ResizeObserver로 크기 확보 후 렌더
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setReady(true);
                    observer.disconnect();
                    break;
                }
            }
        });
        observer.observe(el);

        // 안전 타임아웃 (200ms 후 강제 렌더 — 탭 전환 시 빠른 표시)
        const timeout = setTimeout(() => {
            setReady(true);
            observer.disconnect();
        }, 200);

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div ref={containerRef} className={`w-full h-full ${className}`}>
            {ready ? children : null}
        </div>
    );
};

const ChartContainer = ({ title, icon, children, className = "", innerHeight = "h-[320px]", mobileInnerHeight, brandColor = '#4f46e5' }: { title: string; icon: any; children: React.ReactNode; className?: string; innerHeight?: string; mobileInnerHeight?: string; brandColor?: string }) => {
    // ✨ [FIX] Tailwind JIT는 동적 클래스(md:${var})를 감지 못함
    // mobileInnerHeight가 있을 때: JS로 모바일/PC 분기하여 올바른 Tailwind 클래스 적용
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    return (
    <div className={`bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[36px] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col ${className} group hover:shadow-2xl transition-all duration-500 text-left`}>
        <h3 className="font-bold text-sm md:text-lg text-slate-900 dark:text-slate-100 mb-3 md:mb-6 flex items-center gap-2 md:gap-3 relative z-10 text-left">
            <div
                className="p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors"
                style={{ backgroundColor: brandColor + '10', color: brandColor }}
            >
                {icon && icon("w-4 h-4 md:w-5 md:h-5")}
            </div>
            {title}
        </h3>
        <div
            className={`w-full relative ${mobileInnerHeight ? (isDesktop ? innerHeight : mobileInnerHeight) : innerHeight}`}
        >
            <SafeChart>{children}</SafeChart>
        </div>
    </div>
    );
};

const ChannelGridCard = ({ channel, totalInflow }: { channel: any; totalInflow: number }) => {
    const percent = totalInflow > 0 ? ((channel.value / totalInflow) * 100).toFixed(1) : '0.0';
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-100 dark:hover:border-indigo-900 transition-all text-left">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md" style={{ backgroundColor: channel.color }}>
                    {channel.cat[0]}
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{channel.cat}</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{channel.name}</h4>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{channel.value}<span className="text-xs text-slate-400 dark:text-slate-500 ml-0.5">건</span></span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">{percent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: channel.color }} />
                </div>
            </div>
        </div>
    );
};

// ✨ [Mobile] Responsive hook
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

// ✨ [Mobile] Horizontal bar list (replaces PieChart on mobile)
const MobileBarList = ({ data, colors, valueFormatter }: { data: { name: string; value: number }[]; colors: string[]; valueFormatter?: (v: number) => string }) => {
    const total = data.reduce((a, d) => a + d.value, 0);
    if (total === 0) return <p className="text-xs text-slate-400 font-bold text-center py-4">데이터 없음</p>;
    return (
        <div className="space-y-2.5">
            {data.map((item, i) => {
                const pct = Math.round((item.value / total) * 100);
                return (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-14 truncate">{item.name}</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                        </div>
                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 w-8 text-right">{pct}%</span>
                        {valueFormatter && <span className="text-[10px] text-slate-400 w-12 text-right hidden">{valueFormatter(item.value)}</span>}
                    </div>
                );
            })}
        </div>
    );
};

export function Dashboard() {
    const { isSuperAdmin, theme } = useTheme();
    const isDark = theme === 'dark';
    const isMobile = useIsMobile();
    const tooltipProps = getTooltipProps(isDark);
    const operationsRef = useRef<HTMLDivElement>(null);
    const marketingRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [slide, setSlide] = useState(0);
    const [opsPage, setOpsPage] = useState(0);
    const [showAllTherapists, setShowAllTherapists] = useState(false);
    const [showAllNotes, setShowAllNotes] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [kpi, setKpi] = useState({ revenue: 0, active: 0, sessions: 0, new: 0 });
    const { center } = useCenter();





    const { branding } = useCenterBranding();
    const BRAND_COLOR = branding?.brand_color || '#6366f1';

    const [revenueData, setRevenueData] = useState<{ name: string; value: number }[]>([]);
    const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [therapistData, setTherapistData] = useState<{ name: string; value: number }[]>([]);
    const [conversionData, setConversionData] = useState<{ name: string; consults: number; converted: number; rate: number }[]>([]);
    const [marketingData, setMarketingData] = useState<{ cat: string; name: string; value: number; color: string }[]>([]);
    const [totalInflow, setTotalInflow] = useState(0);
    const [bestChannel, setBestChannel] = useState<{ name: string; value: number }>({ name: '-', value: 0 });
    const [programData, setProgramData] = useState<{ name: string; value: number }[]>([]);
    const [ageData, setAgeData] = useState<{ name: string; value: number }[]>([]);
    const [genderData, setGenderData] = useState<{ name: string; value: number }[]>([]);
    const [topChildren, setTopChildren] = useState<{ name: string; value: number }[]>([]);
    const [channelConversionData, setChannelConversionData] = useState<{ name: string; total: number; converted: number; rate: number; color: string }[]>([]);
    const [campaignData, setCampaignData] = useState<{ name: string; value: number }[]>([]); // ✨ Campaign Performance
    const [avgLeadTime, setAvgLeadTime] = useState(0); // ✨ Lead Velocity (Days)
    const [inquiryHourData, setInquiryHourData] = useState<{ hour: string; count: number; label: string }[]>([]); // ✨ 시간대별 문의
    const [avgInquiryTime, setAvgInquiryTime] = useState(''); // ✨ 평균 문의 시간

    // ✨ [Phase 2] 마케팅 지능 신규 데이터
    const [heatmapData, setHeatmapData] = useState<{ day: number; hour: number; count: number }[]>([]);
    const [landingPageData, setLandingPageData] = useState<{ name: string; value: number; pct: number }[]>([]);

    const [dailyTrendData, setDailyTrendData] = useState<{ name: string; value: number }[]>([]);
    const [peakTimeLabel, setPeakTimeLabel] = useState('');
    const [mobileRatio, setMobileRatio] = useState(0);
    const [prevMonthInflow, setPrevMonthInflow] = useState<number | null>(null);

    // ✨ [신규] 일지 미작성 & 출석률 통계
    const [missingNotes, setMissingNotes] = useState<{ therapist: string; count: number; total: number }[]>([]);
    const [missingNoteTotal, setMissingNoteTotal] = useState(0);
    const [attendanceData, setAttendanceData] = useState<{ name: string; completed: number; cancelled: number; total: number; rate: number | null }[]>([]);
    const [overallAttendance, setOverallAttendance] = useState(0);

    const [exporting, setExporting] = useState(false);

    const exportIntegratedReport = async () => {
        if (!center?.id) return alert('센터 정보가 없습니다.');
        if (!confirm('현재 화면의 데이터로 통합 보고서를 생성하시겠습니까?')) return;
        setExporting(true);
        try {
            await generateIntegratedReport(selectedMonth, center.id); // ✨ Pass center.id dynamically
        } catch (e) {
            console.error(e);
            alert('보고서 생성 실패');
        } finally {
            setExporting(false);
        }
    };

    const fetchData = async () => {
        if (!center) return;
        try {
            const today = new Date();
            const currentYear = today.getFullYear();
            const [selYear, selMonth] = selectedMonth.split('-').map(Number);

            const monthsToShow = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(selYear, selMonth - 1 - i, 1);
                monthsToShow.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }

            const lastDayOfMonth = new Date(selYear, selMonth, 0).getDate();

            // ⚡ [PERF] Batch 1: 독립적 쿼리 4개 병렬 실행 (기존 순차 → 병렬)
            // ✨ [Performance] schedules를 monthsToShow 6개월 범위로 제한 (전체 조회 → 범위 필터)
            const scheduleRangeStart = monthsToShow[0] + '-01';
            const scheduleRangeEnd = selectedMonth + '-' + String(lastDayOfMonth).padStart(2, '0') + 'T23:59:59';
            const [schedulesRes, childrenRes, siteVisitsRes, leadsRes] = await Promise.all([
                // 1. Schedules (6개월 범위)
                supabase
                    .from('schedules')
                    .select(`id, start_time, status, child_id, service_type, children!inner(id, name, gender, birth_date, center_id), therapists (name, session_price_weekday), programs (name)`)
                    .eq('children.center_id', center.id)
                    .gte('start_time', scheduleRangeStart)
                    .lte('start_time', scheduleRangeEnd)
                    .order('start_time', { ascending: true }),
                // 2. Children (센터)
                supabase
                    .from('children')
                    .select('id, name, gender, birth_date, created_at, status')
                    .eq('center_id', center.id),
                // 3. Site Visits (월별) — ✨ [FIX] utm_campaign/source/medium + user_agent 포함
                supabase
                    .from('site_visits')
                    .select('source_category, visited_at, referrer_url, page_url, utm_campaign, utm_source, utm_medium, user_agent')
                    .eq('center_id', center.id)
                    .gte('visited_at', selectedMonth + '-01')
                    .lte('visited_at', selectedMonth + '-' + String(lastDayOfMonth).padStart(2, '0')),
                // 4. Consultations / Leads
                supabase
                    .from('consultations')
                    .select('id, marketing_source, inflow_source, status, created_at, child_id')
                    .eq('center_id', center.id)
                    .gte('created_at', monthsToShow[0] + '-01')
                    .lte('created_at', selectedMonth + '-' + String(lastDayOfMonth).padStart(2, '0'))
            ]);

            // ✨ 전월 site_visits 카운트 (Direct 제외 성장률 계산용)
            const prevDate = new Date(selYear, selMonth - 2, 1);
            const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
            const prevLastDay = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate();
            const prevVisitsRes = await supabase
                .from('site_visits')
                .select('source_category, referrer_url', { count: 'exact' })
                .eq('center_id', center.id)
                .gte('visited_at', prevMonthStr + '-01')
                .lte('visited_at', prevMonthStr + '-' + String(prevLastDay).padStart(2, '0'));
            
            // 전월 Direct 제외 카운트
            const prevVisits = prevVisitsRes.data || [];
            let prevCount = 0;
            prevVisits.forEach((v: any) => {
                if (v.source_category === 'Direct') return;
                if (v.referrer_url) {
                    try {
                        const h = new URL(v.referrer_url).hostname.replace('www.', '');
                        if (h.includes('localhost') || h.includes('vercel') || h.includes('127.0.0.1') || h.includes('brainlitix.net')) return;
                    } catch {}
                }
                prevCount++;
            });
            setPrevMonthInflow(prevCount);

            const allSchedules = schedulesRes.data;
            const existingChildren = childrenRes.data;
            const siteVisits = siteVisitsRes.data;
            const allLeads = leadsRes.data;

            // ✨ [FIX] status enum 기반 활성 아동 필터링
            const activeChildren = (existingChildren as DashboardChild[])?.filter(c =>
                c.status === 'active' || (!c.status)
            ) || [];

            const validChildIds = new Set((existingChildren as DashboardChild[])?.map(c => c.id) || []);

            // ✨ [FIX] Build set of child_ids that have completed schedules
            const childrenWithCompletedSchedules = new Set<string>();
            (allSchedules as DashboardSchedule[])?.forEach(s => {
                if (s.status === 'completed' && s.child_id) {
                    childrenWithCompletedSchedules.add(s.child_id);
                }
            });

            const completedScheduleIds = (allSchedules as DashboardSchedule[])?.filter(s =>
                s.status === 'completed' && s.start_time?.startsWith(selectedMonth)
            ).map(s => s.id) || [];

            // ⚡ [PERF] Batch 2: 의존적 쿼리 — IN절 200개씩 배치 분할 (URL 길이 초과 방지)
            const BATCH_SIZE = 200;

            // Payments — validChildIds 배치 처리
            let allPayments: any[] | null = null;
            if (validChildIds.size > 0) {
                const childIdArr = [...validChildIds];
                const paymentPromises = [];
                for (let i = 0; i < childIdArr.length; i += BATCH_SIZE) {
                    paymentPromises.push(
                        supabase
                            .from('payments')
                            .select('amount, credit_used, child_id, paid_at, payment_month')
                            .in('child_id', childIdArr.slice(i, i + BATCH_SIZE))
                            .gte('payment_month', monthsToShow[0])
                            .lte('payment_month', selectedMonth)
                    );
                }
                const paymentResults = await Promise.all(paymentPromises);
                allPayments = paymentResults.flatMap(r => r.data || []);
            }

            // Counseling Logs — completedScheduleIds 배치 처리
            const notesSet = new Set<string>();
            if (completedScheduleIds.length > 0) {
                const notesPromises = [];
                for (let i = 0; i < completedScheduleIds.length; i += BATCH_SIZE) {
                    notesPromises.push(
                        supabase
                            .from('counseling_logs')
                            .select('schedule_id')
                            .in('schedule_id', completedScheduleIds.slice(i, i + BATCH_SIZE))
                    );
                }
                const notesResults = await Promise.all(notesPromises);
                notesResults.flatMap(r => (r.data || []) as { schedule_id: string }[])
                    .forEach(n => notesSet.add(n.schedule_id));
            }

            // Calculation Maps
            const monthlyRevMap: Record<string, number> = {};
            monthsToShow.forEach(m => monthlyRevMap[m] = 0);

            const statusMap = { completed: 0, cancelled: 0, scheduled: 0 };
            const therapistRevMap: Record<string, number> = {};
            const progCountMap: Record<string, number> = {};
            const ageCountMap: Record<string, number> = {};
            let mCount = 0, fCount = 0;
            const childContribMap: Record<string, number> = {};

            // ✨ [FIX] Payment Processing — 실제 결제 금액 기반 매출 계산
            const childMonthlyPayment: Record<string, number> = {};
            (allPayments as DashboardPayment[])?.forEach(p => {
                if (p.child_id && validChildIds.has(p.child_id) && childrenWithCompletedSchedules.has(p.child_id)) {
                    const m = p.payment_month || (p.paid_at as string)?.slice(0, 7);
                    if (!m) return;
                    const totalPaidAmount = (p.amount || 0) + (p.credit_used || 0);
                    if (monthlyRevMap[m] !== undefined) monthlyRevMap[m] += totalPaidAmount;
                    if (m === selectedMonth) {
                        childMonthlyPayment[p.child_id] = (childMonthlyPayment[p.child_id] || 0) + totalPaidAmount;
                    }
                }
            });

            // 2단계: 수업 상태 집계 + 아동별 완료 세션 수 카운트
            const childSessionCount: Record<string, number> = {};
            (allSchedules as DashboardSchedule[])?.forEach(s => {
                if (s.start_time && s.start_time.startsWith(selectedMonth)) {
                    if (s.status === 'completed') {
                        statusMap.completed++;
                        if (s.child_id) childSessionCount[s.child_id] = (childSessionCount[s.child_id] || 0) + 1;

                        const pName = s.programs?.name || s.service_type || '치료 세션';
                        progCountMap[pName] = (progCountMap[pName] || 0) + 1;
                    }
                    else if (s.status === 'cancelled') statusMap.cancelled++;
                    else statusMap.scheduled++;
                }
            });

            // 3단계: 치료사별 매출 — 실제 결제금을 완료 세션 수로 비례 배분
            (allSchedules as DashboardSchedule[])?.forEach(s => {
                if (s.start_time?.startsWith(selectedMonth) && s.status === 'completed' && s.child_id) {
                    const tName = s.therapists?.name || '미배정';
                    const totalPaid = childMonthlyPayment[s.child_id] || 0;
                    const sessionCnt = childSessionCount[s.child_id] || 1;
                    const perSessionRev = Math.round(totalPaid / sessionCnt);
                    therapistRevMap[tName] = (therapistRevMap[tName] || 0) + perSessionRev;
                }
            });

            // 4단계: 상위 기여 아동
            const childNameMap: Record<string, string> = {};
            (existingChildren as DashboardChild[])?.forEach(c => { childNameMap[c.id] = c.name; });
            Object.entries(childMonthlyPayment).forEach(([childId, amount]) => {
                const cName = childNameMap[childId] || '알수없음';
                childContribMap[cName] = (childContribMap[cName] || 0) + amount;
            });

            // Demographics (from activeChildren only)
            activeChildren.forEach(c => {
                const gRaw = (c.gender || '').trim().toLowerCase();
                if (gRaw === '남' || gRaw === '남아' || gRaw === 'male' || gRaw === 'm' || gRaw === '남자') mCount++;
                else if (gRaw === '여' || gRaw === '여아' || gRaw === 'female' || gRaw === 'f' || gRaw === '여자') fCount++;

                if (c.birth_date) {
                    const year = parseInt(c.birth_date.split('-')[0]);
                    const age = currentYear - year;
                    const ageGroup = `${age}세`;
                    ageCountMap[ageGroup] = (ageCountMap[ageGroup] || 0) + 1;
                }
            });

            // Final Data Assembly
            setRevenueData(monthsToShow.map(m => ({ name: m.slice(5) + '월', value: monthlyRevMap[m] })));
            setStatusData([
                { name: '완료', value: statusMap.completed, color: '#10b981' },
                { name: '취소', value: statusMap.cancelled, color: '#ef4444' },
                { name: '예정', value: statusMap.scheduled, color: '#3b82f6' }
            ]);

            const sortedTherapist = Object.entries(therapistRevMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
            setTherapistData(sortedTherapist);

            const sortedProg = Object.entries(progCountMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
            setProgramData(sortedProg);

            setAgeData(Object.entries(ageCountMap).map(([name, value]) => ({ name, value })));
            setGenderData([{ name: '남아', value: mCount }, { name: '여아', value: fCount }]);

            setTopChildren(Object.entries(childContribMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5));

            // ✨ [TRAFFIC ANALYSIS] Process site_visits
            const trafficMap: Record<string, number> = {
                'Naver Blog': 0, 'Naver Place': 0, 'Google Search': 0, 'Google Ads': 0, 'Google Maps': 0,
                'Instagram': 0, 'Youtube': 0, 'Facebook': 0, 'Facebook Ads': 0, 'KakaoTalk': 0,
                'Naver Ads': 0, 'Referral': 0, 'Signage': 0, 'Flyer': 0, 'Hospital': 0, 'Partnership': 0,
                'Direct': 0, 'Others': 0
            };
            // ✨ [NEW] 캠페인 데이터를 site_visits에서 직접 집계
            const siteVisitCampaignMap: Record<string, number> = {};
            const blogTrafficMap: Record<string, Record<string, number>> = {};

            // ✨ [Phase 2] 히트맵 / 인기 페이지 / 디바이스 / 일별 트렌드 집계 구조
            const heatmapBuckets: Record<string, number> = {}; // "day_hour" → count
            const pageCountMap: Record<string, number> = {};
            let deviceMobile = 0, devicePC = 0, deviceTablet = 0;
            const dailyCountMap: Record<string, number> = {};

            siteVisits?.forEach((v: SiteVisit) => {
                let cat = v.source_category || 'Others';

                if (v.referrer_url) {
                    try {
                        const hostname = new URL(v.referrer_url).hostname.replace('www.', '');
                        if (hostname.includes('localhost') ||
                            hostname.includes('127.0.0.1') ||
                            hostname.includes('vercel.app') ||
                            hostname.includes('vercel.com') ||
                            hostname.includes('brainlitix.net')) {
                            return;
                        }
                    } catch (e) {
                        // Invalid URL
                    }
                }

                if (trafficMap[cat] === undefined) trafficMap[cat] = 0;
                trafficMap[cat] += 1;

                // ✨ [NEW] utm_campaign이 있으면 캠페인 집계
                if (v.utm_campaign && v.utm_campaign !== '-') {
                    siteVisitCampaignMap[v.utm_campaign] = (siteVisitCampaignMap[v.utm_campaign] || 0) + 1;
                }

                // ✨ [Phase 2] 히트맵: 요일 × 시간 집계 (Direct 제외 — totalInflow와 일치)
                if (v.visited_at && cat !== 'Direct') {
                    const visitDate = new Date(v.visited_at);
                    const dayOfWeek = visitDate.getDay();
                    const hourOfDay = visitDate.getHours();
                    const hKey = `${dayOfWeek}_${hourOfDay}`;
                    heatmapBuckets[hKey] = (heatmapBuckets[hKey] || 0) + 1;

                    const dayStr = v.visited_at.slice(0, 10);
                    dailyCountMap[dayStr] = (dailyCountMap[dayStr] || 0) + 1;
                }

                // ✨ [Phase 2] 인기 랜딩 페이지 집계 (Direct 제외)
                if (v.page_url && cat !== 'Direct') {
                    try {
                        const urlObj = new URL(v.page_url);
                        const path = urlObj.pathname.replace(/\/$/, '') || '/';
                        pageCountMap[path] = (pageCountMap[path] || 0) + 1;
                    } catch {
                        // invalid url
                    }
                }

                // ✨ [Phase 2] 디바이스 분류 (Direct 제외)
                if (v.user_agent && cat !== 'Direct') {
                    const ua = v.user_agent.toLowerCase();
                    if (/ipad|tablet|kindle|playbook/.test(ua)) {
                        deviceTablet++;
                    } else if (/mobile|android|iphone|ipod|opera mini|iemobile|wpdesktop/.test(ua)) {
                        deviceMobile++;
                    } else {
                        devicePC++;
                    }
                }

                const isBlog = v.page_url?.includes('/blog/') ?? false;
                const hasInfo = cat !== 'Direct' || v.referrer_url;

                if (isBlog && hasInfo) {
                    try {
                        const parts = v.page_url!.split('/blog/');
                        if (parts.length > 1) {
                            const slug = parts[1].split('?')[0];
                            if (slug) {
                                if (!blogTrafficMap[slug]) blogTrafficMap[slug] = {};
                                if (!blogTrafficMap[slug][cat]) blogTrafficMap[slug][cat] = 0;
                                blogTrafficMap[slug][cat]++;
                            }
                        }
                    } catch (e) {
                        // Ignore parse error
                    }
                }
            });

            const channelColors: Record<string, string> = {
                'Naver Blog': '#03C75A',
                'Naver Place': '#00d2d2',
                'Naver Ads': '#2DB400',
                'Google Search': '#4285F4',
                'Google Ads': '#FBBC04',
                'Google Maps': '#34A853',
                'Youtube': '#FF0000',
                'Instagram': '#E1306C',
                'Facebook': '#1877F2',
                'Facebook Ads': '#1877F2',
                'KakaoTalk': '#FEE500',
                'Referral': '#ec4899',
                'Signage': '#8b5cf6',
                'Flyer': '#f59e0b',
                'Hospital': '#ef4444',
                'Partnership': '#10b981',
                'Direct': '#6366f1',
                'Others': '#94a3b8'
            };

            const marketingArr = Object.entries(trafficMap)
                .filter(([name]) => name !== 'Direct')
                .filter(([_, value]) => value > 0)
                .map(([name, value], idx) => ({
                    cat: 'CHANNEL',
                    name,
                    value,
                    color: channelColors[name] || COLORS[idx % COLORS.length]
                }))
                .sort((a, b) => b.value - a.value);

            setMarketingData(marketingArr);

            const totalDisplayedVisits = marketingArr.reduce((acc, curr) => acc + curr.value, 0);
            setTotalInflow(totalDisplayedVisits);

            if (marketingArr.length > 0) setBestChannel(marketingArr[0]);

            // ✨ [Phase 2] 히트맵 데이터 → 배열 변환
            const heatmapArr: { day: number; hour: number; count: number }[] = [];
            for (let d = 0; d < 7; d++) {
                for (let h = 0; h < 24; h++) {
                    heatmapArr.push({ day: d, hour: h, count: heatmapBuckets[`${d}_${h}`] || 0 });
                }
            }
            setHeatmapData(heatmapArr);

            // 피크 시간 라벨
            const peakEntry = heatmapArr.reduce((best, cur) => cur.count > best.count ? cur : best, { day: 0, hour: 0, count: 0 });
            if (peakEntry.count > 0) {
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                setPeakTimeLabel(`${dayNames[peakEntry.day]}요일 ${peakEntry.hour}시`);
            } else {
                setPeakTimeLabel('');
            }

            // ✨ [Phase 2] 인기 랜딩 페이지 TOP 5
            const totalPages = Object.values(pageCountMap).reduce((a, b) => a + b, 0);
            const landingArr = Object.entries(pageCountMap)
                .map(([name, value]) => ({ name, value, pct: totalPages > 0 ? Math.round((value / totalPages) * 100) : 0 }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            setLandingPageData(landingArr);

            // ✨ [Phase 2] 디바이스 분석
            const devTotal = deviceMobile + devicePC + deviceTablet;
            setMobileRatio(devTotal > 0 ? Math.round((deviceMobile / devTotal) * 100) : 0);

            // ✨ [Phase 2] 일별 유입 트렌드 (빈 날짜 0으로 채움)
            const daysInMonth = lastDayOfMonth;
            const dailyArr: { name: string; value: number }[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
                const dayKey = `${selectedMonth}-${String(d).padStart(2, '0')}`;
                dailyArr.push({ name: `${d}일`, value: dailyCountMap[dayKey] || 0 });
            }
            setDailyTrendData(dailyArr);

            // ✨ [LEADS CONVERSION ANALYSIS]
            const monthlyLeadsMap: Record<string, { consults: number; converted: number }> = {};
            monthsToShow.forEach(m => monthlyLeadsMap[m] = { consults: 0, converted: 0 });

            const channelLeadsMap: Record<string, { total: number; converted: number }> = {};
            // ✨ [FIX] campaignMap을 site_visits 기반으로 초기화 (기존 leads 기반에 추가)
            const campaignMap: Record<string, number> = { ...siteVisitCampaignMap };
            let leadTimeTotal = 0;
            let leadTimeCount = 0;

            allLeads?.forEach((lead: DashboardLead) => {
                if (lead.created_at) {
                    const m = (lead.created_at as string).slice(0, 7);

                    if (monthlyLeadsMap[m]) {
                        monthlyLeadsMap[m].consults++;
                        if (lead.child_id || lead.status === 'completed' || lead.status === 'converted') monthlyLeadsMap[m].converted++;
                    }

                    if (lead.marketing_source && lead.marketing_source.includes('Campaign: ')) {
                        const campMatch = lead.marketing_source.match(/Campaign: ([^/|]*)/);
                        if (campMatch && campMatch[1]) {
                            const campName = campMatch[1].trim();
                            campaignMap[campName] = (campaignMap[campName] || 0) + 1;
                        }
                    }

                    if (lead.child_id && lead.created_at) {
                        const firstSchedule = (allSchedules as DashboardSchedule[])?.find(s =>
                            s.child_id === lead.child_id &&
                            new Date(s.start_time) > new Date(lead.created_at!)
                        );
                        if (firstSchedule) {
                            const diffDays = Math.ceil((new Date(firstSchedule.start_time).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays > 0 && diffDays < 100) {
                                leadTimeTotal += diffDays;
                                leadTimeCount++;
                            }
                        }
                    }

                    if (m === selectedMonth) {
                        let channel = normalizeChannelName(lead.inflow_source || 'Direct');

                        if (lead.marketing_source && lead.marketing_source.includes('Source: ')) {
                            const srcMatch = lead.marketing_source.match(/Source: ([^/|]*)/);
                            if (srcMatch && srcMatch[1]) channel = normalizeChannelName(srcMatch[1].trim());
                        }

                        if (!channelLeadsMap[channel]) channelLeadsMap[channel] = { total: 0, converted: 0 };
                        channelLeadsMap[channel].total++;

                        if (lead.child_id || lead.status === 'completed' || lead.status === 'converted') {
                            channelLeadsMap[channel].converted++;
                        }
                    }
                }
            });

            setAvgLeadTime(leadTimeCount > 0 ? Math.round(leadTimeTotal / leadTimeCount) : 0);

            const campArr = Object.entries(campaignMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);
            setCampaignData(campArr);

            const conversionArr = monthsToShow.map(m => ({
                name: m.slice(5) + '월',
                consults: monthlyLeadsMap[m].consults,
                converted: monthlyLeadsMap[m].converted,
                rate: monthlyLeadsMap[m].consults > 0
                    ? Math.round((monthlyLeadsMap[m].converted / monthlyLeadsMap[m].consults) * 100)
                    : 0
            }));
            setConversionData(conversionArr);

            const channelConvArr = Object.entries(channelLeadsMap)
                .map(([name, data], idx) => ({
                    name,
                    total: data.total,
                    converted: data.converted,
                    rate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
                    color: channelColors[name] || COLORS[idx % COLORS.length]
                }))
                .filter(c => c.total > 0)
                .sort((a, b) => b.total - a.total);
            setChannelConversionData(channelConvArr);

            // ✨ 시간대별 문의 분석 + 평균 문의 시간
            const hourBuckets: Record<number, number> = {};
            for (let h = 0; h < 24; h++) hourBuckets[h] = 0;
            let totalMinutes = 0;
            let timeCount = 0;

            allLeads?.forEach((lead: DashboardLead) => {
                if (lead.created_at) {
                    const leadDate = new Date(lead.created_at);
                    const m = (lead.created_at as string).slice(0, 7);
                    if (m === selectedMonth) {
                        const hour = leadDate.getHours();
                        hourBuckets[hour]++;
                        totalMinutes += hour * 60 + leadDate.getMinutes();
                        timeCount++;
                    }
                }
            });

            const hourLabels: Record<number, string> = {
                0: '새벽', 1: '새벽', 2: '새벽', 3: '새벽', 4: '새벽', 5: '새벽',
                6: '아침', 7: '아침', 8: '아침', 9: '오전', 10: '오전', 11: '오전',
                12: '점심', 13: '오후', 14: '오후', 15: '오후', 16: '오후', 17: '오후',
                18: '저녁', 19: '저녁', 20: '야간', 21: '야간', 22: '야간', 23: '야간'
            };

            const hourArr = Object.entries(hourBuckets).map(([h, count]) => ({
                hour: `${h}시`,
                count,
                label: hourLabels[Number(h)] || ''
            }));
            setInquiryHourData(hourArr);

            if (timeCount > 0) {
                const avgMins = Math.round(totalMinutes / timeCount);
                const avgH = Math.floor(avgMins / 60);
                const avgM = avgMins % 60;
                const period = avgH < 12 ? '오전' : '오후';
                const displayH = avgH === 0 ? 12 : avgH > 12 ? avgH - 12 : avgH;
                setAvgInquiryTime(`${period} ${displayH}:${String(avgM).padStart(2, '0')}`);
            } else {
                setAvgInquiryTime('');
            }

            // ✨ [NEW CHILDREN KPI]
            const newCount = activeChildren.filter(c =>
                c.created_at && (c.created_at as string).startsWith(selectedMonth)
            ).length || 0;

            setKpi({
                revenue: monthlyRevMap[selectedMonth] || 0,
                active: activeChildren.length,
                sessions: statusMap.completed,
                new: newCount
            });

            // ✨ 일지 미작성 분석
            const therapistMissing: Record<string, { count: number; total: number }> = {};
            (allSchedules as DashboardSchedule[])?.filter(s =>
                s.status === 'completed' && s.start_time?.startsWith(selectedMonth)
            ).forEach(s => {
                const tName = s.therapists?.name || '미배정';
                if (!therapistMissing[tName]) therapistMissing[tName] = { count: 0, total: 0 };
                therapistMissing[tName].total++;
                if (!notesSet.has(s.id)) therapistMissing[tName].count++;
            });

            const missingArr = Object.entries(therapistMissing)
                .map(([therapist, data]) => ({ therapist, ...data }))
                .sort((a, b) => b.count - a.count);
            setMissingNotes(missingArr);
            setMissingNoteTotal(missingArr.reduce((acc, m) => acc + m.count, 0));

            // ✨ 출석률 통계 (주차별) — completed/cancelled만 집계 (scheduled 미래 예약 제외)
            // 해당 월의 전체 주차 수 계산 (전환율 차트처럼 모든 주차 표시)
            const totalWeeks = Math.ceil(lastDayOfMonth / 7);
            const weeklyAttendance: Record<string, { completed: number; cancelled: number; total: number }> = {};
            for (let w = 1; w <= totalWeeks; w++) {
                weeklyAttendance[`${w}주차`] = { completed: 0, cancelled: 0, total: 0 };
            }

            (allSchedules as DashboardSchedule[])?.filter(s =>
                s.start_time?.startsWith(selectedMonth) &&
                (s.status === 'completed' || s.status === 'cancelled')
            ).forEach(s => {
                const day = new Date(s.start_time).getDate();
                const weekNum = `${Math.ceil(day / 7)}주차`;
                if (!weeklyAttendance[weekNum]) weeklyAttendance[weekNum] = { completed: 0, cancelled: 0, total: 0 };
                weeklyAttendance[weekNum].total++;
                if (s.status === 'completed') weeklyAttendance[weekNum].completed++;
                else if (s.status === 'cancelled') weeklyAttendance[weekNum].cancelled++;
            });

            const attendArr = Object.entries(weeklyAttendance)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, data]) => ({
                    name,
                    completed: data.completed,
                    cancelled: data.cancelled,
                    total: data.total,
                    rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : null as number | null
                }));
            setAttendanceData(attendArr);

            const totalSched = attendArr.reduce((a, d) => a + d.total, 0);
            const totalComp = attendArr.reduce((a, d) => a + d.completed, 0);
            setOverallAttendance(totalSched > 0 ? Math.round((totalComp / totalSched) * 100) : 0);

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, center?.id]);

    return (
        <div ref={dashboardRef} className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-4 md:space-y-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-20 md:pb-8">
            <Helmet>
                <title>인사이트 허브 - Zarada Admin</title>
            </Helmet>

            {isSuperAdmin && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 p-0.5 md:p-1 rounded-2xl md:rounded-3xl mb-4 md:mb-8 animate-in fade-in slide-in-from-top-4 border border-amber-200 dark:border-amber-800/50">
                    <div className="bg-white/60 dark:bg-slate-900/80 backdrop-blur-sm rounded-[20px] md:rounded-[28px] p-3 md:p-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="bg-amber-500 text-white p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none animate-bounce-slow">
                                <Crown className="w-5 h-5 md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-xl font-black text-amber-900 dark:text-yellow-300 flex items-center gap-2">
                                    <span className="hidden md:inline">관리자 전용 데이터 관리</span>
                                    <span className="md:hidden">데이터 관리</span>
                                    <span className="text-[8px] md:text-[10px] font-bold bg-amber-600 text-white px-1.5 md:px-2 py-0.5 rounded-full">SUPER ADMIN</span>
                                </h2>
                                <p className="hidden md:block text-sm font-medium text-amber-700 dark:text-yellow-400/80">아동, 수납, 수업 데이터를 Excel(CSV)로 추출할 수 있습니다</p>
                            </div>
                        </div>
                        <div className="flex gap-2 md:gap-3 flex-wrap w-full md:w-auto">
                            <button
                                onClick={exportIntegratedReport}
                                disabled={exporting}
                                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-4 bg-emerald-600 dark:bg-emerald-500 text-white font-black text-xs md:text-sm rounded-xl md:rounded-2xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all disabled:opacity-50 gpu-accelerate shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30 transform hover:-translate-y-1 active:translate-y-0 w-full md:w-auto"
                            >
                                <FileSpreadsheet className="w-4 h-4 md:w-6 md:h-6" />
                                <span className="text-xs md:text-base">센터 통합 보고서 (Excel)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-4">
                <div className="text-left">
                    <h1 className="text-lg md:text-4xl font-black text-slate-900 dark:text-white tracking-tight hero-text"><span className="md:hidden">인사이트 허브</span><span className="hidden md:inline">지능형 센터 인사이트 허브</span></h1>
                    <p className="hidden md:block text-sm md:text-base text-slate-500 dark:text-slate-400 font-bold mt-1 md:mt-2">AI 기반 운영 & 마케팅 통합 분석 시스템</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 p-1.5 md:p-2 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 w-full md:w-auto">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none text-sm shrink-0"
                    />
                    <div className="hidden md:block w-px h-6 md:h-8 bg-slate-200 dark:bg-slate-700 mx-0.5 md:mx-1 shrink-0" />
                    <button
                        onClick={() => setSlide(0)}
                        className={cn("px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black transition-all gpu-accelerate text-sm shrink-0", slide === 0 ? "text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
                        style={slide === 0 ? { backgroundColor: BRAND_COLOR } : undefined}
                    >
                        운영 지표
                    </button>
                    {isSuperAdmin && (
                        <button
                            onClick={() => setSlide(1)}
                            className={cn("px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black transition-all gpu-accelerate text-sm shrink-0", slide === 1 ? "text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
                            style={slide === 1 ? { backgroundColor: BRAND_COLOR } : undefined}
                        >
                            마케팅 지능
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <KpiCard title="확정 매출" value={`₩${kpi.revenue.toLocaleString()}`} icon={SvgIcons.dollar} trend="확정" trendUp={true} color="text-blue-600 dark:text-blue-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="활성 아동" value={`${kpi.active}명`} icon={SvgIcons.users} trend="현재원" trendUp={true} color="text-indigo-600 dark:text-indigo-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="완료 수업" value={`${kpi.sessions}건`} icon={SvgIcons.calendar} trend="실적" trendUp={true} color="text-emerald-600 dark:text-emerald-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="신규 아동" value={`${kpi.new}명`} icon={SvgIcons.activity} trend="이번달" trendUp={kpi.new > 0} color="text-rose-600 dark:text-rose-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
            </div>

            {slide === 0 && (
                <div ref={operationsRef} className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* ✨ 운영 지표 서브탭 (PC: 인라인) */}
                    <div className="hidden md:flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 w-full md:w-fit overflow-x-auto no-scrollbar">
                        {['매출·수업', '아동·프로그램', '운영 현황'].map((label, i) => (
                            <button
                                key={i}
                                onClick={() => setOpsPage(i)}
                                className={cn(
                                    'px-5 py-2.5 rounded-xl text-sm font-black transition-all',
                                    opsPage === i
                                        ? 'text-white shadow-md'
                                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                )}
                                style={opsPage === i ? { backgroundColor: BRAND_COLOR } : undefined}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ───── 서브탭 1: 매출·수업 ───── */}
                    {opsPage === 0 && (
                        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            {/* Row 1: 매출 추이 (2col) + 치료사 순위 리스트 (1col) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                                <ChartContainer title="월별 누적 매출 추이" icon={SvgIcons.trendingUp} className="lg:col-span-2" innerHeight="h-[320px]" mobileInnerHeight="h-[180px]" brandColor={BRAND_COLOR}>
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <AreaChart data={revenueData} margin={isMobile ? { top: 10, right: 10, left: -10, bottom: 0 } : { top: 20, right: 30, left: 20, bottom: 0 }}>
                                            <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.3} /><stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} /></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} dy={10} interval={isMobile ? 1 : 0} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v} width={isMobile ? 35 : 60} />
                                            <RechartsTooltip {...tooltipProps} formatter={(val: any) => [`₩${val?.toLocaleString?.() ?? 0}`, '매출']} />
                                            <Area type="monotone" dataKey="value" stroke={BRAND_COLOR} strokeWidth={isMobile ? 2.5 : 4} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </ChartContainer>

                                {/* 치료사별 매출 – 리더보드 스타일 */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-[36px] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col text-left group hover:shadow-2xl transition-all duration-500">
                                    <h3 className="font-bold text-sm md:text-lg text-slate-900 dark:text-slate-100 mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                                        <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl" style={{ backgroundColor: BRAND_COLOR + '10', color: BRAND_COLOR }}>
                                            {SvgIcons.stethoscope("w-4 h-4 md:w-5 md:h-5")}
                                        </div>
                                        치료사별 매출
                                    </h3>
                                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1 custom-scrollbar">
                                        {therapistData.length > 0 ? (isMobile && !showAllTherapists ? therapistData.slice(0, 3) : therapistData).map((t, i) => {
                                            const maxVal = Math.max(...therapistData.map(d => d.value), 1);
                                            const pct = (t.value / maxVal) * 100;
                                            return (
                                                <div key={t.name} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                                                    <div
                                                        className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center text-white text-[10px] md:text-xs font-black shrink-0 shadow-sm"
                                                        style={{ backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : BRAND_COLOR + '80' }}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{t.name}</span>
                                                            <span className="text-[10px] md:text-xs font-black text-slate-600 dark:text-slate-300 shrink-0 ml-2">₩{t.value.toLocaleString()}</span>
                                                        </div>
                                                        <div className="h-1 md:h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-700"
                                                                style={{ width: `${pct}%`, backgroundColor: BRAND_COLOR }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="flex items-center justify-center py-8 text-slate-400">
                                                <p className="text-sm font-bold">매출 데이터 없음</p>
                                            </div>
                                        )}
                                        {isMobile && therapistData.length > 3 && !showAllTherapists && (
                                            <button onClick={() => setShowAllTherapists(true)} className="w-full py-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                                                +{therapistData.length - 3}명 더보기
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: 수업 상태 (1col) + 전환율 (2col) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                                <ChartContainer title="수업 상태 점유율" icon={SvgIcons.pieChart} innerHeight="h-[300px]" mobileInnerHeight="h-auto" brandColor={BRAND_COLOR}>
                                    {isMobile ? (
                                        <MobileBarList data={statusData} colors={statusData.map(d => d.color)} />
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <PieChart margin={{ top: 10, right: 0, bottom: 20, left: 0 }}>
                                            <Pie data={statusData} cx="50%" cy="55%" innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                                                {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="center" wrapperStyle={{ top: 0 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    )}
                                </ChartContainer>

                                <ChartContainer title="상담 후 등록 전환율" icon={SvgIcons.activity} className="lg:col-span-2" innerHeight="h-[300px]" brandColor={BRAND_COLOR}>
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <ComposedChart data={conversionData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                            <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" tick={{ fontSize: 11 }} />
                                            <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                            <Bar yAxisId="left" dataKey="consults" name="상담 진행" fill="#e2e8f0" barSize={30} radius={[6, 6, 0, 0]} />
                                            <Bar yAxisId="left" dataKey="converted" name="최종 등록" fill={BRAND_COLOR} barSize={30} radius={[6, 6, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="rate" name="전환율(%)" stroke="#f59e0b" strokeWidth={3} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                        </div>)}

                    {/* ───── 서브탭 2: 아동·프로그램 ───── */}
                    {opsPage === 1 && (
                        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                                <ChartContainer title="프로그램별 점유율 (횟수)" icon={SvgIcons.clipboardCheck} innerHeight="h-[300px]" mobileInnerHeight="h-auto">
                                    {isMobile ? (
                                        <MobileBarList data={programData} colors={COLORS} />
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <PieChart margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                                            <Pie data={programData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" stroke="none" label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}>
                                                {programData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="bottom" align="center" wrapperStyle={{ bottom: 0 }} iconSize={8} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    )}
                                </ChartContainer>
                                <ChartContainer title="아동 연령별" icon={SvgIcons.users} innerHeight="h-[300px]" mobileInnerHeight="h-auto">
                                    {isMobile ? (
                                        <MobileBarList data={ageData} colors={AGE_COLORS} />
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <PieChart margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                                            <Pie data={ageData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" stroke="none">
                                                {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                                            </Pie>
                                            <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="bottom" align="center" wrapperStyle={{ bottom: 0 }} iconSize={8} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    )}
                                </ChartContainer>
                                <ChartContainer title="성별 비율" icon={SvgIcons.users} innerHeight="h-[300px]" mobileInnerHeight="h-auto">
                                    {isMobile ? (
                                        <div className="flex items-center justify-center gap-6 py-2">
                                            {genderData.map((g, i) => {
                                                const total = genderData.reduce((a, d) => a + d.value, 0);
                                                const pct = total > 0 ? Math.round((g.value / total) * 100) : 0;
                                                return (
                                                    <div key={g.name} className="text-center">
                                                        <div className="text-3xl font-black" style={{ color: i === 0 ? '#3b82f6' : '#ec4899' }}>{pct}%</div>
                                                        <div className="text-xs font-bold text-slate-500 mt-1">{g.name} {g.value}명</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <PieChart margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                                            <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                                                <Cell fill="#3b82f6" /><Cell fill="#ec4899" />
                                            </Pie>
                                            <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="bottom" align="center" wrapperStyle={{ bottom: 0 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    )}
                                </ChartContainer>
                            </div>

                            <ChartContainer title="상위 기여 아동" icon={SvgIcons.crown} innerHeight="h-[300px]" mobileInnerHeight="h-[180px]" brandColor="#ec4899">
                                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                    <BarChart data={topChildren} margin={isMobile ? { top: 10, right: 10, left: -10, bottom: 0 } : { top: 30, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={(v: number) => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v.toLocaleString()} width={isMobile ? 35 : 60} />
                                        <RechartsTooltip {...tooltipProps} formatter={(val: any) => [`₩${val?.toLocaleString?.() ?? 0}`, '기여 매출']} />
                                        <Bar dataKey="value" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={isMobile ? 20 : 36}>
                                            {!isMobile && <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: '#64748b', fontSize: 12 }} formatter={(v: any) => `₩${Number(v)?.toLocaleString?.()}`} />}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>)}

                    {/* ───── 서브탭 3: 운영 현황 ───── */}
                    {opsPage === 2 && (
                        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            {/* ✨ [신규] 일지 미작성 알림 + 출석률 통계 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                {/* 일지 미작성 알림 */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[36px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                                    <div className="flex items-center justify-between mb-3 md:mb-6">
                                        <h3 className="font-bold text-sm md:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 md:gap-3">
                                            {SvgIcons.clipboardCheck("w-4 h-4 md:w-5 md:h-5 text-rose-500")}
                                            일지 미작성 현황
                                        </h3>
                                        {missingNoteTotal > 0 ? (
                                            <span className="px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-black animate-pulse">
                                                {missingNoteTotal}건 미작성
                                            </span>
                                        ) : (
                                            <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-black">
                                                ✨ 모두 작성 완료
                                            </span>
                                        )}
                                    </div>
                                    {missingNotes.length > 0 ? (
                                        <div className="space-y-2 md:space-y-3">
                                            {(isMobile && !showAllNotes ? missingNotes.slice(0, 3) : missingNotes).map((item) => (
                                                <div key={item.therapist} className="flex items-center gap-2 md:gap-4 p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                    <div className="flex-1">
                                                        <p className="font-black text-slate-900 dark:text-white text-sm">{item.therapist}</p>
                                                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                                            완료 {item.total}회기 중 {item.total - item.count}건 작성
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        {item.count > 0 ? (
                                                            <span className="text-2xl font-black text-rose-500">{item.count}</span>
                                                        ) : (
                                                            <span className="text-sm font-black text-emerald-500">✓ 완료</span>
                                                        )}
                                                    </div>
                                                    {/* 작성률 바 */}
                                                    <div className="w-20">
                                                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${item.count === 0 ? 'bg-emerald-500' : item.count <= 2 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${item.total > 0 ? ((item.total - item.count) / item.total) * 100 : 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {isMobile && missingNotes.length > 3 && !showAllNotes && (
                                                <button onClick={() => setShowAllNotes(true)} className="w-full py-2 text-xs font-bold text-indigo-500">
                                                    +{missingNotes.length - 3}명 더보기
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <p className="font-bold">완료된 수업이 없습니다</p>
                                        </div>
                                    )}
                                </div>

                                {/* 출석률 통계 */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[36px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                                    <div className="flex items-center justify-between mb-3 md:mb-6">
                                        <h3 className="font-bold text-sm md:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 md:gap-3">
                                            {SvgIcons.calendar("w-4 h-4 md:w-5 md:h-5 text-blue-500")}
                                            주차별 출석률
                                        </h3>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className={`text-xl md:text-3xl font-black ${overallAttendance >= 90 ? 'text-emerald-500' : overallAttendance >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {overallAttendance}%
                                            </span>
                                            <span className="text-xs text-slate-400 font-bold">월간 출석률</span>
                                        </div>
                                    </div>
                                    {attendanceData.length > 0 ? (
                                        <div className="h-[200px] md:h-[280px]">
                                            <SafeChart>
                                                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                                    <ComposedChart data={attendanceData} margin={isMobile ? { top: 5, right: 10, left: -15, bottom: 0 } : { top: 10, right: 30, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12, fontWeight: 'bold' }} />
                                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 60} />
                                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 35 : 60} />
                                                        <RechartsTooltip {...tooltipProps} />
                                                        {!isMobile && <Legend verticalAlign="top" align="right" wrapperStyle={{ top: -5 }} />}
                                                        <Bar yAxisId="left" dataKey="completed" name="출석" fill="#10b981" barSize={isMobile ? 16 : 28} radius={[6, 6, 0, 0]} />
                                                        <Bar yAxisId="left" dataKey="cancelled" name="취소" fill="#ef4444" barSize={isMobile ? 16 : 28} radius={[6, 6, 0, 0]} />
                                                        <Line yAxisId="right" type="monotone" dataKey="rate" name="출석률(%)" stroke="#3b82f6" strokeWidth={isMobile ? 2 : 3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: isMobile ? 3 : 5 }} connectNulls={false} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </SafeChart>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <p className="font-bold">수업 데이터가 없습니다</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ✨ [#3] Channel Conversion Rate Analysis */}
                            <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left mt-4 md:mt-8">
                                <div className="flex flex-col md:flex-row justify-between items-start mb-3 md:mb-6">
                                    <div>
                                        <h3 className="font-bold text-sm md:text-xl text-slate-900 dark:text-slate-100 mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
                                            {SvgIcons.trendingUp("w-4 h-4 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400")}
                                            채널별 유입 및 성과 분석
                                        </h3>
                                        <p className="hidden md:block text-sm text-slate-500 dark:text-slate-400">마케팅 채널별 유입 규모와 실제 상담 예약 전환 성과</p>
                                    </div>
                                </div>

                                {channelConversionData.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                        {/* Chart 1: Conversion Rate (Main) */}
                                        <div className="h-[280px] md:h-[400px]">
                                            <h4 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 md:mb-4">채널별 상담 예약 추이 및 전환율</h4>
                                            <SafeChart>
                                                <ResponsiveContainer width="100%" height="90%" debounce={100}>
                                                    <ComposedChart data={channelConversionData} margin={isMobile ? { top: 10, right: 10, left: -10, bottom: 40 } : { top: 20, right: 30, left: 20, bottom: 60 }}>
                                                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: isMobile ? 9 : 11, fontWeight: 'bold' }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={isMobile ? 50 : 80}
                                                        />
                                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 60} />
                                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 35 : 60} />
                                                        <RechartsTooltip {...tooltipProps} />
                                                        {!isMobile && <Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />}
                                                        <Bar yAxisId="left" dataKey="total" name="상담 문의" fill="#6366f1" barSize={isMobile ? 16 : 35} radius={[6, 6, 0, 0]} />
                                                        <Bar yAxisId="left" dataKey="converted" name="예약 확정" fill="#10b981" barSize={isMobile ? 16 : 35} radius={[6, 6, 0, 0]} />
                                                        <Line yAxisId="right" type="monotone" dataKey="rate" name="예약 전환율(%)" stroke="#f59e0b" strokeWidth={isMobile ? 2 : 4} dot={{ fill: '#f59e0b', strokeWidth: 2, r: isMobile ? 4 : 6 }} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </SafeChart>
                                        </div>

                                        {/* Right Column: Volume Chart + Stats */}
                                        <div className="space-y-4 md:space-y-8">
                                            {/* Chart 2: Inquiry Volume (New) */}
                                            {isMobile ? (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">채널별 유입 비중</h4>
                                                    <MobileBarList data={channelConversionData.map(d => ({ name: d.name, value: d.total }))} colors={channelConversionData.map(d => d.color)} />
                                                </div>
                                            ) : (
                                            <div className="h-[250px]">
                                                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">채널별 유입 비중 분석 (Inflow)</h4>
                                                <SafeChart>
                                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                                        <PieChart>
                                                            <Pie
                                                                data={channelConversionData}
                                                                dataKey="total"
                                                                nameKey="name"
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={45}
                                                                outerRadius={75}
                                                                paddingAngle={0}
                                                                stroke="none"
                                                                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                                                            >
                                                                {channelConversionData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip
                                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                                itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </SafeChart>
                                            </div>
                                            )}

                                            {/* Stats Cards (Scrollable if too many) */}
                                            <div className="space-y-2 md:space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {channelConversionData.map((channel, idx) => (
                                                    <div key={channel.name} className="flex items-center gap-2 md:gap-4 p-2.5 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                                                        <div
                                                            className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white text-[10px] md:text-sm font-black shadow-md shrink-0"
                                                            style={{ backgroundColor: channel.color }}
                                                        >
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate">{channel.name}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                                                                    문의 <span className="font-bold text-slate-700 dark:text-slate-300">{channel.total}건</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-300">|</span>
                                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                                                    확정 {channel.converted}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`px-3 py-1.5 rounded-lg font-black text-sm shrink-0 ${channel.rate >= 50 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' :
                                                            channel.rate >= 25 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                                                                'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                            }`}>
                                                            {channel.rate ?? 0}%
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                                        <p className="font-bold text-lg">상담 예약 데이터가 없습니다</p>
                                        <p className="text-sm mt-1">문의가 접수되면 채널별 현황이 표시됩니다</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left mt-4 md:mt-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-6 gap-2 md:gap-4">
                                    <div>
                                        <h3 className="font-bold text-sm md:text-xl text-slate-900 dark:text-slate-100 mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
                                            <svg className="w-4 h-4 md:w-6 md:h-6 text-amber-500" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" />
                                                <path d="M12 6v6l4 2" stroke="currentColor" />
                                            </svg>
                                            시간대별 문의 분석
                                        </h3>
                                        <p className="hidden md:block text-sm text-slate-500 dark:text-slate-400">부모님들이 언제 가장 많이 문의하는지 파악하세요</p>
                                    </div>
                                    <div className="flex gap-2 md:gap-4 flex-wrap">
                                        {avgInquiryTime && (
                                            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 border border-amber-100 dark:border-amber-800/50">
                                                <p className="text-[9px] md:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">평균 문의 시간</p>
                                                <p className="text-lg md:text-2xl font-black text-amber-700 dark:text-amber-300">{avgInquiryTime}</p>
                                            </div>
                                        )}
                                        {inquiryHourData.some(d => d.count > 0) && (
                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 border border-indigo-100 dark:border-indigo-800/50">
                                                <p className="text-[9px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">최다 문의 시간</p>
                                                <p className="text-lg md:text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                                    {(() => {
                                                        const peak = inquiryHourData.reduce((max, d) => d.count > max.count ? d : max, inquiryHourData[0]);
                                                        return `${peak.hour} (${peak.count}건)`;
                                                    })()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {inquiryHourData.some(d => d.count > 0) ? (
                                    <div className="h-[200px] md:h-[280px]">
                                        <SafeChart>
                                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                                <BarChart data={inquiryHourData} margin={isMobile ? { top: 5, right: 5, left: -15, bottom: 5 } : { top: 10, right: 10, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                                    <XAxis
                                                        dataKey="hour"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 11, fontWeight: 'bold' }}
                                                        interval={isMobile ? 2 : 1}
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} allowDecimals={false} width={isMobile ? 25 : 60} />
                                                    <RechartsTooltip
                                                        {...tooltipProps}
                                                        formatter={(value: any, _name: any, props: any) => {
                                                            return [`${value}건`, `${props.payload.hour} (${props.payload.label})`];
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        name="문의 수"
                                                        radius={[6, 6, 0, 0]}
                                                        barSize={isMobile ? 10 : 16}
                                                    >
                                                        {inquiryHourData.map((entry, index) => {
                                                            const maxCount = Math.max(...inquiryHourData.map(d => d.count));
                                                            const intensity = maxCount > 0 ? entry.count / maxCount : 0;
                                                            const color = entry.count === 0
                                                                ? (isDark ? '#1e293b' : '#f1f5f9')
                                                                : `hsl(${35 - intensity * 20}, ${70 + intensity * 20}%, ${isDark ? 35 + intensity * 20 : 60 - intensity * 25}%)`;
                                                            return <Cell key={index} fill={color} />;
                                                        })}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </SafeChart>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                                        <p className="font-bold text-lg">문의 데이터가 없습니다</p>
                                        <p className="text-sm mt-1">상담 문의가 접수되면 시간대별 분포가 표시됩니다</p>
                                    </div>
                                )}

                                {/* 시간대 요약 */}
                                {inquiryHourData.some(d => d.count > 0) && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                                        {[
                                            { label: '오전 (6-12시)', range: [6, 11], emoji: '🌅', color: 'amber' },
                                            { label: '오후 (12-18시)', range: [12, 17], emoji: '☀️', color: 'orange' },
                                            { label: '저녁 (18-22시)', range: [18, 21], emoji: '🌙', color: 'indigo' },
                                            { label: '야간/새벽', range: [22, 5], emoji: '🌌', color: 'slate' },
                                        ].map((slot, idx) => {
                                            const count = inquiryHourData.filter((_, i) => {
                                                if (slot.range[0] <= slot.range[1]) return i >= slot.range[0] && i <= slot.range[1];
                                                return i >= slot.range[0] || i <= slot.range[1];
                                            }).reduce((acc, d) => acc + d.count, 0);
                                            const total = inquiryHourData.reduce((acc, d) => acc + d.count, 0);
                                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                            return (
                                                <div key={idx} className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">{slot.emoji}</span>
                                                        <span className={`text-[11px] font-black ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{slot.label}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}건</span>
                                                        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>)}
                </div>
            )}

            {slide === 1 && (
                <div ref={marketingRef} className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-900 rounded-2xl md:rounded-[40px] p-4 md:p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden text-left gap-4">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="relative z-10 space-y-3 md:space-y-4">
                            <div>
                                <h3 className="text-lg md:text-3xl font-black mb-1 md:mb-2 flex items-center gap-2 md:gap-3 flex-wrap">월간 채널 유입: {totalInflow.toLocaleString()} 건</h3>
                                <p className="text-indigo-200 font-bold text-sm md:text-lg underline underline-offset-8 decoration-yellow-400">최고 전환 채널: {bestChannel.name}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 md:gap-8 pt-3 md:pt-6 border-t border-white/10">
                                <div>
                                    <span className="text-[9px] md:text-[10px] font-black opacity-50 uppercase tracking-widest block mb-1">Lead Velocity</span>
                                    <span className="text-xl md:text-2xl font-black text-emerald-400">{avgLeadTime}일</span>
                                </div>
                                <div>
                                    <span className="text-[9px] md:text-[10px] font-black opacity-50 uppercase tracking-widest block mb-1">Active Campaigns</span>
                                    <span className="text-xl md:text-2xl font-black text-amber-400">{campaignData.length}개</span>
                                </div>
                                <div>
                                    <span className="text-[9px] md:text-[10px] font-black opacity-50 uppercase tracking-widest block mb-1">Peak Time</span>
                                    <span className="text-xl md:text-2xl font-black text-violet-400">{peakTimeLabel || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] md:text-[10px] font-black opacity-50 uppercase tracking-widest block mb-1">Device</span>
                                    <span className="flex items-center gap-0.5 text-lg md:text-2xl font-black leading-none">
                                        <svg className="w-4 h-4 text-pink-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" /></svg>
                                        <span className="text-pink-400">{mobileRatio}%</span>
                                        <span className="text-white/30 mx-1">/</span>
                                        <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                        <span className="text-blue-400">{100 - mobileRatio}%</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* ✨ 전월 대비 성장률 카드 */}
                        <div className="hidden lg:flex relative z-10 flex-col items-center justify-center bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 min-w-[200px]">
                            {prevMonthInflow !== null ? (() => {
                                const growth = prevMonthInflow > 0
                                    ? Math.round(((totalInflow - prevMonthInflow) / prevMonthInflow) * 100)
                                    : totalInflow > 0 ? 100 : 0;
                                const isUp = growth > 0;
                                const isDown = growth < 0;
                                return (
                                    <>
                                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-3">전월 대비</span>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className={`w-7 h-7 ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-white/40'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                {isUp ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></> 
                                                : isDown ? <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>
                                                : <line x1="3" y1="12" x2="21" y2="12" />}
                                            </svg>
                                            <span className={`text-3xl font-black ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-white/40'}`}>
                                                {isUp ? '+' : ''}{growth}%
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white/40">
                                            {prevMonthInflow}건 → {totalInflow}건
                                        </span>
                                    </>
                                );
                            })() : (
                                <span className="text-xs font-bold text-white/30">전월 데이터 없음</span>
                            )}
                        </div>
                    </div>

                    {/* ═══════ 📊 섹션 1: 전체 유입 분석 ═══════ */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
                            <span className="text-base">📊</span>
                            <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">전체 유입 분석</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">자연 검색 + 광고 + SNS 등 모든 방문 기록 기반</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    {isSuperAdmin && (
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                            <h3 className="font-bold text-sm md:text-xl text-slate-900 dark:text-slate-100 mb-3 md:mb-6 flex items-center gap-2 md:gap-3">
                                {SvgIcons.share("w-4 h-4 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400")}
                                채널별 유입 상세 데이터
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                                {marketingData.map((item, idx) => (
                                    <ChannelGridCard key={idx} channel={item} totalInflow={totalInflow} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ✨ [Phase 2] 시간대별 유입 히트맵 */}
                    <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                        <h3 className="font-bold text-sm md:text-xl text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2 md:gap-3">
                            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                {SvgIcons.calendar("w-4 h-4 md:w-5 md:h-5")}
                            </div>
                            시간대별 유입 히트맵
                            {peakTimeLabel && <span className="text-xs font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/40 px-2 py-0.5 rounded-lg ml-auto">🔥 피크: {peakTimeLabel}</span>}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 md:mb-6">요일 × 시간대별 방문 집중도 — 광고 입찰 시간대 최적화에 활용하세요</p>

                        {heatmapData.some(d => d.count > 0) ? (
                            <div className="overflow-x-auto">
                                <div className="min-w-[500px]">
                                    {/* 시간 헤더 */}
                                    <div className="flex items-center gap-0.5 mb-1">
                                        <div className="w-10 shrink-0" />
                                        {Array.from({ length: 24 }, (_, h) => (
                                            <div key={h} className="flex-1 text-center text-[8px] md:text-[9px] font-bold text-slate-400">
                                                {h % 3 === 0 ? `${h}시` : ''}
                                            </div>
                                        ))}
                                    </div>
                                    {/* 요일별 행 (월~일 순서) */}
                                    {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                                        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                                        const maxCount = Math.max(...heatmapData.map(d => d.count), 1);
                                        return (
                                            <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
                                                <div className="w-10 shrink-0 text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400">
                                                    {dayNames[dayIdx]}
                                                </div>
                                                {Array.from({ length: 24 }, (_, h) => {
                                                    const entry = heatmapData.find(d => d.day === dayIdx && d.hour === h);
                                                    const count = entry?.count || 0;
                                                    const intensity = count / maxCount;
                                                    const bgColor = count === 0
                                                        ? (isDark ? '#1e293b' : '#f1f5f9')
                                                        : `hsl(260, ${50 + intensity * 40}%, ${isDark ? 25 + intensity * 30 : 80 - intensity * 45}%)`;
                                                    return (
                                                        <div
                                                            key={h}
                                                            className="flex-1 aspect-square rounded-[3px] md:rounded transition-colors cursor-default group/cell relative"
                                                            style={{ backgroundColor: bgColor, minHeight: '12px' }}
                                                            title={`${dayNames[dayIdx]} ${h}시: ${count}건`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    {/* 범례 */}
                                    <div className="flex items-center justify-end gap-1.5 mt-3">
                                        <span className="text-[9px] font-bold text-slate-400">적음</span>
                                        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                                            <div key={i} className="w-3 h-3 rounded-[2px]" style={{
                                                backgroundColor: intensity === 0
                                                    ? (isDark ? '#1e293b' : '#f1f5f9')
                                                    : `hsl(260, ${50 + intensity * 40}%, ${isDark ? 25 + intensity * 30 : 80 - intensity * 45}%)`
                                            }} />
                                        ))}
                                        <span className="text-[9px] font-bold text-slate-400">많음</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <p className="font-bold">유입 데이터가 없습니다</p>
                                <p className="text-xs mt-1">방문이 쌓이면 자동으로 히트맵이 표시됩니다</p>
                            </div>
                        )}
                    </div>

                    {/* ✨ [Phase 2] 일별 트렌드 + 인기 페이지 (2열) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                        {/* 일별 유입 트렌드 */}
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                            <h3 className="font-bold text-sm md:text-xl text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                                    {SvgIcons.trendingUp("w-4 h-4 md:w-5 md:h-5")}
                                </div>
                                일별 유입 트렌드
                            </h3>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 md:mb-6">광고 집행 전후 효과를 일별로 비교하세요</p>

                            {dailyTrendData.length > 0 ? (
                                <div className="h-[220px] md:h-[280px]">
                                    <SafeChart>
                                        <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                            <AreaChart data={dailyTrendData} margin={isMobile ? { top: 10, right: 5, left: -15, bottom: 0 } : { top: 10, right: 20, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorDailyTrend" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 11, fontWeight: 'bold' }} interval={isMobile ? 6 : 2} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} width={isMobile ? 30 : 45} tickFormatter={(v: number) => `${v}건`} />
                                                <RechartsTooltip {...tooltipProps} formatter={(val: any) => [`${val}건`, '유입']} />
                                                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={isMobile ? 2 : 3} fillOpacity={1} fill="url(#colorDailyTrend)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </SafeChart>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <p className="font-bold">유입 데이터가 없습니다</p>
                                </div>
                            )}
                        </div>

                        {/* 인기 랜딩 페이지 TOP 5 */}
                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                            <h3 className="font-bold text-sm md:text-lg text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                    {SvgIcons.bookOpen("w-4 h-4 md:w-5 md:h-5")}
                                </div>
                                인기 랜딩 페이지
                            </h3>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 md:mb-5">어떤 페이지로 유입이 집중되는지 확인</p>

                            {landingPageData.length > 0 ? (
                                <div className="space-y-2.5">
                                    {landingPageData.map((item, idx) => {
                                        const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];
                                        const color = colors[idx % colors.length];
                                        const shortPath = item.name.replace(/^\/centers\/[^/]+/, '').replace(/^\//, '') || '홈';
                                        const displayPath = shortPath === '' ? '홈' :
                                            shortPath.replace('programs', '프로그램').replace('therapists', '치료사').replace('about', '소개').replace('contact', '문의').replace('blog', '블로그');
                                        return (
                                            <div key={item.name} className="group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20', color }}>{idx + 1}</span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={item.name}>{displayPath}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">{item.pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, backgroundColor: color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <p className="font-bold text-sm">데이터 없음</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══════ 🎯 섹션 2: 광고 캠페인 전용 ═══════ */}
                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
                            <span className="text-base">🎯</span>
                            <span className="text-sm font-black text-amber-700 dark:text-amber-300">광고 캠페인 전용</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">gclid · n_media · fbclid 자동 감지 클릭만 집계</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    <div>
                        {/* 캠페인 성과 */}
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                            <h3 className="font-bold text-base md:text-xl text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2 md:gap-3">
                                {SvgIcons.trendingUp("w-5 h-5 md:w-6 md:h-6 text-amber-500")}
                                캠페인별 클릭 수
                            </h3>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-5">광고 플랫폼 자동 태그(gclid/n_media/fbclid) 기반 — 실제 광고 클릭만 집계</p>

                            {campaignData.length > 0 ? (
                                <div className="space-y-3">
                                    {campaignData.map((item, idx) => {
                                        const total = campaignData.reduce((s, c) => s + c.value, 0);
                                        const pct = total > 0 ? Math.round(item.value / total * 100) : 0;
                                        const colors = ['#FBBC04', '#2DB400', '#1877F2', '#E1306C', '#FF0000', '#6366f1'];
                                        const color = colors[idx % colors.length];
                                        const displayName = item.name
                                            .replace('google_ads_auto', 'Google 광고')
                                            .replace('naver_ads_auto', 'Naver 광고')
                                            .replace('facebook_ads_auto', 'Facebook 광고');
                                        return (
                                            <div key={item.name} className="group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{displayName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}건</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-400">총 광고 클릭</span>
                                        <span className="text-lg font-black text-amber-500">{campaignData.reduce((s, c) => s + c.value, 0)}건</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[120px] flex flex-col items-center justify-center space-y-2">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">아직 광고 클릭 데이터가 없습니다</p>
                                    <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center leading-relaxed">Google·Naver·Facebook 광고 클릭이 자동으로 감지됩니다</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ✨ [Mobile] 하단 고정 서브탭 네비게이션 */}
            {slide === 0 && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 px-4 py-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 4px)' }}>
                    <div className="flex gap-2 justify-center">
                        {['매출·수업', '아동', '운영'].map((label, i) => (
                            <button
                                key={i}
                                onClick={() => setOpsPage(i)}
                                className={cn(
                                    'flex-1 py-2.5 rounded-xl text-xs font-black transition-all',
                                    opsPage === i
                                        ? 'text-white shadow-md'
                                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                                )}
                                style={opsPage === i ? { backgroundColor: BRAND_COLOR } : undefined}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
