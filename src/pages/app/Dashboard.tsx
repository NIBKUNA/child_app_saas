
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
import { useNavigate } from 'react-router-dom'; // ✨ Import useNavigate
import { useAuth } from '@/contexts/AuthContext'; // ✨ Import useAuth
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
}

interface DashboardChild {
    id: string;
    name: string;
    gender: string | null;
    birth_date: string | null;
    created_at: string;
}

interface DashboardPayment {
    amount: number;
    child_id: string | null;
    paid_at: string | null;
}

interface SiteVisit {
    source_category: string | null;
    visited_at: string | null;
    referrer_url: string | null;
    page_url: string | null;
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
    <div className={`p-6 rounded-3xl border ${border} ${bg} relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/30 dark:from-white/5 dark:to-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex justify-between items-start mb-6">
            <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 tracking-wide">{title}</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl bg-white/90 dark:bg-slate-800 ${color} shadow-sm border border-slate-100/50 dark:border-slate-700 backdrop-blur-sm`}>
                {icon("w-7 h-7")}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100/80 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                {trendUp ? SvgIcons.arrowUp("w-3.5 h-3.5 mr-1") : SvgIcons.arrowDown("w-3.5 h-3.5 mr-1")}{trend}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">전월 대비</span>
        </div>
    </div>
);



const ChartContainer = ({ title, icon, children, className = "", innerHeight = "h-[320px]", brandColor = '#4f46e5' }: { title: string; icon: any; children: React.ReactNode; className?: string; innerHeight?: string; brandColor?: string }) => (
    <div className={`bg-white dark:bg-slate-900 p-8 rounded-[36px] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden ${className} group hover:shadow-2xl transition-all duration-500 text-left`}>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3 relative z-10 text-left">
            <div
                className="p-2 rounded-xl transition-colors"
                style={{ backgroundColor: brandColor + '10', color: brandColor }}
            >
                {icon && icon("w-5 h-5")}
            </div>
            {title}
        </h3>
        <div className={`w-full relative overflow-hidden ${innerHeight}`}>
            {children}
        </div>
    </div>
);

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

