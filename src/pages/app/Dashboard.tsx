// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import {
    Users, Calendar, TrendingUp, DollarSign,
    ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon,
    ChevronRight, ChevronLeft, Search, MapPin, Share2, Heart,
    Stethoscope, ClipboardCheck, BarChart3, Crown, ThumbsUp, Smartphone, Globe, Lightbulb, BookOpen, Quote
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, LabelList
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
const AGE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FFCD56'];
const NAVER_COLOR = '#03C75A';
const GOOGLE_COLOR = '#4285F4';
const SNS_COLOR = '#E1306C';
const OFFLINE_COLOR = '#F97316';
const YOUTUBE_COLOR = '#FF0000';

const tooltipProps = {
    contentStyle: {
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)'
    },
    cursor: { fill: '#f8fafc', strokeWidth: 0 }
};

const KpiCard = ({ title, value, icon: Icon, trend, trendUp, color, bg, border }) => (
    <div className={`p-6 rounded-3xl border ${border} ${bg} relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/30 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex justify-between items-start mb-6">
            <div>
                <p className="text-sm font-bold text-slate-500 mb-1 tracking-wide">{title}</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl bg-white/90 ${color} shadow-sm border border-slate-100/50 backdrop-blur-sm`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-100/80 text-emerald-700' : 'bg-rose-100/80 text-rose-700'}`}>
                {trendUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}{trend}
            </span>
            <span className="text-xs text-slate-400 font-medium">전월 대비</span>
        </div>
    </div>
);

const ChartContainer = ({ title, icon: Icon, children, className = "", innerHeight = "h-[320px]" }) => (
    <div className={`bg-white p-8 rounded-[36px] shadow-lg border border-slate-100 flex flex-col overflow-hidden ${className} group hover:shadow-2xl transition-all duration-500`}>
        <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-3 relative z-10">
            <div className={`p-2 rounded-xl ${Icon ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                {Icon && <Icon className="w-5 h-5" />}
            </div>
            {title}
        </h3>
        <div className={`w-full relative overflow-hidden ${innerHeight}`}>
            {children}
        </div>
    </div>
);

const ChannelGridCard = ({ channel, totalInflow }) => {
    const percent = totalInflow > 0 ? ((channel.value / totalInflow) * 100).toFixed(1) : '0.0';
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md" style={{ backgroundColor: channel.color }}>
                    {channel.cat === 'Naver' && 'N'}
                    {channel.cat === 'Google' && 'G'}
                    {channel.cat === 'SNS' && 'S'}
                    {channel.cat === 'Offline' && 'O'}
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{channel.cat}</span>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{channel.name}</h4>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-xl font-black text-slate-900">{channel.value}<span className="text-xs text-slate-400 ml-0.5">건</span></span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: channel.color }} />
                </div>
            </div>
        </div>
    );
};

export function Dashboard() {
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
            const { data: allPayments } = await supabase.from('payment_items').select('amount, schedule_id');

            const payMap = {};
            allPayments?.forEach(p => { if (p.schedule_id) payMap[p.schedule_id] = (payMap[p.schedule_id] || 0) + (p.amount || 0); });

            const monthlyRevMap = {}; monthsToShow.forEach(m => monthlyRevMap[m] = 0);
            const statusMap = { completed: 0, cancelled: 0, scheduled: 0, carried_over: 0 };
            const therapistRevMap = {};
            const progCountMap = {};
            const childMap = {};
            const conversionStats = {}; const consultExperience = new Set(); const convertedUsers = new Set();
            const ageCountMap = {}; let mCount = 0, fCount = 0;
            let currentMonthRev = 0; let currentMonthSessionCount = 0;

            allSchedules?.forEach(s => {
                const category = s.programs?.category || ''; const pName = s.programs?.name || '';
                if (category === 'counseling' || category === 'evaluation' || pName.includes('상담') || pName.includes('평가')) consultExperience.add(s.child_id);
                if ((category === 'therapy' || pName.includes('수업') || pName.includes('치료')) && s.status === 'completed') if (consultExperience.has(s.child_id)) convertedUsers.add(s.child_id);
            });

            allSchedules?.forEach(s => {
                if (!s.date) return;
                const m = s.date.slice(0, 7);
                const paidAmt = payMap[s.id] || 0;
                const isRevenue = s.status === 'completed' && paidAmt > 0;

                if (isRevenue && monthlyRevMap[m] !== undefined) monthlyRevMap[m] += paidAmt;

                if (m === selectedMonth) {
                    if (statusMap[s.status] !== undefined) statusMap[s.status]++;

                    if (s.status === 'completed') {
                        if (paidAmt > 0) {
                            currentMonthRev += paidAmt;
                            // 치료사별 매출 집계
                            const tName = s.therapists?.name || '미정';
                            therapistRevMap[tName] = (therapistRevMap[tName] || 0) + paidAmt;

                            const cName = s.children?.name || '미등록'; childMap[cName] = (childMap[cName] || 0) + paidAmt;
                        }
                        currentMonthSessionCount++;

                        const pName = s.programs?.name || '기타 프로그램';
                        progCountMap[pName] = (progCountMap[pName] || 0) + 1;
                    }
                }
                if (!conversionStats[m]) conversionStats[m] = { consultUsers: new Set() };
                if (s.programs?.category === 'counseling' || s.programs?.name.includes('상담') || s.programs?.name.includes('평가')) conversionStats[m].consultUsers.add(s.child_id);
            });

            const { data: children } = await supabase.from('children').select('*');
            children?.forEach(c => {
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

            // 치료사 데이터 설정
            setTherapistData(Object.keys(therapistRevMap).map(k => ({ name: k, value: therapistRevMap[k] })).sort((a, b) => b.value - a.value));

            setProgramData(Object.keys(progCountMap).map(k => ({ name: k, value: progCountMap[k] })).sort((a, b) => b.value - a.value));
            setTopChildren(Object.keys(childMap).map(name => ({ name, value: childMap[name] })).sort((a, b) => b.value - a.value).slice(0, 10));
            setStatusData([{ name: '완료', value: statusMap.completed, color: '#3b82f6' }, { name: '취소', value: statusMap.cancelled, color: '#ef4444' }, { name: '예정', value: statusMap.scheduled, color: '#cbd5e1' }, { name: '이월', value: statusMap.carried_over, color: '#8b5cf6' }]);
            setAgeData(Object.keys(ageCountMap).map(k => ({ name: k, value: ageCountMap[k] })).sort((a, b) => b.value - a.value));
            setGenderData([{ name: '남아', value: mCount }, { name: '여아', value: fCount }]);
        } catch (e) { console.error(e); }
    };

    const fetchMarketingData = async () => {
        try {
            const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: visits } = await supabase.from('site_visits').select('*').gte('visited_at', thirtyDaysAgo.toISOString());
            const { data: registrations } = await supabase.from('children').select('inflow_source').gte('created_at', thirtyDaysAgo.toISOString());
            const { data: blogData } = await supabase.from('blog_posts').select('title, view_count').order('view_count', { ascending: false }).limit(5);

            const totalBlogViews = blogData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
            setTopPosts(blogData?.map(b => ({ name: b.title, value: b.view_count || 0 })) || []);

            const channels = { naver: { place: 0, search: 0, blog: totalBlogViews }, google: { search: 0, maps: 0 }, sns: { instagram: 0, youtube: 0 }, offline: { referral: 0, direct: 0 } };
            visits?.forEach((v: any) => {
                const src = (v.source_category || '').toLowerCase();
                const med = (v.source_medium || '').toLowerCase();
                if (src.includes('naver')) { if (med.includes('place') || med.includes('map')) channels.naver.place++; else channels.naver.search++; }
                else if (src.includes('google')) { if (med.includes('map')) channels.google.maps++; else channels.google.search++; }
                else if (src.includes('instagram')) channels.sns.instagram++;
                else if (src.includes('youtube')) channels.sns.youtube++;
            });
            registrations?.forEach((r: any) => {
                const src = (r.inflow_source || '');
                if (src.includes('지인') || src.includes('소개')) channels.offline.referral++;
                else channels.offline.direct++;
            });

            const ALL_CHANNELS = [
                { name: '네이버 플레이스', cat: 'Naver', color: NAVER_COLOR, value: channels.naver.place },
                { name: '네이버 검색', cat: 'Naver', color: NAVER_COLOR, value: channels.naver.search },
                { name: '네이버 블로그', cat: 'Naver', color: NAVER_COLOR, value: channels.naver.blog },
                { name: '구글 검색', cat: 'Google', color: GOOGLE_COLOR, value: channels.google.search },
                { name: '인스타그램', cat: 'SNS', color: SNS_COLOR, value: channels.sns.instagram },
                { name: '유튜브', cat: 'SNS', color: YOUTUBE_COLOR, value: channels.sns.youtube },
                { name: '지인 소개', cat: 'Offline', color: OFFLINE_COLOR, value: channels.offline.referral },
                { name: '기타/직접', cat: 'Offline', color: '#94a3b8', value: channels.offline.direct }
            ];

            const total = ALL_CHANNELS.reduce((acc, cur) => acc + cur.value, 0);
            setTotalInflow(total);
            setMarketingData(ALL_CHANNELS);
            setBestChannel([...ALL_CHANNELS].sort((a, b) => b.value - a.value)[0]);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-8 pb-32 space-y-8 overflow-hidden">
            <Helmet><title>지능형 센터 인사이트 허브</title></Helmet>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">지능형 센터 인사이트 허브</h1>
                    <p className="text-slate-500 font-bold mt-2">AI 기반 운영 & 마케팅 통합 분석 시스템</p>
                </div>
                <div className="flex gap-4 items-center bg-white p-2 rounded-3xl shadow-sm border">
                    <button onClick={() => setSlide(0)} className={`px-6 py-3 rounded-2xl font-black transition-all ${slide === 0 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>운영 지표</button>
                    <button onClick={() => setSlide(1)} className={`px-6 py-3 rounded-2xl font-black transition-all ${slide === 1 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>마케팅 지능</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="확정 매출" value={`₩${kpi.revenue.toLocaleString()}`} icon={DollarSign} trend="확정" trendUp={true} color="text-blue-600" bg="bg-white" border="border-slate-200" />
                <KpiCard title="활성 아동" value={`${kpi.active}명`} icon={Users} trend="현재원" trendUp={true} color="text-indigo-600" bg="bg-white" border="border-slate-200" />
                <KpiCard title="완료 수업" value={`${kpi.sessions}건`} icon={Calendar} trend="실적" trendUp={true} color="text-emerald-600" bg="bg-white" border="border-slate-200" />
                <KpiCard title="신규 유입" value={`${kpi.new}명`} icon={Activity} trend="전환" trendUp={true} color="text-rose-600" bg="bg-white" border="border-slate-200" />
            </div>

            {slide === 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <ChartContainer title="월별 누적 매출 추이" icon={TrendingUp} className="lg:col-span-2" innerHeight="h-[350px]">
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
                        <ChartContainer title="수업 상태 점유율" icon={PieIcon} innerHeight="h-[350px]">
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

                    {/* ✨ [수정됨] 치료사별 매출 기여도 차트 높이 조절 (h-[400px] -> h-[250px]) */}
                    <ChartContainer title="치료사별 매출 기여도" icon={Stethoscope} innerHeight="h-[250px]">
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

                    <ChartContainer title="상담 후 등록 전환율" icon={Activity} innerHeight="h-[450px]">
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
                        <ChartContainer title="프로그램별 점유율 (횟수)" icon={ClipboardCheck} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={programData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {programData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="아동 연령별" icon={Users} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={ageData} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                                        {ageData.map((e, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="성별 비율" icon={Users} innerHeight="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 80 }}>
                                    <Pie data={genderData} outerRadius={60} dataKey="value" stroke="none" label={({ name }) => name}>
                                        <Cell fill="#3b82f6" /><Cell fill="#ec4899" />
                                    </Pie>
                                    <RechartsTooltip {...tooltipProps} /><Legend verticalAlign="top" align="right" wrapperStyle={{ top: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <ChartContainer title="상위 기여 아동" icon={Crown} innerHeight="h-[300px]">
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
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black mb-2 flex items-center gap-3">총 유입량: {totalInflow.toLocaleString()} 건</h3>
                            <p className="text-indigo-200 font-bold text-lg underline underline-offset-8 decoration-yellow-400">최고 성과 채널: {bestChannel.name}</p>
                        </div>
                        <div className="hidden lg:block relative z-10 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 min-w-[280px]">
                            <span className="block text-xs font-black mb-1 opacity-60 uppercase tracking-widest">DOMINANT SOURCE</span>
                            <span className="block text-3xl font-black text-yellow-300">{bestChannel.name}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartContainer title="블로그 인기 콘텐츠 분석" icon={BookOpen} innerHeight="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPosts} layout="vertical" margin={{ top: 80, right: 30, left: 20 }}>
                                    <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip {...tooltipProps} /><Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="bg-white p-8 rounded-[40px] shadow-lg border border-slate-100 flex flex-col h-[550px]">
                            <h3 className="font-bold text-lg text-slate-800 mb-8 flex items-center gap-3"><Share2 className="w-5 h-5 text-indigo-600" /> 채널별 상세 유입 분석</h3>
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