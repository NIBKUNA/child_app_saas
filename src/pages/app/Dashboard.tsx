// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import {
    Users, Calendar, TrendingUp, DollarSign,
    ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon, BarChart3,
    Megaphone, Stethoscope, ClipboardCheck, ChevronRight, ChevronLeft, Crown
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line, LabelList, ComposedChart, Tooltip
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
const AGE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#FFCD56'];

// ----------------------------------------------------------------------
// 1. 하위 컴포넌트 정의 (정상 작동 보장)
// ----------------------------------------------------------------------

// ✨ 누락되었던 KpiCard 정의 추가
const KpiCard = ({ title, value, icon: Icon, trend, trendUp, color, bg, border }) => (
    <div className={`p-6 rounded-2xl border ${border} ${bg} relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white bg-opacity-80 ${color} shadow-sm border border-slate-100`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div className="flex items-center gap-1.5">
            <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}{trend}
            </span>
            <span className="text-xs text-slate-400 font-medium">기준 대비</span>
        </div>
    </div>
);

const RevenueTrendChart = ({ data }) => (
    <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${val / 10000}만`} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(val) => `${val.toLocaleString()}원`} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

const ConversionComboChart = ({ data }) => (
    <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" scale="band" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px' }} />
                <Legend verticalAlign="top" height={36} />
                <Bar yAxisId="left" dataKey="consults" name="상담 인원" barSize={20} fill="#ff9f9f" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="converted" name="등록 전환" barSize={20} fill="#82ca9d" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="rate" name="전환율" stroke="#f59e0b" strokeWidth={3} />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);

const TherapistChart = ({ data }) => (
    <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 'bold', fontSize: 11 }} />
                <YAxis hide />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => `${val.toLocaleString()}원`} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30}>
                    <LabelList dataKey="value" position="top" formatter={(val) => `${(val / 10000).toFixed(0)}만`} style={{ fill: '#8b5cf6', fontSize: 11, fontWeight: 'bold' }} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const TopChildrenChart = ({ data }) => (
    <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip formatter={(val) => `${val.toLocaleString()}원`} />
                <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={15} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const ProgramRevenueChart = ({ data }) => (
    <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(val) => `${val.toLocaleString()}원`} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const InflowChart = ({ data }) => (
    <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 'bold', fontSize: 11 }} dy={10} />
                <YAxis hide />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24}>
                    <LabelList dataKey="value" position="top" formatter={(val) => `${val}명`} style={{ fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const ConsultationChart = ({ data }) => (
    <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={40} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={5} />
                <YAxis hide />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const SessionStatusChart = ({ data }) => (
    <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const DemographicsChart = ({ ageData = [], genderData = [] }) => {
    const sortedAgeData = [...ageData].sort((a, b) => (b.value || 0) - (a.value || 0));
    const finalAgeData = sortedAgeData.slice(0, 5);
    const totalAge = finalAgeData.reduce((acc, cur) => acc + (cur.value || 0), 0);
    const totalGender = (genderData[0]?.value || 0) + (genderData[1]?.value || 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="h-64 w-full flex flex-col items-center">
                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider w-full text-left">연령별 비율</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={finalAgeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                            {finalAgeData.map((entry, index) => <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="h-64 w-full flex flex-col items-center border-l border-slate-100 pl-4 md:pl-6">
                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider w-full text-left">성별 비율</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                            <Cell fill="#3b82f6" name="남아" />
                            <Cell fill="#ec4899" name="여아" />
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 2. 메인 대시보드
// ----------------------------------------------------------------------

export function Dashboard() {
    const [slide, setSlide] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000));
        return kstDate.toISOString().slice(0, 7);
    });

    const [revenueData, setRevenueData] = useState([]);
    const [therapistData, setTherapistData] = useState([]);
    const [inflowData, setInflowData] = useState([]);
    const [programData, setProgramData] = useState([]);
    const [topChildren, setTopChildren] = useState([]);
    const [conversionData, setConversionData] = useState([]);
    const [consultData, setConsultData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [ageData, setAgeData] = useState([]);
    const [genderData, setGenderData] = useState([]);
    const [kpi, setKpi] = useState({ revenue: 0, active: 0, sessions: 0, new: 0 });

    useEffect(() => { fetchData(); }, [selectedMonth]);

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

            const { data: allSchedules } = await supabase
                .from('schedules')
                .select(`
                    date, status, start_time, child_id,
                    children (id, name),
                    therapists (name),
                    programs (name, category, price)
                `)
                .order('date', { ascending: true });

            const monthlyRevMap = {};
            monthsToShow.forEach(m => monthlyRevMap[m] = 0);
            let currentMonthRev = 0;
            let currentMonthSessionCount = 0;
            const therapistRevMap = {};
            const statusMap = { completed: 0, cancelled: 0, scheduled: 0, carried_over: 0 };
            const consultMap = { '초기상담': 0, '평가': 0 };
            const progRevenueMap = {};
            const conversionStats = {};
            const childMap = {};
            const consultExperience = new Set();
            const convertedUsers = new Set();

            allSchedules?.forEach(s => {
                const category = s.programs?.category || '';
                const pName = s.programs?.name || '';
                if (category === 'counseling' || category === 'evaluation' || pName.includes('상담') || pName.includes('평가')) {
                    consultExperience.add(s.child_id);
                }
                if ((category === 'therapy' || pName.includes('수업') || pName.includes('치료')) && s.status === 'completed') {
                    if (consultExperience.has(s.child_id)) convertedUsers.add(s.child_id);
                }
            });

            allSchedules?.forEach(s => {
                if (!s.date) return;
                const m = s.date.slice(0, 7);
                const price = s.programs?.price || 0;
                const category = s.programs?.category || '';
                const pName = s.programs?.name || '';
                const childName = s.children?.name || '미상';

                if (s.status === 'completed' && monthlyRevMap[m] !== undefined) monthlyRevMap[m] += price;

                if (m === selectedMonth) {
                    if (statusMap[s.status] !== undefined) statusMap[s.status]++;
                    if (category === 'counseling' || pName.includes('상담')) consultMap['초기상담']++;
                    else if (category === 'evaluation' || pName.includes('평가')) consultMap['평가']++;

                    if (s.status === 'completed') {
                        currentMonthRev += price;
                        currentMonthSessionCount++;
                        const tName = s.therapists?.name || '미정';
                        therapistRevMap[tName] = (therapistRevMap[tName] || 0) + price;
                        progRevenueMap[pName] = (progRevenueMap[pName] || 0) + price;
                        childMap[childName] = (childMap[childName] || 0) + price;
                    }
                }

                if (!conversionStats[m]) conversionStats[m] = { consultUsers: new Set() };
                if (category === 'counseling' || category === 'evaluation' || pName.includes('상담') || pName.includes('평가')) {
                    conversionStats[m].consultUsers.add(s.child_id);
                }
            });

            const { data: children } = await supabase.from('children').select('*');
            const inflowMap = {};
            const ageCountMap = {};
            let mCount = 0, fCount = 0, newRegCount = 0;

            children?.forEach(c => {
                const src = c.inflow_source || '기타';
                inflowMap[src] = (inflowMap[src] || 0) + 1;
                const g = c.gender?.trim() || '';
                if (['남', '남아', 'M', 'Male'].includes(g)) mCount++;
                else if (['여', '여아', 'F', 'Female'].includes(g)) fCount++;
                if (c.birth_date) {
                    const age = currentYear - new Date(c.birth_date).getFullYear();
                    if (!isNaN(age) && age >= 0) ageCountMap[`${age}세`] = (ageCountMap[`${age}세`] || 0) + 1;
                }
                if (c.created_at && c.created_at.slice(0, 7) === selectedMonth) newRegCount++;
            });

            setKpi({ revenue: currentMonthRev, active: children?.length || 0, sessions: currentMonthSessionCount, new: newRegCount });
            setRevenueData(monthsToShow.map(m => ({ name: `${m.slice(5)}월`, value: monthlyRevMap[m] || 0 })));
            setInflowData(Object.keys(inflowMap).map(k => ({ name: k, value: inflowMap[k] })).sort((a, b) => b.value - a.value));
            setGenderData([{ name: '남아', value: mCount }, { name: '여아', value: fCount }]);
            setAgeData(Object.keys(ageCountMap).map(k => ({ name: k, value: ageCountMap[k] })));
            setTherapistData(Object.keys(therapistRevMap).map(k => ({ name: k, value: therapistRevMap[k] })).sort((a, b) => b.value - a.value));
            setStatusData([
                { name: '완료', value: statusMap.completed, color: '#3b82f6' },
                { name: '취소', value: statusMap.cancelled, color: '#ef4444' },
                { name: '예정', value: statusMap.scheduled, color: '#cbd5e1' },
                { name: '이월', value: statusMap.carried_over, color: '#8b5cf6' }
            ]);
            setConsultData([{ name: '초기상담', value: consultMap['초기상담'] }, { name: '평가', value: consultMap['평가'] }]);
            setProgramData(Object.keys(progRevenueMap).map(k => ({ name: k, value: progRevenueMap[k] })).sort((a, b) => b.value - a.value).slice(0, 5));
            setTopChildren(Object.keys(childMap).map(name => ({ name, value: childMap[name] })).sort((a, b) => b.value - a.value).slice(0, 10));

            setConversionData(monthsToShow.map(m => {
                const consultIds = Array.from(conversionStats[m]?.consultUsers || []);
                const converted = consultIds.filter(id => convertedUsers.has(id)).length;
                return { name: `${m.slice(5)}월`, consults: consultIds.length, converted, rate: consultIds.length > 0 ? Math.round((converted / consultIds.length) * 100) : 0 };
            }));

        } catch (e) { console.error(e); }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-6 space-y-6 pb-20">
            <Helmet><title>대시보드 - 자라다 Admin</title></Helmet>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">대시보드</h1>
                    <p className="text-slate-500 font-medium">실시간 운영 통계를 분석합니다.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer border-none p-0" />
                    </div>
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                        <button onClick={() => setSlide(0)} className={`p-2 rounded-lg ${slide === 0 ? 'bg-slate-800 text-white' : 'bg-white text-slate-400'}`}><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={() => setSlide(1)} className={`p-2 rounded-lg ${slide === 1 ? 'bg-slate-800 text-white' : 'bg-white text-slate-400'}`}><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <KpiCard title={`${selectedMonth.split('-')[1]}월 매출`} value={`₩${kpi.revenue.toLocaleString()}`} icon={DollarSign} trend="Monthly" trendUp={true} color="text-blue-600" bg="bg-white" border="border-slate-200" />
                <KpiCard title="활성 아동" value={`${kpi.active}명`} icon={Users} trend="Total" trendUp={true} color="text-indigo-600" bg="bg-white" border="border-slate-200" />
                <KpiCard title={`${selectedMonth.split('-')[1]}월 수업`} value={`${kpi.sessions}건`} icon={Calendar} trend="Session" trendUp={true} color="text-emerald-600" bg="bg-white" border="border-slate-200" />
                <KpiCard title="신규 등록" value={`${kpi.new}명`} icon={Activity} trend="New" trendUp={true} color="text-rose-600" bg="bg-white" border="border-slate-200" />
            </div>

            {slide === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> 매출 추이</h3>
                        <RevenueTrendChart data={revenueData} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">상담/평가 현황</h3><ConsultationChart data={consultData} /></div>
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">치료 상태 비율</h3><SessionStatusChart data={statusData} /></div>
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">치료사 실적</h3><TherapistChart data={therapistData} /></div>
                    </div>
                </div>
            )}

            {slide === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5" /> 상담 전환율 분석</h3>
                        <ConversionComboChart data={conversionData} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">누적 유입 경로</h3><InflowChart data={inflowData} /></div>
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">인구 통계</h3><DemographicsChart ageData={ageData} genderData={genderData} /></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">매출 상위 아동</h3><TopChildrenChart data={topChildren} /></div>
                        <div className="bg-white p-6 rounded-2xl border"><h3 className="font-bold mb-4">프로그램 점유율</h3><ProgramRevenueChart data={programData} /></div>
                    </div>
                </div>
            )}
        </div>
    );
}