export function Dashboard() {
    const { isSuperAdmin, theme } = useTheme();
    const isDark = theme === 'dark';
    const tooltipProps = getTooltipProps(isDark);
    const operationsRef = useRef<HTMLDivElement>(null);
    const marketingRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [slide, setSlide] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [kpi, setKpi] = useState({ revenue: 0, active: 0, sessions: 0, new: 0 });
    const { center } = useCenter();
    const { role } = useAuth(); // ✨ Role based access control
    const navigate = useNavigate(); // ✨ Navigation

    // ✨ [Security] Access check for specific roles if needed
    useEffect(() => {
        // Redirection logic removed for consolidated roles
    }, [role, navigate]);

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

            // ✨ [SECURITY] Enforce Center ID Filter using Inner Join on Children
            const { data: allSchedules } = await supabase
                .from('schedules')
                .select(`id, start_time, status, child_id, service_type, children!inner(id, name, gender, birth_date, center_id), therapists (name, session_price_weekday)`)
                .eq('children.center_id', center.id)
                .order('start_time', { ascending: true });

            // ✨ [SECURITY] Fetch Children only for this center
            const { data: existingChildren } = await supabase
                .from('children')
                .select('id, name, gender, birth_date, created_at')
                .eq('center_id', center.id); // 🔒 Security Filter

            const validChildIds = new Set((existingChildren as DashboardChild[])?.map(c => c.id) || []);

            // ✨ [FIX] Build set of child_ids that have completed schedules
            const childrenWithCompletedSchedules = new Set<string>();
            (allSchedules as DashboardSchedule[])?.forEach(s => {
                if (s.status === 'completed' && s.child_id) {
                    childrenWithCompletedSchedules.add(s.child_id);
                }
            });

            const { data: allPayments } = await supabase
                .from('payments')
                .select('amount, child_id, paid_at')
                .in('child_id', [...validChildIds]); // 🔒 Security Filter

            // Calculation Maps
            const monthlyRevMap: Record<string, number> = {};
            monthsToShow.forEach(m => monthlyRevMap[m] = 0);

            const statusMap = { completed: 0, cancelled: 0, scheduled: 0 };
            const therapistRevMap: Record<string, number> = {};
            const progCountMap: Record<string, number> = {};
            const ageCountMap: Record<string, number> = {};
            let mCount = 0, fCount = 0;
            const childContribMap: Record<string, number> = {};

            // Payment Processing (Revenue)
            (allPayments as DashboardPayment[])?.forEach(p => {
                if (p.paid_at && p.child_id && validChildIds.has(p.child_id) && childrenWithCompletedSchedules.has(p.child_id)) {
                    const m = (p.paid_at as string).slice(0, 7);
                    if (monthlyRevMap[m] !== undefined) monthlyRevMap[m] += (p.amount || 0);
                }
            });

            // Schedule Processing
            (allSchedules as DashboardSchedule[])?.forEach(s => {
                if (s.start_time && s.start_time.startsWith(selectedMonth)) {
                    // Status
                    if (s.status === 'completed') statusMap.completed++;
                    else if (s.status === 'canceled' || s.status === 'cancelled') statusMap.cancelled++;
                    else statusMap.scheduled++;

                    if (s.status === 'completed') {
                        // Therapist
                        const tName = s.therapists?.name || '미배정';
                        // ✨ [Dynamic] Use therapist's default price, or fallback if not set
                        const sessionPrice = s.therapists?.session_price_weekday || 60000;
                        therapistRevMap[tName] = (therapistRevMap[tName] || 0) + sessionPrice;

                        // Program / Service Type
                        const pName = s.service_type || '치료 세션';
                        progCountMap[pName] = (progCountMap[pName] || 0) + 1;

                        // Child Contribution
                        const cName = s.children?.name || '알수없음';
                        childContribMap[cName] = (childContribMap[cName] || 0) + sessionPrice;
                    }
                }
            });

            // Demographics (from existingChildren)
            (existingChildren as DashboardChild[])?.forEach(c => {
                // ✨ [FIX] Match actual DB values: '남' or '여' (not '남아'/'여아')
                if (c.gender === '남' || c.gender === '남아') mCount++;
                else if (c.gender === '여' || c.gender === '여아') fCount++;
                // else: unknown gender, skip count

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

            // ✨ [TRAFFIC ANALYSIS] Fetch site_visits for overall visitor traffic source
            const lastDayOfMonth = new Date(selYear, selMonth, 0).getDate(); // Get last day of selected month
            const { data: siteVisits } = await supabase
                .from('site_visits')
                .select('source_category, visited_at, referrer_url, page_url') // ✨ Added page_url
                .eq('center_id', center.id) // 🔒 Security Filter
                .gte('visited_at', selectedMonth + '-01')
                .lte('visited_at', selectedMonth + '-' + String(lastDayOfMonth).padStart(2, '0'));

            // Process site_visits for traffic source statistics
            // ✨ SNS 세분화: 개별 플랫폼으로 초기화
            const trafficMap: Record<string, number> = {
                'Naver Blog': 0, 'Naver Place': 0, 'Google Search': 0,
                'Instagram': 0, 'Youtube': 0, 'Facebook': 0, 'KakaoTalk': 0,
                'Referral': 0, 'Signage': 0, 'Flyer': 0, 'Hospital': 0, 'Partnership': 0,
                'Direct': 0, 'Others': 0
            };
            const blogTrafficMap: Record<string, Record<string, number>> = {}; // ✨ Blog Traffic Aggregation

            siteVisits?.forEach((v: SiteVisit) => {
                let cat = v.source_category || 'Others';

                // ✨ [Enhancement] Break down 'Others' using referrer domain
                if (v.referrer_url) {
                    try {
                        const url = new URL(v.referrer_url);

                        const hostname = url.hostname.replace('www.', '');

                        // 1. Exclude Dev/Infra Domains & Internal
                        if (hostname.includes('localhost') ||
                            hostname.includes('127.0.0.1') ||
                            hostname.includes('vercel.app') ||
                            hostname.includes('vercel.com') ||
                            hostname.includes('brainlitix.net')) {
                            return; // Skip this visit
                        }

                        // 2. Normalize Platform Domains
                        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                            cat = 'Youtube';
                        } else if (trafficMap[hostname] !== undefined || cat === 'Others') {
                            if (cat === 'Others') {
                                cat = hostname;
                            }
                        }
                    } catch (e) {
                        // Invalid URL
                    }
                }

                // Initialize if new domain
                if (trafficMap[cat] === undefined) trafficMap[cat] = 0;

                if (trafficMap[cat] !== undefined) {
                    trafficMap[cat] += 1;
                } else {
                    trafficMap['Others'] += 1;
                }

                // ✨ [Blog Analytics] Aggregate traffic per blog post (Exclude Direct entries with NO info)
                const isBlog = v.page_url?.includes('/blog/') ?? false;
                const hasInfo = cat !== 'Direct' || v.referrer_url;

                if (isBlog && hasInfo) {
                    try {
                        const parts = v.page_url!.split('/blog/');
                        if (parts.length > 1) {
                            const slug = parts[1].split('?')[0];
                            if (slug) {
                                if (!blogTrafficMap[slug]) blogTrafficMap[slug] = {};
                                // Use the categorized source 'cat' which is already normalized
                                if (!blogTrafficMap[slug][cat]) blogTrafficMap[slug][cat] = 0;
                                blogTrafficMap[slug][cat]++;
                            }
                        }
                    } catch (e) {
                        // Ignore parse error
                    }
                }
            });

            // ✨ SNS 세분화: 개별 플랫폼 색상 매핑
            const channelColors: Record<string, string> = {
                'Naver Blog': '#03C75A',
                'Naver Place': '#00d2d2',
                'Google Search': '#4285F4',
                'Youtube': '#FF0000',
                'Instagram': '#E1306C',
                'Facebook': '#1877F2',
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
                .filter(([name]) => name !== 'Direct') // ✨ [MOD] 'Direct' 제외
                .filter(([_, value]) => value > 0) // ✨ [MOD] Hide empty channels to clean up UI
                .map(([name, value], idx) => ({
                    cat: 'CHANNEL',
                    name,
                    value,
                    // Use predefined color or pick from palette for dynamic domains
                    color: channelColors[name] || COLORS[idx % COLORS.length]
                }))
                .sort((a, b) => b.value - a.value);

            setMarketingData(marketingArr);

            // ✨ [MOD] Total inflow based ONLY on displayed channels (Direct excluded)
            const totalDisplayedVisits = marketingArr.reduce((acc, curr) => acc + curr.value, 0);
            setTotalInflow(totalDisplayedVisits);

            if (marketingArr.length > 0) setBestChannel(marketingArr[0]);

            // ✨ [LEADS CONVERSION ANALYSIS] Fetch LEADS data (from 'consultations' table)
            const { data: allLeads } = await supabase
                .from('consultations')
                .select('id, marketing_source, inflow_source, status, created_at, child_id')
                .eq('center_id', center.id)
                .gte('created_at', monthsToShow[0] + '-01')
                .lte('created_at', selectedMonth + '-' + String(lastDayOfMonth).padStart(2, '0'));

            // ✨ [HQ INTELLIGENCE] Lead Velocity & Campaign Deep Dive
            const monthlyLeadsMap: Record<string, { consults: number; converted: number }> = {};
            monthsToShow.forEach(m => monthlyLeadsMap[m] = { consults: 0, converted: 0 });

            const channelLeadsMap: Record<string, { total: number; converted: number }> = {};
            const campaignMap: Record<string, number> = {};
            let leadTimeTotal = 0;
            let leadTimeCount = 0;

            allLeads?.forEach((lead: DashboardLead) => {
                if (lead.created_at) {
                    const m = (lead.created_at as string).slice(0, 7);

                    // Monthly Trend Data
                    if (monthlyLeadsMap[m]) {
                        monthlyLeadsMap[m].consults++;
                        if (lead.child_id) monthlyLeadsMap[m].converted++;
                    }

                    // ✨ [Campaign Analytics] Extract Campaign Name if available
                    if (lead.marketing_source && lead.marketing_source.includes('Campaign: ')) {
                        const campMatch = lead.marketing_source.match(/Campaign: ([^/|]*)/);
                        if (campMatch && campMatch[1]) {
                            const campName = campMatch[1].trim();
                            campaignMap[campName] = (campaignMap[campName] || 0) + 1;
                        }
                    }

                    // ✨ [Lead Velocity] Calculate days from Lead to Consultation Schedule
                    // This requires finding a schedule for the same child_id or name
                    // (Simplified logic: time to first schedule after lead date)
                    if (lead.child_id && lead.created_at) {
                        const firstSchedule = (allSchedules as DashboardSchedule[])?.find(s =>
                            s.child_id === lead.child_id &&
                            new Date(s.start_time) > new Date(lead.created_at!)
                        );
                        if (firstSchedule) {
                            const diffDays = Math.ceil((new Date(firstSchedule.start_time).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays > 0 && diffDays < 100) { // Exclude outliers
                                leadTimeTotal += diffDays;
                                leadTimeCount++;
                            }
                        }
                    }

                    // ✨ [CHANNEL CONVERSION] Handle Formatted Strings (Extract Main Channel)
                    if (m === selectedMonth) {
                        let channel = lead.inflow_source || 'Direct';

                        // If marketing_source has standard formatting, extract main source
                        if (lead.marketing_source && lead.marketing_source.includes('Source: ')) {
                            const srcMatch = lead.marketing_source.match(/Source: ([^/|]*)/);
                            if (srcMatch && srcMatch[1]) channel = srcMatch[1].trim();
                        }

                        if (!channelLeadsMap[channel]) channelLeadsMap[channel] = { total: 0, converted: 0 };
                        channelLeadsMap[channel].total++;

                        // Converted = became a child or status confirmed
                        if (lead.child_id || lead.status === 'completed' || lead.status === 'converted') {
                            channelLeadsMap[channel].converted++;
                        }
                    }
                }
            });

            // Set HQ Lead Time
            setAvgLeadTime(leadTimeCount > 0 ? Math.round(leadTimeTotal / leadTimeCount) : 0);

            // Set Campaign Data
            const campArr = Object.entries(campaignMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);
            setCampaignData(campArr);

            // ✨ Set monthly conversion data for existing chart
            const conversionArr = monthsToShow.map(m => ({
                name: m.slice(5) + '월',
                consults: monthlyLeadsMap[m].consults,
                converted: monthlyLeadsMap[m].converted,
                rate: monthlyLeadsMap[m].consults > 0
                    ? Math.round((monthlyLeadsMap[m].converted / monthlyLeadsMap[m].consults) * 100)
                    : 0
            }));
            setConversionData(conversionArr);

            // ✨ Set channel conversion data for new chart
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

            // ✨ [NEW CHILDREN KPI] Count children registered in the selected month
            const newCount = (existingChildren as DashboardChild[])?.filter(c =>
                c.created_at && (c.created_at as string).startsWith(selectedMonth)
            ).length || 0;

            // Set KPI
            setKpi({
                revenue: monthlyRevMap[selectedMonth] || 0,
                active: existingChildren?.length || 0,
                sessions: statusMap.completed,
                new: newCount
            });

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, center]);

    return (
        <div ref={dashboardRef} className="p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Helmet>
                <title>인사이트 허브 - Zarada Admin</title>
            </Helmet>

            {isSuperAdmin && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 p-1 rounded-3xl mb-8 animate-in fade-in slide-in-from-top-4 border border-amber-200 dark:border-amber-800/50">
                    <div className="bg-white/60 dark:bg-slate-900/80 backdrop-blur-sm rounded-[28px] p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none animate-bounce-slow">
                                <Crown className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-amber-900 dark:text-yellow-300 flex items-center gap-2">
                                    관리자 전용 데이터 관리
                                    <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">SUPER ADMIN</span>
                                </h2>
                                <p className="text-sm font-medium text-amber-700 dark:text-yellow-400/80">아동, 수납, 수업 데이터를 Excel(CSV)로 추출할 수 있습니다</p>
                            </div>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={exportIntegratedReport}
                                disabled={exporting}
                                className="flex items-center gap-2 px-6 py-4 bg-emerald-600 dark:bg-emerald-500 text-white font-black text-sm rounded-2xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all disabled:opacity-50 gpu-accelerate shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30 transform hover:-translate-y-1 active:translate-y-0"
                            >
                                <FileSpreadsheet className="w-6 h-6" />
                                <span className="text-base">센터 통합 보고서 (Excel)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end flex-wrap gap-4">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight hero-text">지능형 센터 인사이트 허브</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">AI 기반 운영 & 마케팅 통합 분석 시스템</p>
                </div>
                <div className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button
                        onClick={() => setSlide(0)}
                        className={cn("px-6 py-3 rounded-2xl font-black transition-all gpu-accelerate", slide === 0 ? "text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
                        style={slide === 0 ? { backgroundColor: BRAND_COLOR } : undefined}
                    >
                        운영 지표
                    </button>
                    {isSuperAdmin && (
                        <button
                            onClick={() => setSlide(1)}
                            className={cn("px-6 py-3 rounded-2xl font-black transition-all gpu-accelerate", slide === 1 ? "text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
                            style={slide === 1 ? { backgroundColor: BRAND_COLOR } : undefined}
                        >
                            마케팅 지능
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="확정 매출" value={`₩${kpi.revenue.toLocaleString()}`} icon={SvgIcons.dollar} trend="확정" trendUp={true} color="text-blue-600 dark:text-blue-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="활성 아동" value={`${kpi.active}명`} icon={SvgIcons.users} trend="현재원" trendUp={true} color="text-indigo-600 dark:text-indigo-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="완료 수업" value={`${kpi.sessions}건`} icon={SvgIcons.calendar} trend="실적" trendUp={true} color="text-emerald-600 dark:text-emerald-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="신규 아동" value={`${kpi.new}명`} icon={SvgIcons.activity} trend="이번달" trendUp={kpi.new > 0} color="text-rose-600 dark:text-rose-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
            </div>

            {slide === 0 && (
                <div ref={operationsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <ChartContainer title="월별 누적 매출 추이" icon={SvgIcons.trendingUp} className="lg:col-span-2" innerHeight="h-[350px]" brandColor={BRAND_COLOR}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 80, right: 30, left: 20, bottom: 0 }}>
                                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.3} /><stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v} />
                                    <RechartsTooltip {...tooltipProps} formatter={(val: any) => [`₩${val?.toLocaleString?.() ?? 0}`, '매출']} />
                                    <Area type="monotone" dataKey="value" stroke={BRAND_COLOR} strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="수업 상태 점유율" icon={SvgIcons.pieChart} innerHeight="h-[350px]" brandColor={BRAND_COLOR}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80, right: 0, bottom: 0, left: 0 }}>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                                        {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>

                    <ChartContainer title="치료사별 매출 기여도" icon={SvgIcons.stethoscope} innerHeight="h-[250px]" brandColor={BRAND_COLOR}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={therapistData} layout="vertical" margin={{ top: 20, right: 50, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip formatter={(val: any) => [`${val?.toLocaleString?.() ?? 0}원`, '매출']} {...tooltipProps} />
                                <Bar dataKey="value" fill={BRAND_COLOR} radius={[0, 8, 8, 0]} barSize={32}>
                                    <LabelList dataKey="value" position="right" formatter={(v: any) => `₩${(v || 0).toLocaleString()}`} style={{ fontWeight: 'bold', fill: '#64748b' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title="상담 후 등록 전환율" icon={SvgIcons.activity} innerHeight="h-[450px]" brandColor={BRAND_COLOR}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={conversionData} margin={{ top: 80, right: 30, left: 20 }}>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" />
                                <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                <Bar yAxisId="left" dataKey="consults" name="상담 진행" fill="#e2e8f0" barSize={50} radius={[6, 6, 0, 0]} />
                                <Bar yAxisId="left" dataKey="converted" name="최종 등록" fill={BRAND_COLOR} barSize={50} radius={[6, 6, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="rate" name="전환율(%)" stroke="#f59e0b" strokeWidth={4} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ChartContainer title="프로그램별 점유율 (횟수)" icon={SvgIcons.clipboardCheck} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80, right: 0, bottom: 0, left: 0 }}>
                                    <Pie data={programData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none" label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}>
                                        {programData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="아동 연령별" icon={SvgIcons.users} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80, right: 0, bottom: 0, left: 0 }}>
                                    <Pie data={ageData} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                                        {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="성별 비율" icon={SvgIcons.users} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80, right: 0, bottom: 0, left: 0 }}>
                                    <Pie data={genderData} outerRadius={60} dataKey="value" stroke="none" label={({ name }: any) => name}>
                                        <Cell fill="#3b82f6" /><Cell fill="#ec4899" />
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="상위 기여 아동" icon={SvgIcons.crown} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topChildren} layout="vertical" margin={{ top: 80, right: 30, left: 10, bottom: 0 }}>
                                    <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} />
                                    <RechartsTooltip {...tooltipProps} /><Bar dataKey="value" fill="#ec4899" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>

                    {/* ✨ [#3] Channel Conversion Rate Analysis - MOVED FROM MARKETING TO OPERATIONS */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left mt-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
                                    {SvgIcons.trendingUp("w-6 h-6 text-emerald-600 dark:text-emerald-400")}
                                    채널별 유입 및 성과 분석
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">마케팅 채널별 유입 규모와 실제 상담 예약 전환 성과</p>
                            </div>
                        </div>

                        {channelConversionData.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Chart 1: Conversion Rate (Main) */}
                                <div className="h-[400px]">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">채널별 상담 예약 추이 및 전환율</h4>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <ComposedChart data={channelConversionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fontWeight: 'bold' }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                                            <RechartsTooltip {...tooltipProps} />
                                            <Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                            <Bar yAxisId="left" dataKey="total" name="상담 문의" fill="#6366f1" barSize={35} radius={[6, 6, 0, 0]} />
                                            <Bar yAxisId="left" dataKey="converted" name="예약 확정" fill="#10b981" barSize={35} radius={[6, 6, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="rate" name="예약 전환율(%)" stroke="#f59e0b" strokeWidth={4} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Right Column: Volume Chart + Stats */}
                                <div className="space-y-8">
                                    {/* Chart 2: Inquiry Volume (New) */}
                                    <div className="h-[250px]">
                                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">채널별 유입 비중 분석 (Inflow)</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={channelConversionData}
                                                    dataKey="total"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={75}
                                                    paddingAngle={5}
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
                                    </div>

                                    {/* Stats Cards (Scrollable if too many) */}
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {channelConversionData.map((channel, idx) => (
                                            <div key={channel.name} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md shrink-0"
                                                    style={{ backgroundColor: channel.color }}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{channel.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
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
                </div>
            )}

            {slide === 1 && (
                <div ref={marketingRef} className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl flex justify-between items-center relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="relative z-10 space-y-4">
                            <div>
                                <h3 className="text-3xl font-black mb-2 flex items-center gap-3">월간 채널 유입: {totalInflow.toLocaleString()} 건</h3>
                                <p className="text-indigo-200 font-bold text-lg underline underline-offset-8 decoration-yellow-400">최고 전환 채널: {bestChannel.name}</p>
                            </div>
                            <div className="flex gap-10 pt-6 border-t border-white/10">
                                <div className="group relative">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black opacity-50 uppercase tracking-widest mb-1.5 cursor-help">
                                        Lead Velocity
                                        <div className={cn("w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px] opacity-70")}>i</div>
                                    </span>
                                    <span className="text-3xl font-black text-emerald-400 leading-none">{avgLeadTime}일</span>
                                    {/* ✨ Tooltip Position Fixed: bottom-full to avoid clipping */}
                                    <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                                        <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
                                        <p className="text-[11px] text-emerald-400 font-black mb-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            리드 처리 속되 (민첩성)
                                        </p>
                                        <p className="text-[10px] text-slate-300 leading-relaxed font-bold">문의 접수부터 첫 방문까지의 평균 시간입니다. 고객의 관심이 높을 때 얼마나 빠르게 응대했는지를 나타내며, 본사의 운영 관리 효율을 상징합니다.</p>
                                    </div>
                                </div>
                                <div className="group relative">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black opacity-50 uppercase tracking-widest mb-1.5 cursor-help">
                                        Active Campaigns
                                        <div className={cn("w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px] opacity-70")}>i</div>
                                    </span>
                                    <span className="text-3xl font-black text-amber-400 leading-none">{campaignData.length}개</span>
                                    {/* ✨ Tooltip Position Fixed: bottom-full to avoid clipping */}
                                    <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                                        <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
                                        <p className="text-[11px] text-amber-400 font-black mb-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                            마케팅 캠페인 믹스
                                        </p>
                                        <p className="text-[10px] text-slate-300 leading-relaxed font-bold">현재 작동 중인 광고 프로모션의 개수입니다. 네이버 파워링크, 블로그 이벤트 등 활성화된 캠페인별 유입을 자동 추적합니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:block relative z-10 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 min-w-[280px]">
                            <span className="block text-xs font-black mb-1 opacity-60 uppercase tracking-widest">DOMINANT SOURCE</span>
                            <span className="block text-3xl font-black text-yellow-300">{bestChannel.name}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* ✨ [HQ] Deep Dive: Channel Breakdown (SUPER ADMIN ONLY) */}
                        {isSuperAdmin && (
                            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                                <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                                    {SvgIcons.share("w-6 h-6 text-indigo-600 dark:text-indigo-400")}
                                    채널별 유입 상세 데이터 (Intelligence)
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {marketingData.map((item, idx) => (
                                        <ChannelGridCard key={idx} channel={item} totalInflow={totalInflow} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 text-left">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
                                {SvgIcons.trendingUp("w-6 h-6 text-amber-500")}
                                캠페인 성과 믹스
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">진행 중인 광고 캠페인별 문의 기여도</p>

                            {campaignData.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={campaignData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12}>
                                                    <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                                💡 <span className="text-indigo-600 dark:text-indigo-400">캠페인 지능:</span> 수집된 UTM 파라미터를 기반으로 특정 홍보 이벤트의 문의 기여도를 추적합니다. '기타' 채널에서도 캠페인 태그가 있다면 이곳에 합산됩니다.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                        <svg className="w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path d="M9 12l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-bold italic">활성 캠페인 데이터 없음</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
