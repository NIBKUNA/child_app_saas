/**
 * 🎨 Zarada ERP - 수납 관리 v4
 * 치료(프로그램)별 완전 분리 수납 + 카드형 인라인 수납 모달
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { adjustCredit } from '@/utils/adjustCredit';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { toLocalDateStr } from '@/utils/timezone';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';
import {
    ChevronLeft, ChevronRight, Search, Loader2, User, X,
    ArrowRightCircle, RotateCcw, History, Save, Pencil,
    CheckCircle2, Clock, Ban,
    Receipt, StickyNote
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled' | 'carried_over' | 'makeup';

interface ScheduleData extends Omit<TableRow<'schedules'>, 'status'> {
    status: ScheduleStatus;
    children: { id: string; name: string; credit: number | null; center_id: string | null } | null;
    programs: { id: string; name: string; price: number; category: string | null; description: string | null } | null;
}

interface BillingSession {
    id: string; date: string; status: ScheduleStatus;
    price: number; isCanceled: boolean; isCarriedOver: boolean;
    notes?: string | null;
    programs?: { id: string; name: string; price: number; category: string | null; description: string | null } | null;
}

interface ProgramGroup {
    programId: string; programName: string;
    programCategory: string | null; programDescription: string | null;
    pricePerSession: number; sessions: BillingSession[];
    totalFee: number; completedFee: number; paidAmount: number;
    completedCount: number; scheduledCount: number;
    cancelledCount: number; carriedOverCount: number;
}

interface ChildBillingData {
    id: string; name: string;
    paid: number; credit: number;
    totalFee: number; completedCount: number;
    scheduledCount: number; cancelledCount: number; carriedOverCount: number;
    sessions: BillingSession[];
    programGroups: ProgramGroup[];
}

interface PaymentModalProps {
    childData: ChildBillingData; month: string;
    onClose: () => void; onSuccess: () => void; isDark: boolean;
}

// ──────────────────────────────
// 메인 Billing 컴포넌트
// ──────────────────────────────
export function Billing() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<ScheduleData[]>([]);
    const [payments, setPayments] = useState<TableRow<'payments'>[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChild, setSelectedChild] = useState<ChildBillingData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { center } = useCenter();

    const fetchData = async () => {
        if (!center?.id) return;
        setLoading(true);
        try {
            const monthStart = `${selectedMonth}-01T00:00:00`;
            const nextMonth = new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1)).toISOString().slice(0, 10);

            // ✨ [Performance] 두 독립 쿼리를 병렬 실행 → 로딩 시간 ~50% 단축
            const [scheduleResult, paymentResult] = await Promise.all([
                supabase
                    .from('schedules')
                    .select(`*, children!inner (*), programs (*)`)
                    .eq('children.center_id', center.id)
                    .gte('start_time', `${selectedMonth}-01`)
                    .lt('start_time', nextMonth)
                    .order('start_time', { ascending: false }),
                supabase
                    .from('payments')
                    .select(`*, payment_items(*), children!inner(center_id)`)
                    .eq('payment_month', selectedMonth)
                    .eq('children.center_id', center.id)
            ]);

            setSchedules((scheduleResult.data || []) as unknown as ScheduleData[]);
            setPayments((paymentResult.data || []) as unknown as TableRow<'payments'>[]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, center?.id]);

    // ──────────────────────────────
    // 아동별 + 프로그램별 그루핑
    // ──────────────────────────────
    const buildChildMap = useCallback(() => {
        const childMap: Record<string, ChildBillingData> = {};

        schedules.forEach(item => {
            const childId = item.children?.id;
            const childName = item.children?.name || '';
            if (!childId || (searchTerm && !childName.includes(searchTerm))) return;

            if (!childMap[childId]) {
                childMap[childId] = {
                    id: childId, name: childName, paid: 0,
                    credit: item.children?.credit || 0,
                    totalFee: 0, completedCount: 0, scheduledCount: 0,
                    cancelledCount: 0, carriedOverCount: 0,
                    sessions: [], programGroups: [],
                };
            }

            const isCanceled = item.status === 'cancelled';
            const isCarriedOver = item.status === 'carried_over';
            const programPrice = item.programs?.price || 0;
            const price = (isCanceled || isCarriedOver) ? 0 : programPrice;
            const date = toLocalDateStr(item.start_time);

            childMap[childId].sessions.push({ ...item, date, price, isCanceled, isCarriedOver, notes: (item as any).notes || null });

            if (!isCanceled && !isCarriedOver) childMap[childId].totalFee += price;
            if (item.status === 'completed') childMap[childId].completedCount++;
            else if (isCarriedOver) childMap[childId].carriedOverCount++;
            else if (isCanceled) childMap[childId].cancelledCount++;
            else if (item.status === 'scheduled') childMap[childId].scheduledCount++;
        });

        // 프로그램별 그루핑
        Object.values(childMap).forEach(child => {
            const groupMap: Record<string, ProgramGroup> = {};
            const childPayments = payments.filter(p => p.child_id === child.id);

            child.sessions.forEach(s => {
                const pgId = s.programs?.id || 'unknown';
                if (!groupMap[pgId]) groupMap[pgId] = {
                    programId: pgId, programName: s.programs?.name || '미분류',
                    programCategory: s.programs?.category || null, programDescription: s.programs?.description || null,
                    pricePerSession: s.programs?.price || 0, sessions: [],
                    totalFee: 0, completedFee: 0, paidAmount: 0,
                    completedCount: 0, scheduledCount: 0, cancelledCount: 0, carriedOverCount: 0,
                };
                groupMap[pgId].sessions.push(s);

                if (!s.isCanceled && !s.isCarriedOver) groupMap[pgId].totalFee += s.price;
                if (s.status === 'completed') { groupMap[pgId].completedFee += s.price; groupMap[pgId].completedCount++; }
                else if (s.isCarriedOver) groupMap[pgId].carriedOverCount++;
                else if (s.isCanceled) groupMap[pgId].cancelledCount++;
                else if (s.status === 'scheduled') groupMap[pgId].scheduledCount++;
            });

            // 프로그램별 기수납액 계산
            Object.values(groupMap).forEach(g => {
                const sessionIds = new Set(g.sessions.map(s => s.id));

                // program_id 가 직접 매칭된 수납
                const directPaid = childPayments
                    .filter(p => p.program_id === g.programId)
                    .reduce((s, p) => {
                        const amt = Number(p.amount) || 0;
                        const cr = Number(p.credit_used) || 0;
                        return s + amt + cr;
                    }, 0);

                // 레거시 수납 (program_id 없음) → payment_items 매칭
                const legacyPaid = childPayments
                    .filter(p => !p.program_id)
                    .reduce((s, p) => {
                        const items: any[] = (p as any).payment_items || [];
                        if (items.length === 0) return s;
                        const matchAmount = items
                            .filter((item: any) => sessionIds.has(item.schedule_id))
                            .reduce((ss: number, item: any) => ss + (Number(item.amount) || 0), 0);
                        return s + matchAmount;
                    }, 0);

                g.paidAmount = directPaid + legacyPaid;
            });

            child.programGroups = Object.values(groupMap);
            // 프로그램별 paidAmount 합산으로 child.paid 동기화 (payments 직접합과 괴리 방지)
            child.paid = child.programGroups.reduce((sum, g) => sum + g.paidAmount, 0);
        });

        return { childList: Object.values(childMap) };
    }, [schedules, payments, searchTerm]);

    const stats = useMemo(() => buildChildMap(), [buildChildMap]);

    const changeMonth = (offset: number) => {
        const d = new Date(selectedMonth + "-01");
        d.setMonth(d.getMonth() + offset);
        setSelectedMonth(d.toISOString().slice(0, 7));
    };

    const getBillingStatus = (child: ChildBillingData) => {
        const balance = child.totalFee - child.paid;
        if (child.totalFee === 0 && child.paid === 0) return { label: '미확정', color: 'text-slate-400 bg-slate-100 dark:bg-slate-800' };
        if (balance < 0) return { label: '과납', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' };
        if (balance === 0) return { label: '완납', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' };
        return { label: '미수', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' };
    };

    return (
        <div className={cn("p-4 md:p-8 space-y-6 min-h-screen", isDark ? "bg-slate-950" : "bg-slate-50")}>
            <Helmet><title>수납 관리 - 자라다</title></Helmet>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>수납 관리</h1>
                    <ExcelExportButton data={stats.childList} fileName={`수납리스트_${selectedMonth}`}
                        headers={['name', 'totalFee', 'paid', 'credit']}
                        headerLabels={{ name: '아동명', totalFee: '총 수업료', paid: '기수납액', credit: '이월금 잔액' }} />
                </div>
                <div className={cn("flex items-center gap-2 p-2 rounded-2xl border shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                    <button onClick={() => changeMonth(-1)} className={cn("p-1.5 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100")}><ChevronLeft size={18} /></button>
                    <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={cn("font-bold text-base cursor-pointer outline-none bg-transparent", isDark ? "text-white" : "text-slate-900")} />
                    <button onClick={() => changeMonth(1)} className={cn("p-1.5 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100")}><ChevronRight size={18} /></button>
                </div>
            </div>

            <div className={cn("rounded-[28px] border shadow-xl overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                <div className={cn("px-4 md:px-8 py-4 md:py-5 border-b flex flex-col md:flex-row gap-3 md:justify-between md:items-center", isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200")}>
                    <div className={cn("flex items-center gap-2 font-bold", isDark ? "text-white" : "text-slate-800")}><Receipt className="text-blue-600" size={18} /> {selectedMonth.split('-')[1]}월 수납 대장</div>
                    <div className="relative">
                        <Search className={cn("absolute left-3 top-3 w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
                        <input type="text" placeholder="아동 이름 검색.." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className={cn("pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none w-full md:w-64", isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "border-slate-200 bg-white")} />
                    </div>
                </div>

                {/* 📱 모바일 카드 레이아웃 */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                        <div className="p-12 text-center"><Loader2 className="animate-spin inline-block w-8 h-8 text-blue-500" /></div>
                    ) : stats.childList.length === 0 ? (
                        <div className={cn("p-12 text-center font-bold", isDark ? "text-slate-600" : "text-slate-400")}>해당 조건의 데이터가 없습니다.</div>
                    ) : stats.childList.map(child => {
                        const balance = child.totalFee - child.paid;
                        const status = getBillingStatus(child);
                        return (
                            <div key={child.id} onClick={() => { setSelectedChild(child); setIsModalOpen(true); }}
                                className={cn("p-4 space-y-2.5 active:bg-blue-50/30 cursor-pointer transition-colors", isDark && "active:bg-slate-800/40")}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-400")}><User size={16} /></div>
                                        <div>
                                            <p className={cn("font-black text-base", isDark ? "text-white" : "text-slate-900")}>{child.name}</p>
                                            <p className={cn("text-[11px]", isDark ? "text-slate-500" : "text-slate-400")}>
                                                완료 {child.completedCount}회
                                                {child.carriedOverCount > 0 && <span className="text-purple-400 ml-1">· 이월 {child.carriedOverCount}회</span>}
                                                {child.cancelledCount > 0 && <span className="text-rose-400 ml-1">· 취소 {child.cancelledCount}회</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black shrink-0", status.color)}>{status.label}</span>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {child.programGroups.map(pg => (
                                        <span key={pg.programId} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")}>{pg.programName}</span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-xs pt-1">
                                    <div>
                                        <span className={cn("block text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>수업료</span>
                                        <span className={cn("font-black", isDark ? "text-slate-200" : "text-slate-700")}>{child.totalFee.toLocaleString()}원</span>
                                    </div>
                                    <div>
                                        <span className={cn("block text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>이월금</span>
                                        <span className={cn("font-bold", child.credit > 0 ? "text-purple-500" : isDark ? "text-slate-600" : "text-slate-300")}>{child.credit > 0 ? `${child.credit.toLocaleString()}원` : '-'}</span>
                                    </div>
                                    <div>
                                        <span className={cn("block text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>기수납</span>
                                        <span className={cn("font-bold", isDark ? "text-slate-400" : "text-slate-500")}>{child.paid.toLocaleString()}원</span>
                                    </div>
                                    <div>
                                        <span className={cn("block text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>미수금</span>
                                        <span className={cn("font-black text-sm", balance > 0 ? "text-rose-500" : balance < 0 ? "text-indigo-500" : "text-emerald-500")}>
                                            {balance === 0 ? "0원" : balance > 0 ? `${balance.toLocaleString()}원` : `+${Math.abs(balance).toLocaleString()}원`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 🖥️ 데스크톱 테이블 */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-50 text-slate-400")}>
                            <tr>
                                <th className="px-6 py-4">아동 / 치료 프로그램</th>
                                <th className="px-6 py-4 text-right">수업료</th>
                                <th className="px-6 py-4 text-right">이월금</th>
                                <th className="px-6 py-4 text-right">기수납액</th>
                                <th className="px-6 py-4 text-right">미수금</th>
                                <th className="px-6 py-4 text-center">상태</th>
                                <th className="px-6 py-4 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                            {loading ? (
                                <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="animate-spin inline-block w-8 h-8 text-blue-500" /></td></tr>
                            ) : stats.childList.length === 0 ? (
                                <tr><td colSpan={7} className={cn("p-16 text-center font-bold", isDark ? "text-slate-600" : "text-slate-400")}>해당 조건의 데이터가 없습니다.</td></tr>
                            ) : stats.childList.map(child => {
                                const balance = child.totalFee - child.paid;
                                const status = getBillingStatus(child);
                                return (
                                    <tr key={child.id} onClick={() => { setSelectedChild(child); setIsModalOpen(true); }}
                                        className={cn("transition-all cursor-pointer group", isDark ? "hover:bg-slate-800/40" : "hover:bg-blue-50/30")}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", isDark ? "bg-slate-700 text-slate-400 group-hover:bg-indigo-800 group-hover:text-indigo-300" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500")}><User size={18} /></div>
                                                <div>
                                                    <p className={cn("font-black text-base", isDark ? "text-white" : "text-slate-900")}>{child.name}</p>
                                                    <p className={cn("text-xs mt-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
                                                        완료 {child.completedCount}회
                                                        {child.carriedOverCount > 0 && <span className="text-purple-400 ml-1">· 이월 {child.carriedOverCount}회</span>}
                                                        {child.scheduledCount > 0 && <span className="ml-1">· 예정 {child.scheduledCount}회</span>}
                                                        {child.cancelledCount > 0 && <span className="text-rose-400 ml-1">· 취소 {child.cancelledCount}회</span>}
                                                    </p>
                                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                                        {child.programGroups.map(pg => (
                                                            <span key={pg.programId} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")}>{pg.programName}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={cn("px-6 py-5 text-right font-black", isDark ? "text-slate-200" : "text-slate-700")}>{child.totalFee.toLocaleString()}원</td>
                                        <td className="px-6 py-5 text-right">
                                            {child.credit > 0 ? <span className="font-black text-purple-500">{child.credit.toLocaleString()}원</span> : <span className={cn("font-bold", isDark ? "text-slate-700" : "text-slate-300")}>-</span>}
                                        </td>
                                        <td className={cn("px-6 py-5 text-right font-bold", isDark ? "text-slate-400" : "text-slate-500")}>{child.paid.toLocaleString()}원</td>
                                        <td className={cn("px-6 py-5 text-right font-black text-lg", balance > 0 ? "text-rose-500" : balance < 0 ? "text-indigo-500" : "text-emerald-500")}>
                                            {balance === 0 ? "0원" : balance > 0 ? `${balance.toLocaleString()}원` : `+${Math.abs(balance).toLocaleString()}원`}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={cn("px-3 py-1 rounded-full text-xs font-black", status.color)}>{status.label}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button className={cn("px-5 py-2 rounded-xl font-black text-sm transition-all shadow active:scale-95", isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-blue-600")}>수납 상세</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && selectedChild && (
                <PaymentModal childData={selectedChild} month={selectedMonth} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} isDark={isDark} />
            )}
        </div>
    );
}

// ──────────────────────────────
// 카드형 인라인 수납 모달
// ──────────────────────────────
function PaymentModal({ childData, month, onClose, onSuccess, isDark }: PaymentModalProps) {
    const { center } = useCenter();
    const [loading, setLoading] = useState(false);
    const [localSessions, setLocalSessions] = useState<BillingSession[]>(childData.sessions);
    const [localGroups, setLocalGroups] = useState<ProgramGroup[]>(childData.programGroups);
    const [expandedId, setExpandedId] = useState<string | null>(childData.programGroups[0]?.programId ?? null);
    const [showHistory, setShowHistory] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<TableRow<'payments'>[]>([]);

    // 세션별 수납 추적 (상세정보 포함)
    interface PaidDetail { amount: number; method: string; memo: string; paymentId: string; }
    const [paidMap, setPaidMap] = useState<Record<string, PaidDetail>>({});
    const [paidMapLoaded, setPaidMapLoaded] = useState(false);
    const [sessionInputs, setSessionInputs] = useState<Record<string, { amount: number; method: string; memo: string }>>({});
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [creditUsed, setCreditUsed] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPaidInputs, setEditPaidInputs] = useState<Record<string, { amount: number; method: string; memo: string }>>({})

    // ✨ [NEW] 스케줄 메모 (모든 상태에서 사용 가능 — schedules.notes 컬럼에 저장)
    const [scheduleMemos, setScheduleMemos] = useState<Record<string, string>>({});
    const [savingMemoId, setSavingMemoId] = useState<string | null>(null);

    // 월 이동
    const [modalMonth, setModalMonth] = useState(month);
    const [isLoadingMonth, setIsLoadingMonth] = useState(false);

    const updateSessionInput = (sid: string, field: string, value: string | number) =>
        setSessionInputs(prev => ({ ...prev, [sid]: { ...prev[sid], [field]: value } }));

    const activeGroup = localGroups.find(g => g.programId === expandedId) ?? localGroups[0];
    const sortedSessions = useMemo(() =>
        activeGroup ? [...activeGroup.sessions].sort((a, b) => a.date.localeCompare(b.date)) : [],
        [activeGroup?.sessions]
    );

    // DB에서 세션별 수납 상태+상세정보 로드
    useEffect(() => {
        const load = async () => {
            const ids = localSessions.map(s => s.id);
            if (ids.length === 0) return;
            const { data } = await supabase.from('payment_items').select('schedule_id, amount, payment_id, payments(method, memo)').in('schedule_id', ids);
            const map: Record<string, PaidDetail> = {};
            data?.forEach((item: any) => {
                if (item.schedule_id) {
                    const prev = map[item.schedule_id];
                    const isRefundItem = item.payments?.method === '환불';
                    const prevIsRefund = prev?.method === '환불';
                    map[item.schedule_id] = {
                        amount: (prev?.amount || 0) + (Number(item.amount) || 0),
                        // 환불 항목이 하나라도 있으면 '환불'로 고정
                        method: (isRefundItem || prevIsRefund) ? '환불' : (item.payments?.method || prev?.method || ''),
                        memo: isRefundItem ? (item.payments?.memo || prev?.memo || '') : (prev?.memo || item.payments?.memo || ''),
                        paymentId: item.payment_id || prev?.paymentId || '',
                    };
                }
            });
            setPaidMap(map);
            setPaidMapLoaded(true);
        };
        load();
        const inputs: Record<string, { amount: number; method: string; memo: string }> = {};
        const memos: Record<string, string> = {};
        localSessions.forEach(s => {
            inputs[s.id] = { amount: s.price, method: '카드', memo: '' };
            memos[s.id] = s.notes || '';
        });
        setSessionInputs(inputs);
        setScheduleMemos(memos);
    }, [localSessions]);

    // 탭 전환 시 체크 초기화
    useEffect(() => { setCheckedIds(new Set()); setCreditUsed(0); }, [expandedId]);

    // 월 이동 시 데이터 재로드
    useEffect(() => {
        if (modalMonth === month) {
            setLocalSessions(childData.sessions);
            setLocalGroups(childData.programGroups);
            return;
        }
        const fetchOtherMonth = async () => {
            if (!center?.id) return;
            setIsLoadingMonth(true);
            try {
                const d = new Date(`${modalMonth}-01T00:00:00`);
                d.setMonth(d.getMonth() + 1);
                const nextM = d.toISOString().slice(0, 10);
                const { data: sData } = await supabase.from('schedules')
                    .select('*, children(*), programs(*)').eq('child_id', childData.id)
                    .gte('start_time', `${modalMonth}-01`).lt('start_time', nextM)
                    .order('start_time', { ascending: false });
                const { data: pData } = await supabase.from('payments')
                    .select('*, payment_items(*)').eq('child_id', childData.id)
                    .eq('payment_month', modalMonth);

                const sessions: BillingSession[] = ((sData || []) as any[]).map(item => {
                    const isCanceled = item.status === 'cancelled';
                    const isCarriedOver = item.status === 'carried_over';
                    const programPrice = item.programs?.price || 0;
                    return { ...item, date: toLocalDateStr(item.start_time), price: (isCanceled || isCarriedOver) ? 0 : programPrice, isCanceled, isCarriedOver, notes: item.notes || null };
                });
                const gMap: Record<string, ProgramGroup> = {};
                sessions.forEach(s => {
                    const pid = (s.programs as any)?.id || 'unknown';
                    if (!gMap[pid]) gMap[pid] = {
                        programId: pid, programName: (s.programs as any)?.name || '미분류',
                        programCategory: (s.programs as any)?.category || null, programDescription: (s.programs as any)?.description || null,
                        pricePerSession: (s.programs as any)?.price || 0, sessions: [],
                        totalFee: 0, completedFee: 0, paidAmount: 0,
                        completedCount: 0, scheduledCount: 0, cancelledCount: 0, carriedOverCount: 0,
                    };
                    gMap[pid].sessions.push(s);
                    if (!s.isCanceled && !s.isCarriedOver) gMap[pid].totalFee += s.price;
                    if (s.status === 'completed') { gMap[pid].completedFee += s.price; gMap[pid].completedCount++; }
                    else if (s.isCarriedOver) gMap[pid].carriedOverCount++;
                    else if (s.isCanceled) gMap[pid].cancelledCount++;
                    else if (s.status === 'scheduled') gMap[pid].scheduledCount++;
                });
                const payments = (pData || []) as any[];
                Object.values(gMap).forEach(g => {
                    const sids = new Set(g.sessions.map(s => s.id));
                    const direct = payments.filter(p => p.program_id === g.programId)
                        .reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.credit_used) || 0), 0);
                    const legacy = payments.filter(p => !p.program_id)
                        .reduce((sum, p) => {
                            const items: any[] = p.payment_items || [];
                            return sum + items.filter((i: any) => sids.has(i.schedule_id))
                                .reduce((ss: number, i: any) => ss + (Number(i.amount) || 0), 0);
                        }, 0);
                    g.paidAmount = direct + legacy;
                });
                setLocalSessions(sessions);
                const groups = Object.values(gMap);
                setLocalGroups(groups);
                if (groups.length > 0) setExpandedId(groups[0].programId);
            } catch (e) { console.error('월 데이터 로드 오류', e); }
            finally { setIsLoadingMonth(false); }
        };
        fetchOtherMonth();
    }, [modalMonth]);

    // 계산값
    const payableSessions = useMemo(() => sortedSessions.filter(s => !s.isCanceled && !s.isCarriedOver), [sortedSessions]);
    const unpaidPayable = useMemo(() => payableSessions.filter(s => !paidMap[s.id]?.amount), [payableSessions, paidMap]);
    const checkedTotal = useMemo(() => [...checkedIds].reduce((sum, id) => sum + (sessionInputs[id]?.amount || 0), 0), [checkedIds, sessionInputs]);
    // 요약 바: paidMap에서 실시간 합계 계산 (수납/환불/수정 즉시 반영)
    const groupPaidTotal = useMemo(() =>
        sortedSessions.reduce((sum, s) => sum + (paidMap[s.id]?.amount || 0), 0),
        [sortedSessions, paidMap]
    );
    const groupRemaining = (activeGroup?.totalFee || 0) - groupPaidTotal;

    const toggleCheck = (sid: string) => setCheckedIds(prev => { const n = new Set(prev); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
    const selectAllUnpaid = () => setCheckedIds(new Set(unpaidPayable.map(s => s.id)));

    // 수납 이력
    const loadPaymentHistory = async () => {
        if (!showHistory) {
            const { data } = await supabase.from('payments').select('*').eq('child_id', childData.id).eq('payment_month', modalMonth).order('created_at', { ascending: false });
            setPaymentHistory(data || []);
        }
        setShowHistory(p => !p);
    };

    // 세션 상태 변경
    const handleStatusChange = useCallback(async (sid: string, newStatus: ScheduleStatus) => {
        const session = localSessions.find(s => s.id === sid);
        if (!session) return;
        const isCancel = newStatus === 'cancelled';
        const isCarryOver = newStatus === 'carried_over';
        if (isCancel && !confirm('수업을 취소하시겠습니까?')) return;

        const paidDetail = paidMap[sid];
        const isPaidSession = paidDetail && paidDetail.amount > 0 && paidDetail.method !== '환불';

        if (isCarryOver && isPaidSession) {
            if (!confirm('⚠️ 이 수업은 이미 수납 완료되었습니다.\n이월 전환 시 기존 수납이 자동 환불됩니다.\n\n계속하시겠습니까?')) return;
        } else if (isCarryOver) {
            if (!confirm('이월 처리하시겠습니까? 해당 금액이 이월금에 적립됩니다.')) return;
        }

        setLoading(true);
        try {
            await supabase.from('schedules').update({ status: newStatus } as never).eq('id', sid);
            const programPrice = session.programs?.price || 0;
            const prevCarried = session.status === 'carried_over';

            if (isCarryOver && !prevCarried) {
                if (isPaidSession && center?.id) {
                    // ✨ [이월 전환 자동환불] 수납 완료된 세션 → 환불 후 이월금 복원
                    // 원래 결제의 현금/이월금 비율 확인
                    const { data: origPay } = await supabase.from('payments')
                        .select('amount, credit_used')
                        .eq('id', paidDetail.paymentId)
                        .maybeSingle();
                    const cashPaid = Number(origPay?.amount) || 0;
                    const creditUsedInPay = Number(origPay?.credit_used) || 0;

                    // 현금 환불 기록 생성 (감사 추적용)
                    if (cashPaid > 0) {
                        const { data: refPay } = await supabase.from('payments').insert({
                            child_id: childData.id, center_id: center.id,
                            amount: -cashPaid, credit_used: 0,
                            method: '환불(이월)', memo: `이월 전환 자동환불: ${session.date}`,
                            payment_month: modalMonth,
                            ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                        } as any).select('id').single();
                        if (refPay) {
                            await supabase.from('payment_items').insert({
                                schedule_id: sid, payment_id: refPay.id, amount: -cashPaid,
                            } as any);
                        }
                    }

                    // 이월금으로 결제된 부분 → 이월금으로 복원 (RPC 원자적 처리)
                    if (creditUsedInPay > 0) {
                        await adjustCredit(childData.id, creditUsedInPay);
                    }

                    // paidMap 업데이트 (환불 상태)
                    setPaidMap(prev => ({ ...prev, [sid]: { amount: 0, method: '환불', memo: '이월 전환 자동환불', paymentId: paidDetail.paymentId } }));
                } else {
                    // 미수납 세션 → 이월금 적립 (RPC 원자적 처리)
                    await adjustCredit(childData.id, programPrice);
                }
            }
            if (prevCarried && !isCarryOver) {
                // ✨ [안전장치] 자동환불된 세션(이월금 복원만 한 경우)은 이월금 차감하지 않음
                const wasAutoRefunded = paidDetail && paidDetail.method === '환불' && (paidDetail.memo || '').includes('이월');
                if (!wasAutoRefunded) {
                    // 이월 상태 해제 → 이월금 차감 (RPC 원자적 처리, 음수 방지 내장)
                    await adjustCredit(childData.id, -programPrice);
                }
            }
            const newPrice = (isCancel || isCarryOver) ? 0 : programPrice;
            const updatedSessions = localSessions.map(s =>
                s.id === sid ? { ...s, status: newStatus, isCanceled: isCancel, isCarriedOver: isCarryOver, price: newPrice } : s
            );
            setLocalSessions(updatedSessions);
            setLocalGroups(prev => prev.map(g => {
                const gs = updatedSessions.filter(s => (s.programs?.id || 'unknown') === g.programId);
                return {
                    ...g, sessions: gs,
                    totalFee: gs.filter(s => !s.isCanceled && !s.isCarriedOver).reduce((s, x) => s + x.price, 0),
                    completedFee: gs.filter(s => s.status === 'completed').reduce((s, x) => s + x.price, 0),
                    completedCount: gs.filter(s => s.status === 'completed').length,
                    scheduledCount: gs.filter(s => s.status === 'scheduled').length,
                    cancelledCount: gs.filter(s => s.isCanceled).length,
                    carriedOverCount: gs.filter(s => s.isCarriedOver).length,
                };
            }));
            onSuccess();
        } catch { alert('상태 변경 오류'); } finally { setLoading(false); }
    }, [localSessions, childData.id, paidMap, center, modalMonth, activeGroup, onSuccess]);

    // 일괄 수납
    const handleBulkPay = async () => {
        if (!center?.id || checkedIds.size === 0) return;
        const sessions = sortedSessions.filter(s => checkedIds.has(s.id));
        const totalAmount = sessions.reduce((sum, s) => sum + (sessionInputs[s.id]?.amount || 0), 0);
        const creditAmt = Math.min(creditUsed, totalAmount);
        const cashAmount = totalAmount - creditAmt;
        if (totalAmount <= 0) { alert('결제 금액을 확인하세요.'); return; }
        if (!confirm(`${sessions.length}건, 총 ${totalAmount.toLocaleString()}원을 수납하시겠습니까?`)) return;
        setLoading(true);
        try {
            // 체크된 세션들의 결제수단 결정 (모두 같으면 해당 수단, 혼합이면 '혼합')
            const methods = [...new Set(sessions.map(s => sessionInputs[s.id]?.method || '카드'))];
            const payMethod = creditAmt > 0 && cashAmount <= 0 ? '크레딧' : methods.length === 1 ? methods[0] : '혼합';
            const memos = sessions.map(s => sessionInputs[s.id]?.memo).filter(Boolean);
            const payMemo = memos.length > 0 ? memos.join(', ') : activeGroup?.programName || '';
            const { data: pay, error } = await supabase.from('payments').insert({
                child_id: childData.id, center_id: center.id,
                amount: cashAmount, credit_used: creditAmt,
                method: payMethod, memo: payMemo,
                payment_month: modalMonth,
                ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
            } as TableInsert<'payments'>).select().maybeSingle();
            if (error) throw error;
            if (pay) {
                const items: TableInsert<'payment_items'>[] = sessions.map(s => ({
                    payment_id: pay.id, schedule_id: s.id,
                    amount: sessionInputs[s.id]?.amount || s.price,
                    ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                }));
                if (items.length > 0) await supabase.from('payment_items').insert(items);
            }
            if (creditAmt > 0) {
                // 일괄 수납 시 이월금 차감 (RPC 원자적 처리)
                await adjustCredit(childData.id, -creditAmt);
            }
            alert(`${sessions.length}건 수납이 완료되었습니다.`);
            onSuccess(); onClose();
        } catch (err: any) { alert('수납 오류: ' + err.message); } finally { setLoading(false); }
    };

    // 세션별 환불
    const handleSessionRefund = async (session: BillingSession) => {
        if (!center?.id) return;
        const paidAmount = paidMap[session.id]?.amount || 0;
        if (paidAmount <= 0) { alert('수납된 금액이 없습니다.'); return; }
        if (!confirm(`${session.date} (${paidAmount.toLocaleString()}원)을 환불하시겠습니까?`)) return;
        setLoading(true);
        try {
            // 1) 환불 payment 레코드 생성 (음수 금액)
            const { data: refundPayment, error: refundError } = await supabase.from('payments').insert({
                child_id: childData.id, center_id: center.id,
                amount: -paidAmount, method: '환불', payment_month: modalMonth,
                memo: `환불: ${session.date}`,
                ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
            } as TableInsert<'payments'>).select('id').single();
            if (refundError) throw refundError;

            // 2) 환불 payment_item 추가 (음수 금액) — 기존 payment_items는 삭제하지 않음!
            //    이렇게 하면 load() 시 합산 금액=0 + method='환불' → "환불완료" 유지
            await supabase.from('payment_items').insert({
                schedule_id: session.id,
                payment_id: refundPayment.id,
                amount: -paidAmount,
            } as any);

            // 3) 로컬 상태 업데이트
            setPaidMap(prev => ({ ...prev, [session.id]: { amount: 0, method: '환불', memo: `환불완료 (${paidAmount.toLocaleString()}원)`, paymentId: refundPayment.id } }));
            alert('환불이 완료되었습니다.');
            onSuccess();
        } catch (e: any) { alert('환불 오류: ' + e.message); } finally { setLoading(false); }
    };

    // 전체 환불
    const handleBulkRefund = async () => {
        if (!center?.id) return;
        const paidSessions = sortedSessions.filter(s => (paidMap[s.id]?.amount || 0) > 0);
        if (paidSessions.length === 0) { alert('환불할 수납 건이 없습니다.'); return; }
        const totalRefund = paidSessions.reduce((sum, s) => sum + (paidMap[s.id]?.amount || 0), 0);
        if (!confirm(`${paidSessions.length}건, 총 ${totalRefund.toLocaleString()}원을 전체 환불하시겠습니까?`)) return;
        setLoading(true);
        try {
            const newPaidMap = { ...paidMap };
            for (const s of paidSessions) {
                const amt = paidMap[s.id]?.amount || 0;
                const { data: refundPayment, error } = await supabase.from('payments').insert({
                    child_id: childData.id, center_id: center.id,
                    amount: -amt, method: '환불', payment_month: modalMonth,
                    memo: `전체환불: ${s.date}`,
                    ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                } as TableInsert<'payments'>).select('id').single();
                if (error) throw error;
                // 음수 payment_item 추가 (기존 삭제하지 않음)
                await supabase.from('payment_items').insert({
                    schedule_id: s.id,
                    payment_id: refundPayment.id,
                    amount: -amt,
                } as any);
                newPaidMap[s.id] = { amount: 0, method: '환불', memo: `환불완료 (${amt.toLocaleString()}원)`, paymentId: refundPayment.id };
            }
            setPaidMap(newPaidMap);
            alert(`${paidSessions.length}건 전체 환불이 완료되었습니다.`);
            onSuccess();
        } catch (e: any) { alert('전체 환불 오류: ' + e.message); } finally { setLoading(false); }
    };

    const styleIcons = useMemo(() => ({
        carryOver: <ArrowRightCircle size={14} />,
        cancel: <Ban size={14} />,
        paid: <CheckCircle2 size={14} />,
        refunded: <RotateCcw size={14} />,
        completed: <CheckCircle2 size={14} />,
        default: <Clock size={14} />,
    }), []);

    const getStyle = useCallback((s: BillingSession) => {
        const paidDetail = paidMap[s.id];
        const isPaid = !!paidDetail?.amount;
        const isRefunded = paidDetail && paidDetail.method === '환불';
        if (s.isCarriedOver) return { bg: isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200', text: 'text-purple-600 dark:text-purple-400', icon: styleIcons.carryOver };
        if (s.isCanceled) return { bg: isDark ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200', text: 'text-rose-500 dark:text-rose-400', icon: styleIcons.cancel };
        if (isRefunded) return { bg: isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200', text: 'text-orange-600 dark:text-orange-400', icon: styleIcons.refunded };
        if (isPaid) return { bg: isDark ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600 dark:text-emerald-400', icon: styleIcons.paid };
        if (s.status === 'completed') return { bg: isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200', text: 'text-blue-600 dark:text-blue-400', icon: styleIcons.completed };
        return { bg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200', text: 'text-slate-500 dark:text-slate-400', icon: styleIcons.default };
    }, [paidMap, isDark, styleIcons]);

    const programColors = useMemo(() => [
        { bar: 'bg-blue-500', tab: isDark ? 'bg-blue-900/60 text-blue-300 border-blue-700' : 'bg-blue-600 text-white border-blue-600', tabOff: isDark ? 'text-slate-400 hover:text-blue-300' : 'text-slate-500 hover:text-blue-600', pay: isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700' },
        { bar: 'bg-violet-500', tab: isDark ? 'bg-violet-900/60 text-violet-300 border-violet-700' : 'bg-violet-600 text-white border-violet-600', tabOff: isDark ? 'text-slate-400 hover:text-violet-300' : 'text-slate-500 hover:text-violet-600', pay: isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-violet-600 hover:bg-violet-700' },
        { bar: 'bg-teal-500', tab: isDark ? 'bg-teal-900/60 text-teal-300 border-teal-700' : 'bg-teal-600 text-white border-teal-600', tabOff: isDark ? 'text-slate-400 hover:text-teal-300' : 'text-slate-500 hover:text-teal-600', pay: isDark ? 'bg-teal-600 hover:bg-teal-500' : 'bg-teal-600 hover:bg-teal-700' },
        { bar: 'bg-orange-500', tab: isDark ? 'bg-orange-900/60 text-orange-300 border-orange-700' : 'bg-orange-500 text-white border-orange-500', tabOff: isDark ? 'text-slate-400 hover:text-orange-300' : 'text-slate-500 hover:text-orange-600', pay: isDark ? 'bg-orange-500 hover:bg-orange-400' : 'bg-orange-500 hover:bg-orange-600' },
    ], [isDark]);
    const activeColorIdx = localGroups.findIndex(g => g.programId === activeGroup?.programId) % programColors.length;
    const pc = programColors[activeColorIdx >= 0 ? activeColorIdx : 0];

    // 개별 세션 수납
    const handleSinglePay = async (session: BillingSession) => {
        if (!center?.id) return;
        const inp = sessionInputs[session.id];
        if (!inp || inp.amount <= 0) { alert('금액을 확인하세요.'); return; }
        if (!confirm(`${session.date} ${inp.amount.toLocaleString()}원 (${inp.method}) 수납하시겠습니까?`)) return;
        setLoading(true);
        try {
            const { data: pay, error } = await supabase.from('payments').insert({
                child_id: childData.id, center_id: center.id,
                amount: inp.amount, credit_used: 0,
                method: inp.method, memo: inp.memo || activeGroup?.programName || '',
                payment_month: modalMonth,
                ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
            } as TableInsert<'payments'>).select().maybeSingle();
            if (error) throw error;
            if (pay) {
                await supabase.from('payment_items').insert({
                    payment_id: pay.id, schedule_id: session.id,
                    amount: inp.amount,
                    ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                } as TableInsert<'payment_items'>);
            }
            setPaidMap(prev => ({
                ...prev, [session.id]: {
                    amount: inp.amount, method: inp.method,
                    memo: inp.memo || activeGroup?.programName || '', paymentId: pay?.id || ''
                }
            }));
            setCheckedIds(prev => { const n = new Set(prev); n.delete(session.id); return n; });
            alert('수납이 완료되었습니다.');
            onSuccess();
        } catch (e: any) { alert('수납 오류: ' + e.message); } finally { setLoading(false); }
    };

    // ✨ [NEW] 개별 세션 이월금 사용 수납
    const handleCreditSinglePay = async (session: BillingSession) => {
        if (!center?.id) return;
        const price = session.price || activeGroup?.pricePerSession || 0;
        if (price <= 0) { alert('금액을 확인하세요.'); return; }

        // 최신 이월금 잔액 조회 (UI 표시용)
        const { data: freshChild } = await supabase.from('children').select('credit').eq('id', childData.id).maybeSingle();
        const currentCredit = freshChild?.credit || 0;
        if (currentCredit <= 0) { alert('사용 가능한 이월금이 없습니다.'); return; }

        const useAmount = Math.min(currentCredit, price);
        const cashAmount = price - useAmount;

        if (!confirm(`${session.date} 수업료 ${price.toLocaleString()}원 중 이월금 ${useAmount.toLocaleString()}원을 사용합니다.${cashAmount > 0 ? `\n나머지 ${cashAmount.toLocaleString()}원은 별도 수납이 필요합니다.` : '\n전액 이월금으로 수납됩니다.'}`)) return;

        setLoading(true);
        try {
            const { data: pay, error } = await supabase.from('payments').insert({
                child_id: childData.id, center_id: center.id,
                amount: cashAmount, credit_used: useAmount,
                method: '이월금', memo: `이월금 사용 (${session.date})`,
                payment_month: modalMonth,
                ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
            } as TableInsert<'payments'>).select().maybeSingle();
            if (error) throw error;
            if (pay) {
                await supabase.from('payment_items').insert({
                    payment_id: pay.id, schedule_id: session.id,
                    amount: price,
                    ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                } as TableInsert<'payment_items'>);
            }
            // 이월금 차감 (RPC 원자적 처리)
            await adjustCredit(childData.id, -useAmount);

            setPaidMap(prev => ({
                ...prev, [session.id]: {
                    amount: price, method: '이월금',
                    memo: `이월금 ${useAmount.toLocaleString()}원 사용`, paymentId: pay?.id || ''
                }
            }));
            alert(`이월금 ${useAmount.toLocaleString()}원이 적용되었습니다.`);
            onSuccess(); onClose();
        } catch (e: any) { alert('이월금 사용 오류: ' + e.message); } finally { setLoading(false); }
    };

    // ✨ [NEW] 스케줄 메모 개별 저장 (모든 상태에서 가능)
    const saveScheduleMemo = async (sid: string) => {
        const memo = scheduleMemos[sid] ?? '';
        setSavingMemoId(sid);
        try {
            const { error } = await supabase
                .from('schedules')
                .update({ notes: memo || null } as never)
                .eq('id', sid);
            if (error) throw error;
            // 로컬 세션 데이터에도 반영
            setLocalSessions(prev => prev.map(s => s.id === sid ? { ...s, notes: memo || null } : s));
            alert('메모가 저장되었습니다.');
        } catch (e: any) {
            alert('메모 저장 실패: ' + e.message);
        } finally {
            setSavingMemoId(null);
        }
    };

    // 수납완료 세션 인라인 수정
    const startEditPaid = (sid: string) => {
        const detail = paidMap[sid];
        if (!detail) return;
        setEditingId(sid);
        setEditPaidInputs(prev => ({ ...prev, [sid]: { amount: detail.amount, method: detail.method || '카드', memo: detail.memo || '' } }));
    };
    const handleUpdatePayment = async (sid: string) => {
        const detail = paidMap[sid];
        const edit = editPaidInputs[sid];
        if (!detail?.paymentId || !edit) return;
        setLoading(true);
        try {
            // 해당 세션이 공유 payment에 속해있는지 확인
            const { data: siblingItems } = await supabase
                .from('payment_items').select('id')
                .eq('payment_id', detail.paymentId);
            const isShared = (siblingItems?.length || 0) > 1;

            if (isShared) {
                // 공유 payment → 해당 세션을 분리하여 개별 payment 생성
                // 1. 기존 payment_item 삭제
                await supabase.from('payment_items').delete()
                    .eq('schedule_id', sid).eq('payment_id', detail.paymentId);

                // 2. 기존 payment 금액 차감
                const { data: oldPay } = await supabase.from('payments')
                    .select('amount').eq('id', detail.paymentId).maybeSingle();
                if (oldPay) {
                    const remainingAmt = (oldPay.amount || 0) - detail.amount;
                    if (remainingAmt <= 0) {
                        await supabase.from('payments').delete().eq('id', detail.paymentId);
                    } else {
                        await supabase.from('payments').update({ amount: remainingAmt }).eq('id', detail.paymentId);
                    }
                }

                // 3. 새 개별 payment 생성
                const { data: newPay } = await supabase.from('payments').insert({
                    child_id: childData.id, center_id: center?.id || '',
                    amount: edit.amount, credit_used: 0,
                    method: edit.method, memo: edit.memo,
                    payment_month: modalMonth,
                    ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                } as TableInsert<'payments'>).select().maybeSingle();

                // 4. 새 payment_item 생성
                if (newPay) {
                    await supabase.from('payment_items').insert({
                        payment_id: newPay.id, schedule_id: sid,
                        amount: edit.amount,
                        ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
                    } as TableInsert<'payment_items'>);
                    setPaidMap(prev => ({
                        ...prev,
                        [sid]: { amount: edit.amount, method: edit.method, memo: edit.memo, paymentId: newPay.id }
                    }));
                }
            } else {
                // 단독 payment → 직접 수정
                await supabase.from('payments').update({
                    amount: edit.amount, method: edit.method, memo: edit.memo
                }).eq('id', detail.paymentId);
                await supabase.from('payment_items').update({ amount: edit.amount })
                    .eq('schedule_id', sid).eq('payment_id', detail.paymentId);
                setPaidMap(prev => ({
                    ...prev,
                    [sid]: { ...prev[sid], amount: edit.amount, method: edit.method, memo: edit.memo }
                }));
            }

            setEditingId(null);
            onSuccess();
        } catch (e: any) { alert('수정 오류: ' + e.message); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={cn("rounded-2xl w-full max-w-5xl flex flex-col shadow-2xl overflow-hidden", isDark ? "bg-slate-900" : "bg-white")} style={{ height: 'min(90vh, 820px)' }}>

                {/* ── 헤더 */}
                <div className={cn("px-7 py-5 flex justify-between items-start shrink-0 border-b", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
                    <div>
                        <h2 className={cn("text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>{childData.name}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <button onClick={() => { const d = new Date(modalMonth + '-01'); d.setMonth(d.getMonth() - 1); setModalMonth(d.toISOString().slice(0, 7)); }}
                                className={cn("p-1 rounded-lg transition-colors", isDark ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400")}>
                                <ChevronLeft size={16} />
                            </button>
                            <p className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-slate-600")}>
                                {modalMonth.replace('-', '년 ')}월 수납 상세
                            </p>
                            <button onClick={() => { const d = new Date(modalMonth + '-01'); d.setMonth(d.getMonth() + 1); setModalMonth(d.toISOString().slice(0, 7)); }}
                                className={cn("p-1 rounded-lg transition-colors", isDark ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400")}>
                                <ChevronRight size={16} />
                            </button>
                            {modalMonth !== month && (
                                <button onClick={() => setModalMonth(month)}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 ml-1">
                                    이번 달
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={loadPaymentHistory} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", showHistory ? (isDark ? "bg-blue-800 text-blue-300" : "bg-blue-100 text-blue-600") : (isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"))}>
                            <History size={14} />이력
                        </button>
                        <button onClick={onClose} className={cn("p-1.5 rounded-full ml-1 transition-all", isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}><X size={20} /></button>
                    </div>
                </div>

                {/* ── 수납 이력 드롭다운 */}
                {showHistory && (
                    <div className={cn("px-6 py-3 border-b shrink-0 max-h-36 overflow-y-auto", isDark ? "bg-slate-800/70 border-slate-700" : "bg-blue-50 border-blue-100")}>
                        {paymentHistory.length === 0 ? <p className="text-xs text-slate-400">이번 달 수납 기록 없음</p> : (
                            <div className="flex flex-wrap gap-2">
                                {paymentHistory.map(ph => (
                                    <div key={ph.id} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs", isDark ? "bg-slate-900" : "bg-white shadow-sm")}>
                                        <span className={cn("font-black", (Number(ph.amount) || 0) < 0 ? 'text-rose-500' : 'text-emerald-500')}>{ph.method}</span>
                                        {ph.memo && <span className="text-slate-400 truncate max-w-[120px]">{ph.memo}</span>}
                                        <span className={cn("font-black", (Number(ph.amount) || 0) < 0 ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-700')}>
                                            {(Number(ph.amount) || 0) >= 0 ? '+' : ''}{Number(ph.amount || 0).toLocaleString()}원
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 이월금 배너 (항상 표시) */}
                <div className={cn("px-6 py-3 border-b flex items-center gap-3 shrink-0",
                    childData.credit > 0
                        ? (isDark ? "bg-indigo-900/20 border-indigo-800" : "bg-indigo-50 border-indigo-100")
                        : (isDark ? "bg-purple-900/10 border-purple-900/30" : "bg-purple-50/50 border-purple-100")
                )}>
                    <ArrowRightCircle className={cn("shrink-0", childData.credit > 0 ? "text-indigo-500" : isDark ? "text-purple-700" : "text-purple-300")} size={16} />
                    <span className={cn("text-sm font-black",
                        childData.credit > 0
                            ? (isDark ? "text-indigo-300" : "text-indigo-700")
                            : (isDark ? "text-purple-400/70" : "text-purple-400")
                    )}>
                        이월금 잔액 {childData.credit > 0 ? `${childData.credit.toLocaleString()}원` : '없음'}
                    </span>
                    {childData.credit > 0 && unpaidPayable.length > 0 && (
                        <button onClick={() => { selectAllUnpaid(); setCreditUsed(Math.min(childData.credit, Math.max(0, groupRemaining))); }}
                            className="ml-auto px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all">
                            전체 이월금 사용
                        </button>
                    )}
                </div>

                {/* ── 프로그램 탭 */}
                <div className={cn("px-6 pt-3 pb-0 flex gap-2 border-b shrink-0 overflow-x-auto", isDark ? "border-slate-700" : "border-gray-200")}>
                    {localGroups.map((g, gi) => {
                        const gpc = programColors[gi % programColors.length];
                        const isActive = expandedId === g.programId;
                        const gPaid = isActive ? groupPaidTotal : g.paidAmount;
                        const gBalance = g.totalFee - gPaid;
                        const gStatus = g.totalFee === 0 && gPaid === 0 ? 'none'
                            : gBalance < 0 ? 'over' : gBalance === 0 ? 'full' : 'unpaid';
                        return (
                            <button key={g.programId} onClick={() => setExpandedId(g.programId)}
                                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-t-xl border text-sm font-black shrink-0 transition-all -mb-px",
                                    isActive ? gpc.tab : cn("border-transparent", gpc.tabOff, isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"))}>
                                <span className={cn("w-2 h-2 rounded-full shrink-0", gpc.bar)} />
                                {g.programName}
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-black",
                                    gStatus === 'over' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                                        : gStatus === 'full' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                            : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400")}>
                                    {gStatus === 'over' ? `과납 +${Math.abs(gBalance).toLocaleString()}원`
                                        : gStatus === 'full' ? '완납'
                                            : `미수 ${gBalance.toLocaleString()}원`}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── 프로그램 요약 바 */}
                {activeGroup && (
                    <div className={cn("px-6 py-3 flex items-center gap-6 border-b shrink-0 text-sm", isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-gray-100")}>
                        <span className={cn("font-bold", isDark ? "text-slate-500" : "text-slate-400")}>{activeGroup.pricePerSession.toLocaleString()}원/회</span>
                        <span className={cn("font-black", isDark ? "text-slate-300" : "text-slate-600")}>
                            총 {activeGroup.sessions.length}회기
                            <span className={cn("ml-2 font-medium", isDark ? "text-slate-500" : "text-slate-400")}>
                                완료 {activeGroup.completedCount}
                                {activeGroup.cancelledCount > 0 && ` · 취소 ${activeGroup.cancelledCount}`}
                                {activeGroup.carriedOverCount > 0 && ` · 이월 ${activeGroup.carriedOverCount}`}
                                {activeGroup.scheduledCount > 0 && ` · 예정 ${activeGroup.scheduledCount}`}
                            </span>
                        </span>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="text-right">
                                <p className={cn("text-xs font-bold", isDark ? "text-slate-500" : "text-slate-400")}>수업료</p>
                                <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-800")}>{activeGroup.totalFee.toLocaleString()}원</p>
                            </div>
                            <div className={cn("w-px h-8", isDark ? "bg-slate-700" : "bg-gray-200")} />
                            <div className="text-right">
                                <p className={cn("text-xs font-bold", isDark ? "text-slate-500" : "text-slate-400")}>수납완료</p>
                                <p className={cn("text-sm font-black", groupPaidTotal >= activeGroup.totalFee ? "text-emerald-500" : "text-blue-500")}>{groupPaidTotal.toLocaleString()}원</p>
                            </div>
                            <div className={cn("w-px h-8", isDark ? "bg-slate-700" : "bg-gray-200")} />
                            <div className="text-right">
                                <p className={cn("text-xs font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                                    {groupRemaining < 0 ? '과납' : '미수금'}
                                </p>
                                <p className={cn("text-sm font-black",
                                    groupRemaining > 0 ? "text-rose-500" : groupRemaining < 0 ? "text-indigo-500" : "text-emerald-500")}>
                                    {groupRemaining < 0 ? `+${Math.abs(groupRemaining).toLocaleString()}원` : `${Math.max(0, groupRemaining).toLocaleString()}원`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 세션 테이블 (스크롤) */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {(!paidMapLoaded || isLoadingMonth) ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-slate-400" />
                        </div>
                    ) : (<>
                        {/* 상단 액션 바 */}
                        <div className="flex items-center justify-between mb-2 gap-2">
                            <p className={cn("text-sm font-black shrink-0", isDark ? "text-slate-500" : "text-slate-400")}>회기별 상태</p>
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                {unpaidPayable.length > 0 && (['카드', '현금', '계좌이체'] as const).map(method => (
                                    <button key={method}
                                        onClick={() => { selectAllUnpaid(); unpaidPayable.forEach(s => updateSessionInput(s.id, 'method', method)); }}
                                        className={cn("text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shrink-0 border",
                                            isDark ? "border-slate-700 text-blue-400 hover:bg-slate-800" : "border-blue-200 text-blue-600 hover:bg-blue-50")}>
                                        {method === '카드' ? '💳' : method === '현금' ? '💵' : '🏦'} 전체 {method}
                                    </button>
                                ))}
                                {sortedSessions.some(s => (paidMap[s.id]?.amount || 0) > 0) && (
                                    <button onClick={handleBulkRefund} disabled={loading}
                                        className={cn("text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shrink-0 border",
                                            isDark ? "border-rose-800 text-rose-400 hover:bg-rose-900/40" : "border-rose-200 text-rose-500 hover:bg-rose-50")}>
                                        ↻ 전체 환불
                                    </button>
                                )}
                            </div>
                        </div>

                        {sortedSessions.length === 0 ? (
                            <div className={cn("py-12 text-center rounded-xl border-2 border-dashed",
                                isDark ? "border-slate-700 text-slate-600" : "border-slate-200 text-slate-400")}>
                                <p className="font-bold">이 달에는 수업 기록이 없습니다.</p>
                            </div>
                        ) : (
                            <div className={cn("rounded-xl border overflow-hidden", isDark ? "border-slate-700" : "border-slate-200")}>
                                {/* 테이블 헤더 */}
                                <div className={cn("grid grid-cols-[28px_32px_1fr_70px_90px_1.5fr_auto] gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider",
                                    isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-50 text-slate-400")}>
                                    <span></span><span>#</span><span>날짜/상태</span><span>결제수단</span><span className="text-right">금액</span><span><span className="flex items-center gap-0.5"><StickyNote size={12} />메모</span></span><span className="text-right">관리</span>
                                </div>

                                {/* 테이블 행 */}
                                {sortedSessions.map((s, i) => {
                                    const ss = getStyle(s);
                                    const isPaid = !!paidMap[s.id]?.amount;
                                    const isPayable = !s.isCanceled && !s.isCarriedOver;
                                    const isChecked = checkedIds.has(s.id);
                                    const inp = sessionInputs[s.id];
                                    const paidDetail = paidMap[s.id];

                                    return (
                                        <div key={s.id} className={cn(
                                            "grid grid-cols-[28px_32px_1fr_70px_90px_1.5fr_auto] gap-2 px-3 py-3 items-center border-t [&>*]:min-w-0",
                                            isDark ? "border-slate-800" : "border-slate-100",
                                            isChecked && (isDark ? "bg-blue-900/20" : "bg-blue-50/60"),
                                            s.isCarriedOver && (isDark ? "bg-purple-900/10" : "bg-purple-50/30"),
                                            s.isCanceled && (isDark ? "bg-rose-900/10" : "bg-rose-50/30"),
                                            paidDetail?.method === '환불' && (isDark ? "bg-orange-900/10" : "bg-orange-50/30"),
                                            isPaid && paidDetail?.method !== '환불' && (isDark ? "bg-emerald-900/10" : "bg-emerald-50/30"),
                                        )}>
                                            {/* 체크박스 */}
                                            {isPayable && !isPaid ? (
                                                <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(s.id)}
                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer accent-blue-600" />
                                            ) : <div className="w-3.5" />}

                                            {/* # */}
                                            <span className={cn("text-xs font-black", ss.text)}>{i + 1}</span>

                                            {/* 날짜 + 상태 */}
                                            <div className="min-w-0">
                                                <span className={cn("text-sm font-bold", isDark ? "text-slate-200" : "text-slate-700")}>{s.date.slice(5)}</span>
                                                <div className={cn("flex items-center gap-1 mt-0.5", ss.text)}>
                                                    {ss.icon}
                                                    <span className="text-[11px] font-bold">
                                                        {paidDetail?.method === '환불' ? '환불완료' : s.isCarriedOver ? '이월' : s.isCanceled ? '취소' : isPaid ? '수납완료' : s.status === 'completed' ? '수업완료' : '예정'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 결제수단 */}
                                            {isPayable && !isPaid ? (
                                                <select value={inp?.method || '카드'} onChange={e => updateSessionInput(s.id, 'method', e.target.value)}
                                                    className={cn("px-1.5 py-1 rounded text-xs font-bold outline-none border w-full cursor-pointer",
                                                        isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-600")}>
                                                    <option value="카드">💳카드</option>
                                                    <option value="현금">💵현금</option>
                                                    <option value="계좌이체">🏦계좌</option>
                                                </select>
                                            ) : isPaid && editingId === s.id ? (
                                                <select value={editPaidInputs[s.id]?.method || '카드'}
                                                    onChange={e => setEditPaidInputs(prev => ({ ...prev, [s.id]: { ...prev[s.id], method: e.target.value } }))}
                                                    className={cn("px-1.5 py-1 rounded text-xs font-bold outline-none border w-full cursor-pointer",
                                                        isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-600")}>
                                                    <option value="카드">💳카드</option>
                                                    <option value="현금">💵현금</option>
                                                    <option value="계좌이체">🏦계좌</option>
                                                </select>
                                            ) : isPaid ? (
                                                <span className={cn("text-xs font-bold", isDark ? "text-emerald-400" : "text-emerald-600")}>{paidDetail?.method || '-'}</span>
                                            ) : (
                                                <span className={cn("text-xs", isDark ? "text-slate-600" : "text-slate-300")}>-</span>
                                            )}

                                            {/* 금액 */}
                                            {isPayable && !isPaid ? (
                                                <input type="number" value={inp?.amount || ''}
                                                    onChange={e => updateSessionInput(s.id, 'amount', Number(e.target.value))}
                                                    className={cn("w-full text-right font-black text-sm outline-none rounded px-1.5 py-1 border",
                                                        isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800")} />
                                            ) : isPaid && editingId === s.id ? (
                                                <input type="number" value={editPaidInputs[s.id]?.amount || ''}
                                                    onChange={e => setEditPaidInputs(prev => ({ ...prev, [s.id]: { ...prev[s.id], amount: Number(e.target.value) } }))}
                                                    className={cn("w-full text-right font-black text-sm outline-none rounded px-1.5 py-1 border",
                                                        isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800")} />
                                            ) : isPaid ? (
                                                <span className="text-sm font-black text-emerald-500 text-right">{paidDetail?.amount?.toLocaleString()}</span>
                                            ) : (
                                                <span className={cn("text-sm text-right", isDark ? "text-slate-600" : "text-slate-300")}>-</span>
                                            )}

                                            {/* ✨ 통합 메모 (schedules.notes에 저장 — 모든 상태에서 편집 가능) */}
                                            <div className="flex items-center gap-1 min-w-0">
                                                <input type="text" placeholder="메모 입력..."
                                                    value={scheduleMemos[s.id] ?? ''}
                                                    onChange={e => setScheduleMemos(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveScheduleMemo(s.id); }}
                                                    className={cn("flex-1 px-2 py-1 rounded text-xs outline-none border min-w-0",
                                                        isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-600 placeholder-slate-400")} />
                                                <button
                                                    onClick={() => saveScheduleMemo(s.id)}
                                                    disabled={savingMemoId === s.id || (scheduleMemos[s.id] ?? '') === (s.notes ?? '')}
                                                    title="메모 저장 (Enter키로도 저장)"
                                                    className={cn("p-0.5 rounded shrink-0 transition-all",
                                                        (scheduleMemos[s.id] ?? '') !== (s.notes ?? '')
                                                            ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400"
                                                            : "text-slate-300 dark:text-slate-600 cursor-not-allowed")}
                                                >
                                                    {savingMemoId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                                </button>
                                            </div>

                                            {/* 관리 */}
                                            <div className="flex items-center gap-1 justify-end shrink-0">
                                                {isPayable && !isPaid && (
                                                    <>
                                                        <button onClick={() => handleSinglePay(s)} disabled={loading}
                                                            className="px-2.5 py-1 rounded text-[11px] font-black bg-blue-600 text-white shrink-0">
                                                            수납
                                                        </button>
                                                        {childData.credit > 0 && (
                                                            <button onClick={() => handleCreditSinglePay(s)} disabled={loading}
                                                                className="px-2.5 py-1 rounded text-[11px] font-black bg-purple-600 text-white shrink-0 whitespace-nowrap">
                                                                이월금 사용
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {isPaid && editingId === s.id ? (
                                                    <>
                                                        <button onClick={() => handleUpdatePayment(s.id)} disabled={loading}
                                                            className="px-2.5 py-1 rounded text-[11px] font-black bg-emerald-600 text-white shrink-0 flex items-center gap-0.5">
                                                            <Save size={9} /> 저장
                                                        </button>
                                                        <button onClick={() => setEditingId(null)}
                                                            className={cn("px-2 py-1 rounded text-[11px] font-black border shrink-0",
                                                                isDark ? "border-slate-600 text-slate-400" : "border-slate-200 text-slate-400")}>
                                                            취소
                                                        </button>
                                                    </>
                                                ) : isPaid ? (
                                                    <>
                                                        <button onClick={() => startEditPaid(s.id)}
                                                            className={cn("px-2 py-1 rounded text-[11px] font-black border flex items-center gap-0.5 shrink-0",
                                                                isDark ? "border-slate-600 text-slate-400" : "border-slate-200 text-slate-400")}>
                                                            <Pencil size={10} /> 수정
                                                        </button>
                                                        <button onClick={() => handleSessionRefund(s)} disabled={loading}
                                                            className={cn("px-2 py-1 rounded text-[11px] font-black border flex items-center gap-0.5 shrink-0",
                                                                isDark ? "border-rose-800 text-rose-400" : "border-rose-200 text-rose-500")}>
                                                            <RotateCcw size={10} /> 환불
                                                        </button>
                                                    </>
                                                ) : null}
                                                {/* 상태 드롭다운 — 모든 상태에서 변경 가능 */}
                                                <select value={s.status}
                                                    onChange={e => handleStatusChange(s.id, e.target.value as ScheduleStatus)}
                                                    disabled={loading}
                                                    className={cn("text-[11px] font-bold px-1.5 py-1 rounded border-none outline-none cursor-pointer",
                                                        isDark ? "bg-black/30 text-white" : "bg-white text-slate-500 shadow-sm")}>
                                                    <option value="scheduled">예정</option>
                                                    <option value="completed">완료</option>
                                                    <option value="cancelled">취소</option>
                                                    <option value="carried_over">이월</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>)}
                </div>

                {/* ── 하단 고정 바 */}
                <div className={cn("px-6 py-4 border-t shrink-0 space-y-3", isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-gray-200")}>
                    {/* 크레딧 사용 표시 */}
                    {creditUsed > 0 && (
                        <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl border", isDark ? "bg-indigo-900/30 border-indigo-800" : "bg-indigo-50 border-indigo-200")}>
                            <span className="text-xs font-black text-indigo-500 flex items-center gap-1"><ArrowRightCircle size={12} />이월금 적용</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-indigo-500 text-sm">-{creditUsed.toLocaleString()}원</span>
                                <button onClick={() => setCreditUsed(0)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={13} /></button>
                            </div>
                        </div>
                    )}

                    {/* 일괄 수납 버튼 + 결제수단 일괄 변경 */}
                    <div className="flex items-center gap-2">
                        {checkedIds.size > 0 ? (
                            <>
                                <div className="flex items-center gap-1 shrink-0">
                                    {(['카드', '현금', '계좌이체'] as const).map(m => (
                                        <button key={m}
                                            onClick={() => [...checkedIds].forEach(id => updateSessionInput(id, 'method', m))}
                                            className={cn("px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                                isDark ? "border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400" : "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600")}>
                                            {m === '카드' ? '💳' : m === '현금' ? '💵' : '🏦'}
                                        </button>
                                    ))}
                                </div>
                                <p className={cn("flex-1 text-xs font-bold min-w-0", isDark ? "text-slate-500" : "text-slate-400")}>
                                    {checkedIds.size}건 선택
                                </p>
                            </>
                        ) : (
                            <p className={cn("flex-1 text-xs font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                                체크박스로 수납할 회기를 선택하세요
                            </p>
                        )}
                        <button onClick={handleBulkPay} disabled={loading || checkedIds.size === 0}
                            className={cn("px-5 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 shadow shrink-0 whitespace-nowrap",
                                checkedIds.size > 0
                                    ? cn(pc.pay, "text-white active:scale-95")
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed")}>
                            {loading ? <Loader2 size={15} className="animate-spin" /> : (
                                <><Receipt size={14} />{checkedIds.size}건 일괄 수납{checkedTotal > 0 ? ` ${Math.max(0, checkedTotal - creditUsed).toLocaleString()}원` : ''}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}