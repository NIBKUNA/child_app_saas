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
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import { generateIntegratedReport } from '@/utils/reportGenerator'; // ✨ Import Utility
import {
    Users, Calendar, TrendingUp, DollarSign,
    ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon,
    ChevronRight, ChevronLeft, Search, MapPin, Share2, Heart,
    Stethoscope, ClipboardCheck, BarChart3, Crown, ThumbsUp, Smartphone, Globe, Lightbulb, BookOpen, Quote,
    Download, FileSpreadsheet, FileText
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, LabelList
} from 'recharts';
import { useTheme } from '@/contexts/ThemeProvider';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
const AGE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FFCD56'];
const NAVER_COLOR = '#03C75A';
const GOOGLE_COLOR = '#4285F4';
const SNS_COLOR = '#E1306C';
const OFFLINE_COLOR = '#F97316';
const YOUTUBE_COLOR = '#FF0000';

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
    spreadsheet: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" />
        </svg>
    ),
    pdf: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" />
            <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" />
        </svg>
    ),
    shield: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" />
        </svg>
    ),
    // Chart icons
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

// [인터페이스 복구] KpiCard with Dark Mode
const KpiCard = ({ title, value, icon, trend, trendUp, color, bg, border }) => (
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

// [인터페이스 복구] ChartContainer with Dark Mode
const ChartContainer = ({ title, icon, children, className = "", innerHeight = "h-[320px]" }) => (
    <div className={`bg-white dark:bg-slate-900 p-8 rounded-[36px] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden ${className} group hover:shadow-2xl transition-all duration-500 text-left`}>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3 relative z-10 text-left">
            <div className={`p-2 rounded-xl ${icon ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {icon && icon("w-5 h-5")}
            </div>
            {title}
        </h3>
        <div className={`w-full relative overflow-hidden ${innerHeight}`}>
            {children}
        </div>
    </div>
);

// [인터페이스 복구] ChannelGridCard with Dark Mode
const ChannelGridCard = ({ channel, totalInflow }) => {
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
    const { isSuperAdmin, canExportData, canViewRevenue, theme } = useTheme();
    const isDark = theme === 'dark';
    const tooltipProps = getTooltipProps(isDark);
    const dashboardRef = useRef<HTMLDivElement>(null);
    // ✨ 운영지표 및 마케팅지능 콘텐츠 바운더리를 위한 refs
    const operationsRef = useRef<HTMLDivElement>(null);
    const marketingRef = useRef<HTMLDivElement>(null);
    const [slide, setSlide] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [kpi, setKpi] = useState({ revenue: 0, active: 0, sessions: 0, new: 0 });

    const [revenueData, setRevenueData] = useState([]);
    const [conversionData, setConversionData] = useState([]);
    const [therapistData, setTherapistData] = useState([]);
    const [programData, setProgramData] = useState([]);
    const [topChildren, setTopChildren] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [ageData, setAgeData] = useState([]);
    const [genderData, setGenderData] = useState([]);

    const [marketingData, setMarketingData] = useState([]);
    const [totalInflow, setTotalInflow] = useState(0);
    const [bestChannel, setBestChannel] = useState({ name: '-', value: 0 });
    const [topPosts, setTopPosts] = useState([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchMarketingData();
    }, [selectedMonth]);

    const fetchData = async () => {
        try {
            const today = new Date();
            const currentYear = today.getFullYear();
            const [selYear, selMonth] = selectedMonth.split('-').map(Number);

            const monthsToShow = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(selYear, selMonth - 1 - i, 1);
                monthsToShow.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }

            const { data: allSchedules } = await supabase.from('schedules').select(`id, date, status, child_id, children (id, name, gender, birth_date), therapists (name), programs (name, category)`).order('date', { ascending: true });

            // ✨ [FIX] First fetch existing children to validate payment data
            // Developer: 안욱빈
            const { data: existingChildren } = await supabase.from('children').select('id, gender, birth_date, created_at');
            const validChildIds = new Set(existingChildren?.map(c => c.id) || []);

            // ✨ [FIX] Build set of child_ids that have completed schedules
            const childrenWithCompletedSchedules = new Set<string>();
            allSchedules?.forEach(s => {
                if (s.status === 'completed' && s.child_id) {
                    childrenWithCompletedSchedules.add(s.child_id);
                }
            });

            // ✨ [FIX] Use 'payments' table - only count for VALID children with COMPLETED schedules
            const { data: allPayments } = await supabase.from('payments').select('amount, child_id, paid_at');

            // Create payment map by child_id and month (ONLY for valid children)
            const paymentByChildMonth: Record<string, Record<string, number>> = {};
            allPayments?.forEach(p => {
                // ✨ [CRITICAL FIX] Only count payments for:
                // 1. Children that still exist in the database
                // 2. Children that have at least one completed schedule
                if (p.child_id && p.paid_at &&
                    validChildIds.has(p.child_id) &&
                    childrenWithCompletedSchedules.has(p.child_id)) {
                    const month = (p.paid_at as string).slice(0, 7);
                    if (!paymentByChildMonth[p.child_id]) paymentByChildMonth[p.child_id] = {};
                    paymentByChildMonth[p.child_id][month] = (paymentByChildMonth[p.child_id][month] || 0) + (p.amount || 0);
                }
            });

            const monthlyRevMap: Record<string, number> = {}; monthsToShow.forEach(m => monthlyRevMap[m] = 0);
            const statusMap = { completed: 0, cancelled: 0, scheduled: 0, carried_over: 0 };
            const therapistRevMap: Record<string, number> = {};
            const progCountMap: Record<string, number> = {};
            const childMap: Record<string, number> = {};
            const conversionStats: Record<string, { consultUsers: Set<string> }> = {}; const consultExperience = new Set<string>(); const convertedUsers = new Set<string>();
            const ageCountMap: Record<string, number> = {}; let mCount = 0, fCount = 0;

            allSchedules?.forEach(s => {
                const category = s.programs?.category || ''; const pName = s.programs?.name || '';
                if (category === 'counseling' || category === 'evaluation' || pName.includes('상담') || pName.includes('평가')) consultExperience.add(s.child_id);
                if ((category === 'therapy' || pName.includes('수업') || pName.includes('치료')) && s.status === 'completed') if (consultExperience.has(s.child_id)) convertedUsers.add(s.child_id);
            });

            // Calculate monthly revenue from VALIDATED payments only
            allPayments?.forEach(p => {
                if (p.paid_at && p.child_id &&
                    validChildIds.has(p.child_id) &&
                    childrenWithCompletedSchedules.has(p.child_id)) {
                    const m = (p.paid_at as string).slice(0, 7);
                    if (monthlyRevMap[m] !== undefined) {
                        monthlyRevMap[m] += (p.amount || 0);
                    }
                }
            });

            // Calculate session stats and per-therapist/child revenue for selected month
            allSchedules?.forEach(s => {
                if (!s.date) return;
                const m = s.date.slice(0, 7);

                if (m === selectedMonth) {
                    if (statusMap[s.status] !== undefined) statusMap[s.status]++;
                    if (s.status === 'completed') {
                        // Get child's payment for this month from payments table
                        const childPayment = paymentByChildMonth[s.child_id]?.[selectedMonth] || 0;
                        if (childPayment > 0) {
                            const tName = s.therapists?.name || '미정';
                            therapistRevMap[tName] = (therapistRevMap[tName] || 0) + childPayment;
                            const cName = s.children?.name || '미등록';
                            childMap[cName] = childPayment; // Use total payment (not cumulative)
                        }
                        const pName = s.programs?.name || '기타 프로그램';
                        progCountMap[pName] = (progCountMap[pName] || 0) + 1;
                    }
                }
                if (!conversionStats[m]) conversionStats[m] = { consultUsers: new Set() };
                if (s.programs?.category === 'counseling' || s.programs?.name.includes('상담') || s.programs?.name.includes('평가')) conversionStats[m].consultUsers.add(s.child_id);
            });

            const children = existingChildren; // Reuse already fetched data
            (children || []).forEach((c: any) => {
                const g = c.gender?.trim() || '';
                if (['남', '남아', 'M', 'Male'].includes(g)) mCount++; else if (['여', '여아', 'F', 'Female'].includes(g)) fCount++;
                if (c.birth_date) {
                    const age = currentYear - new Date(c.birth_date).getFullYear();
                    if (!isNaN(age) && age >= 0) { const ageGroup = `${age}세`; ageCountMap[ageGroup] = (ageCountMap[ageGroup] || 0) + 1; }
                }
            });

            setKpi({
                revenue: monthlyRevMap[selectedMonth] || 0,
                active: children?.length || 0,
                sessions: statusMap.completed,
                new: children?.filter(c => c.created_at?.slice(0, 7) === selectedMonth).length || 0
            });
            setRevenueData(monthsToShow.map(m => ({ name: `${m.slice(5)}월`, value: monthlyRevMap[m] || 0 })));
            setConversionData(monthsToShow.map(m => {
                const consultIds = Array.from(conversionStats[m]?.consultUsers || []);
                const converted = consultIds.filter(id => convertedUsers.has(id)).length;
                return { name: `${m.slice(5)}월`, consults: consultIds.length, converted, rate: consultIds.length > 0 ? Math.round((converted / consultIds.length) * 100) : 0 };
            }));
            setTherapistData(Object.keys(therapistRevMap).map(k => ({ name: k, value: therapistRevMap[k] })).sort((a, b) => b.value - a.value));
            setProgramData(Object.keys(progCountMap).map(k => ({ name: k, value: progCountMap[k] })).sort((a, b) => b.value - a.value));
            setTopChildren(Object.keys(childMap).map(name => ({ name, value: childMap[name] })).sort((a, b) => b.value - a.value).slice(0, 10));
            setStatusData([{ name: '완료', value: statusMap.completed, color: '#3b82f6' }, { name: '취소', value: statusMap.cancelled, color: '#ef4444' }, { name: '예정', value: statusMap.scheduled, color: '#cbd5e1' }, { name: '이월', value: statusMap.carried_over, color: '#8b5cf6' }]);
            setAgeData(Object.keys(ageCountMap).map(k => ({ name: k, value: ageCountMap[k] })).sort((a, b) => b.value - a.value));
            setGenderData([{ name: '남아', value: mCount }, { name: '여아', value: fCount }]);
        } catch (e) { console.error(e); }
    };

    // ✨ [수정] 디자인 유지하며 데이터만 leads 테이블의 source와 연동
    const fetchMarketingData = async () => {
        try {
            const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // leads 테이블에서 실제 상담 신청 경로(source)를 가져옵니다.
            const { data: leadEntries } = await supabase.from('leads').select('source').gte('created_at', thirtyDaysAgo.toISOString());
            const { data: blogData } = await supabase.from('posts').select('title, view_count').order('view_count', { ascending: false }).limit(5);

            setTopPosts(blogData?.map(b => ({ name: b.title, value: b.view_count || 0 })) || []);

            const counts = { naver: 0, google: 0, sns: 0, offline: 0, etc: 0 };
            leadEntries?.forEach(l => {
                const src = (l.source || '').toLowerCase();
                if (src.includes('naver') || src.includes('blog')) counts.naver++;
                else if (src.includes('google')) counts.google++;
                else if (src.includes('insta') || src.includes('sns') || src.includes('youtube')) counts.sns++;
                else if (src.includes('지인') || src.includes('소개')) counts.offline++;
                else counts.etc++;
            });

            const ALL_CHANNELS = [
                { name: '네이버 유입', cat: 'Naver', color: NAVER_COLOR, value: counts.naver },
                { name: '구글 유입', cat: 'Google', color: GOOGLE_COLOR, value: counts.google },
                { name: 'SNS/인스타', cat: 'SNS', color: SNS_COLOR, value: counts.sns },
                { name: '지인/소개', cat: 'Offline', color: OFFLINE_COLOR, value: counts.offline },
                { name: '기타/직접', cat: 'Offline', color: '#94a3b8', value: counts.etc }
            ];

            const total = ALL_CHANNELS.reduce((acc, cur) => acc + cur.value, 0);
            setTotalInflow(total);
            setMarketingData(ALL_CHANNELS);
            setBestChannel([...ALL_CHANNELS].sort((a, b) => b.value - a.value)[0] || { name: '-', value: 0 });
        } catch (e) { console.error(e); }
    };

    // ============================================
    // 📤 SUPER ADMIN EXPORT FUNCTIONS
    // ============================================

    // 🔧 Helper: Format ISO date to YYYY-MM-DD
    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        return isoString.slice(0, 10);
    };

    const formatStartOfMonth = (ym: string) => `${ym}-01`;
    const formatEndOfMonth = (ym: string) => {
        const [y, m] = ym.split('-');
        const lastDay = new Date(Number(y), Number(m), 0).getDate();
        return `${ym}-${lastDay}`;
    };

    // 🔧 Enhanced CSV Export
    const exportToCSV = async (tableName: string, fileName: string) => {
        if (!canExportData) return;
        setExporting(true);
        try {
            let data: any[] = [];
            let headers: string[] = [];

            // (Previous CSV Logic Omitted for brevity, but kept in spirit)
            // For now, simpler CSV is fine as the Excel is the main feature.
            const { data: rawData, error } = await supabase.from(tableName).select('*').limit(100);
            if (error) throw error;
            data = rawData || [];
            headers = data.length > 0 ? Object.keys(data[0]) : [];

            if (!data || data.length === 0) {
                alert('내보낼 데이터가 없습니다.');
                return;
            }

            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
        } catch (e) {
            console.error('Export error:', e);
            alert('내보내기 중 오류가 발생했습니다.');
        } finally {
            setExporting(false);
        }
    };

    // 📊 [Integrated Report] Generate Excel Report using Utility
    const exportIntegratedReport = async () => {
        if (!canExportData) return;
        setExporting(true);

        try {
            console.log("🚀 Starting Export Process (Unified Utility)...");

            // ✨ Call the new Utility
            const result = await generateIntegratedReport(selectedMonth);

            if (result.success) {
                // Determine Success Message based on count
                const count = result.count || 0;
                if (count > 0) {
                    // console.log("Report generated successfully");
                } else {
                    alert('해당 기간에 조회된 데이터가 없습니다.');
                }
            } else {
                alert(`보고서 생성 실패: ${result.error}`);
            }

        } catch (error) {
            console.error('Export Failed:', error);
            alert('보고서 생성 중 오류가 발생했습니다.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div ref={dashboardRef} className="bg-slate-50 dark:bg-slate-950 min-h-screen p-8 pb-32 space-y-8 overflow-hidden texture-noise">
            <Helmet><title>지능형 센터 인사이트 허브</title></Helmet>

            {/* Super Admin Export Section - Golden Border */}
            {canExportData && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-6 rounded-[32px] border-2 border-amber-400 dark:border-yellow-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20 gpu-accelerate">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            {SvgIcons.shield("w-10 h-10 text-amber-600 dark:text-yellow-400")}
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
                    <button onClick={() => setSlide(0)} className={`px-6 py-3 rounded-2xl font-black transition-all gpu-accelerate ${slide === 0 ? 'bg-indigo-600 dark:bg-yellow-400 text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>운영 지표</button>
                    <button onClick={() => setSlide(1)} className={`px-6 py-3 rounded-2xl font-black transition-all gpu-accelerate ${slide === 1 ? 'bg-indigo-600 dark:bg-yellow-400 text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>마케팅 지능</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="확정 매출" value={`₩${kpi.revenue.toLocaleString()}`} icon={SvgIcons.dollar} trend="확정" trendUp={true} color="text-blue-600 dark:text-blue-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="활성 아동" value={`${kpi.active}명`} icon={SvgIcons.users} trend="현재원" trendUp={true} color="text-indigo-600 dark:text-indigo-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="완료 수업" value={`${kpi.sessions}건`} icon={SvgIcons.calendar} trend="실적" trendUp={true} color="text-emerald-600 dark:text-emerald-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
                <KpiCard title="상담 리드" value={`${totalInflow}건`} icon={SvgIcons.activity} trend="실시간" trendUp={true} color="text-rose-600 dark:text-rose-400" bg="bg-white dark:bg-slate-900" border="border-slate-200 dark:border-slate-800" />
            </div>

            {slide === 0 && (
                <div ref={operationsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <ChartContainer title="월별 누적 매출 추이" icon={SvgIcons.trendingUp} className="lg:col-span-2" innerHeight="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 80, right: 30, left: 20 }}>
                                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v} />
                                    <RechartsTooltip {...tooltipProps} formatter={val => [`₩${val.toLocaleString()}`, '매출']} />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="수업 상태 점유율" icon={SvgIcons.pieChart} innerHeight="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                                        {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>

                    <ChartContainer title="치료사별 매출 기여도" icon={SvgIcons.stethoscope} innerHeight="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={therapistData} layout="vertical" margin={{ top: 20, right: 50, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip {...tooltipProps} formatter={val => [`₩${val.toLocaleString()}`, '매출']} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={32}>
                                    <LabelList dataKey="value" position="right" formatter={v => `₩${v.toLocaleString()}`} style={{ fontWeight: 'bold', fill: '#64748b' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title="상담 후 등록 전환율" icon={SvgIcons.activity} innerHeight="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={conversionData} margin={{ top: 80, right: 30, left: 20 }}>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" />
                                <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                <Bar yAxisId="left" dataKey="consults" name="상담 진행" fill="#e2e8f0" barSize={50} radius={[6, 6, 0, 0]} />
                                <Bar yAxisId="left" dataKey="converted" name="최종 등록" fill="#10b981" barSize={50} radius={[6, 6, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="rate" name="전환율(%)" stroke="#f59e0b" strokeWidth={4} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ChartContainer title="프로그램별 점유율 (횟수)" icon={SvgIcons.clipboardCheck} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={programData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {programData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="아동 연령별" icon={SvgIcons.users} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={ageData} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                                        {ageData.map((e, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="성별 비율" icon={SvgIcons.users} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={genderData} outerRadius={60} dataKey="value" stroke="none" label={({ name }) => name}>
                                        <Cell fill="#3b82f6" /><Cell fill="#ec4899" />
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="상위 기여 아동" icon={SvgIcons.crown} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topChildren} layout="vertical" margin={{ top: 80, right: 30, left: 10 }}>
                                    <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} />
                                    <RechartsTooltip {...tooltipProps} /><Bar dataKey="value" fill="#ec4899" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </div>
            )}

            {slide === 1 && (
                <div ref={marketingRef} className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl flex justify-between items-center relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black mb-2 flex items-center gap-3">실시간 상담 리드: {totalInflow.toLocaleString()} 건</h3>
                            <p className="text-indigo-200 font-bold text-lg underline underline-offset-8 decoration-yellow-400">최고 전환 채널: {bestChannel.name}</p>
                        </div>
                        <div className="hidden lg:block relative z-10 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 min-w-[280px]">
                            <span className="block text-xs font-black mb-1 opacity-60 uppercase tracking-widest">DOMINANT SOURCE</span>
                            <span className="block text-3xl font-black text-yellow-300">{bestChannel.name}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartContainer title="인기 콘텐츠 분석" icon={SvgIcons.bookOpen} innerHeight="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPosts} layout="vertical" margin={{ top: 80, right: 30, left: 20 }}>
                                    <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip {...tooltipProps} /><Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col h-[550px] text-left">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3 text-left">{SvgIcons.share("w-5 h-5 text-indigo-600 dark:text-indigo-400")} 채널별 상세 유입 분석 (Leads)</h3>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {marketingData.map((item, idx) => (
                                        <ChannelGridCard key={idx} channel={item} totalInflow={totalInflow} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}