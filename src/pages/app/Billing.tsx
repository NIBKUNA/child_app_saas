/**
 * 🎨 Zarada ERP - 수납 관리 v4
 * 치료(프로그램)별 완전 분리 수납 + 카드형 인라인 수납 모달
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { toLocalDateStr } from '@/utils/timezone';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';
import {
    ChevronLeft, ChevronRight, Search, Loader2, User, X,
    ArrowRightCircle, RotateCcw, History,
    CheckCircle2, Clock, Ban,
    Receipt
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
            const { data: sData } = await supabase
                .from('schedules')
                .select(`*, children!inner (*), programs (*)`)
                .eq('children.center_id', center.id)
                .gte('start_time', `${selectedMonth}-01`)
                .lt('start_time', nextMonth)
                .order('start_time', { ascending: false });

            const { data: pData } = await supabase
                .from('payments')
                .select(`*, payment_items(*), children!inner(center_id)`)
                .eq('payment_month', selectedMonth)
                .eq('children.center_id', center.id) as { data: any[] | null };

            setSchedules((sData || []) as unknown as ScheduleData[]);
            setPayments((pData || []) as unknown as TableRow<'payments'>[]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, center]);

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

            childMap[childId].sessions.push({ ...item, date, price, isCanceled, isCarriedOver });

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
        <div className={cn("p-8 space-y-6 min-h-screen", isDark ? "bg-slate-950" : "bg-slate-50")}>
            <Helmet><title>수납 관리 - 자라다</title></Helmet>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>수납 관리</h1>
                    <ExcelExportButton data={stats.childList} fileName={`수납리스트_${selectedMonth}`}
                        headers={['name', 'totalFee', 'paid', 'credit']}
                        headerLabels={{ name: '아동명', totalFee: '총 수업료', paid: '기수납액', credit: '잔여 크레딧' }} />
                </div>
                <div className={cn("flex items-center gap-2 p-2 rounded-2xl border shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                    <button onClick={() => changeMonth(-1)} className={cn("p-1.5 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100")}><ChevronLeft size={18} /></button>
                    <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={cn("font-bold text-base cursor-pointer outline-none bg-transparent", isDark ? "text-white" : "text-slate-900")} />
                    <button onClick={() => changeMonth(1)} className={cn("p-1.5 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100")}><ChevronRight size={18} /></button>
                </div>
            </div>

            <div className={cn("rounded-[28px] border shadow-xl overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                <div className={cn("px-8 py-5 border-b flex justify-between items-center", isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200")}>
                    <div className={cn("flex items-center gap-2 font-bold", isDark ? "text-white" : "text-slate-800")}><Receipt className="text-blue-600" size={18} /> {selectedMonth.split('-')[1]}월 수납 대장</div>
                    <div className="relative">
                        <Search className={cn("absolute left-3 top-3 w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
                        <input type="text" placeholder="아동 이름 검색.." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className={cn("pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none w-64", isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "border-slate-200 bg-white")} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "bg-slate-800/60 text-slate-500" : "bg-slate-50 text-slate-400")}>
                            <tr>
                                <th className="px-6 py-4">아동 / 치료 프로그램</th>
                                <th className="px-6 py-4 text-right">수업료</th>
                                <th className="px-6 py-4 text-right">이월 크레딧</th>
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

    // 세션별 수납 추적
    const [paidMap, setPaidMap] = useState<Record<string, number>>({});
    const [paidMapLoaded, setPaidMapLoaded] = useState(false);
    const [sessionInputs, setSessionInputs] = useState<Record<string, { amount: number; method: string; memo: string }>>({});
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [creditUsed, setCreditUsed] = useState(0);

    const updateSessionInput = (sid: string, field: string, value: string | number) =>
        setSessionInputs(prev => ({ ...prev, [sid]: { ...prev[sid], [field]: value } }));

    const activeGroup = localGroups.find(g => g.programId === expandedId) ?? localGroups[0];
    const sortedSessions = useMemo(() =>
        activeGroup ? [...activeGroup.sessions].sort((a, b) => a.date.localeCompare(b.date)) : [],
        [activeGroup]
    );

    // DB에서 세션별 수납 상태 로드
    useEffect(() => {
        const load = async () => {
            const ids = localSessions.map(s => s.id);
            if (ids.length === 0) return;
            const { data } = await supabase.from('payment_items').select('schedule_id, amount').in('schedule_id', ids);
            const map: Record<string, number> = {};
            data?.forEach(item => {
                if (item.schedule_id) map[item.schedule_id] = (map[item.schedule_id] || 0) + (Number(item.amount) || 0);
            });
            setPaidMap(map);
            setPaidMapLoaded(true);
        };
        load();
        const inputs: Record<string, { amount: number; method: string; memo: string }> = {};
        localSessions.forEach(s => { inputs[s.id] = { amount: s.price, method: '카드', memo: '' }; });
        setSessionInputs(inputs);
    }, [localSessions]);

    // 탭 전환 시 체크 초기화
    useEffect(() => { setCheckedIds(new Set()); setCreditUsed(0); }, [expandedId]);

    // 계산값
    const payableSessions = sortedSessions.filter(s => !s.isCanceled && !s.isCarriedOver);
    const unpaidPayable = payableSessions.filter(s => !paidMap[s.id]);
    const checkedTotal = [...checkedIds].reduce((sum, id) => sum + (sessionInputs[id]?.amount || 0), 0);
    // 요약 바: buildChildMap에서 정확히 계산한 paidAmount 사용 (payment_items 합산 괴리 방지)
    const groupPaidTotal = activeGroup?.paidAmount || 0;
    const groupRemaining = (activeGroup?.totalFee || 0) - groupPaidTotal;

    const toggleCheck = (sid: string) => setCheckedIds(prev => { const n = new Set(prev); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
    const selectAllUnpaid = () => setCheckedIds(new Set(unpaidPayable.map(s => s.id)));

    // 수납 이력
    const loadPaymentHistory = async () => {
        if (!showHistory) {
            const { data } = await supabase.from('payments').select('*').eq('child_id', childData.id).eq('payment_month', month).order('created_at', { ascending: false });
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
        if (isCarryOver && !confirm('이월 처리하시겠습니까? 해당 금액이 크레딧에 적립됩니다.')) return;
        setLoading(true);
        try {
            await supabase.from('schedules').update({ status: newStatus } as never).eq('id', sid);
            const programPrice = session.programs?.price || 0;
            const prevCarried = session.status === 'carried_over';
            if (isCarryOver && !prevCarried) {
                const { data: c } = await supabase.from('children').select('credit').eq('id', childData.id).single();
                await supabase.from('children').update({ credit: (c?.credit || 0) + programPrice }).eq('id', childData.id);
            }
            if (prevCarried && !isCarryOver) {
                const { data: c } = await supabase.from('children').select('credit').eq('id', childData.id).single();
                await supabase.from('children').update({ credit: Math.max(0, (c?.credit || 0) - programPrice) }).eq('id', childData.id);
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
    }, [localSessions, childData.id, onSuccess]);

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
                payment_month: month,
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
                const { data: freshChild } = await supabase.from('children').select('credit').eq('id', childData.id).single();
                await supabase.from('children').update({ credit: Math.max(0, (freshChild?.credit || 0) - creditAmt) }).eq('id', childData.id);
            }
            alert(`${sessions.length}건 수납이 완료되었습니다.`);
            onSuccess(); onClose();
        } catch (err: any) { alert('수납 오류: ' + err.message); } finally { setLoading(false); }
    };

    // 세션별 환불
    const handleSessionRefund = async (session: BillingSession) => {
        if (!center?.id) return;
        const paidAmount = paidMap[session.id] || 0;
        if (paidAmount <= 0) { alert('수납된 금액이 없습니다.'); return; }
        if (!confirm(`${session.date} (${paidAmount.toLocaleString()}원)을 환불하시겠습니까?`)) return;
        setLoading(true);
        try {
            await supabase.from('payments').insert({
                child_id: childData.id, center_id: center.id,
                amount: -paidAmount, method: '환불', payment_month: month,
                memo: `환불: ${session.date}`,
                ...(activeGroup && activeGroup.programId !== 'unknown' ? { program_id: activeGroup.programId } : {}),
            } as TableInsert<'payments'>);
            await supabase.from('payment_items').delete().eq('schedule_id', session.id);
            setPaidMap(prev => { const n = { ...prev }; delete n[session.id]; return n; });
            alert('환불이 완료되었습니다.');
            onSuccess();
        } catch (e: any) { alert('환불 오류: ' + e.message); } finally { setLoading(false); }
    };

    // 스타일
    const getStyle = (s: BillingSession) => {
        const isPaid = !!paidMap[s.id];
        if (s.isCarriedOver) return { bg: isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200', text: 'text-purple-600 dark:text-purple-400', icon: <ArrowRightCircle size={14} /> };
        if (s.isCanceled) return { bg: isDark ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200', text: 'text-rose-500 dark:text-rose-400', icon: <Ban size={14} /> };
        if (isPaid) return { bg: isDark ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle2 size={14} /> };
        if (s.status === 'completed') return { bg: isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200', text: 'text-blue-600 dark:text-blue-400', icon: <CheckCircle2 size={14} /> };
        return { bg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200', text: 'text-slate-500 dark:text-slate-400', icon: <Clock size={14} /> };
    };

    const programColors = [
        { bar: 'bg-blue-500', tab: isDark ? 'bg-blue-900/60 text-blue-300 border-blue-700' : 'bg-blue-600 text-white border-blue-600', tabOff: isDark ? 'text-slate-400 hover:text-blue-300' : 'text-slate-500 hover:text-blue-600', pay: isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700' },
        { bar: 'bg-violet-500', tab: isDark ? 'bg-violet-900/60 text-violet-300 border-violet-700' : 'bg-violet-600 text-white border-violet-600', tabOff: isDark ? 'text-slate-400 hover:text-violet-300' : 'text-slate-500 hover:text-violet-600', pay: isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-violet-600 hover:bg-violet-700' },
        { bar: 'bg-teal-500', tab: isDark ? 'bg-teal-900/60 text-teal-300 border-teal-700' : 'bg-teal-600 text-white border-teal-600', tabOff: isDark ? 'text-slate-400 hover:text-teal-300' : 'text-slate-500 hover:text-teal-600', pay: isDark ? 'bg-teal-600 hover:bg-teal-500' : 'bg-teal-600 hover:bg-teal-700' },
        { bar: 'bg-orange-500', tab: isDark ? 'bg-orange-900/60 text-orange-300 border-orange-700' : 'bg-orange-500 text-white border-orange-500', tabOff: isDark ? 'text-slate-400 hover:text-orange-300' : 'text-slate-500 hover:text-orange-600', pay: isDark ? 'bg-orange-500 hover:bg-orange-400' : 'bg-orange-500 hover:bg-orange-600' },
    ];
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
                payment_month: month,
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
            setPaidMap(prev => ({ ...prev, [session.id]: inp.amount }));
            setCheckedIds(prev => { const n = new Set(prev); n.delete(session.id); return n; });
            alert('수납이 완료되었습니다.');
            onSuccess();
        } catch (e: any) { alert('수납 오류: ' + e.message); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={cn("rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden", isDark ? "bg-slate-900" : "bg-white")} style={{ height: 'min(90vh, 820px)' }}>

                {/* ── 헤더 */}
                <div className={cn("px-7 py-5 flex justify-between items-start shrink-0 border-b", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
                    <div>
                        <h2 className={cn("text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>{childData.name}</h2>
                        <p className={cn("text-sm mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>{month.replace('-', '년 ')}월 수납 상세</p>
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

                {/* ── 이월 크레딧 배너 */}
                {childData.credit > 0 && (
                    <div className={cn("px-6 py-2.5 border-b flex items-center gap-3 shrink-0", isDark ? "bg-indigo-900/20 border-indigo-800" : "bg-indigo-50 border-indigo-100")}>
                        <ArrowRightCircle className="text-indigo-500 shrink-0" size={16} />
                        <span className={cn("text-sm font-black", isDark ? "text-indigo-300" : "text-indigo-700")}>이월 크레딧 {childData.credit.toLocaleString()}원</span>
                        <button onClick={() => { selectAllUnpaid(); setCreditUsed(Math.min(childData.credit, Math.max(0, groupRemaining))); }}
                            className="ml-auto px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all">
                            미수금에 적용
                        </button>
                    </div>
                )}

                {/* ── 프로그램 탭 */}
                <div className={cn("px-6 pt-3 pb-0 flex gap-2 border-b shrink-0 overflow-x-auto", isDark ? "border-slate-700" : "border-gray-200")}>
                    {localGroups.map((g, gi) => {
                        const gpc = programColors[gi % programColors.length];
                        const isActive = expandedId === g.programId;
                        const gPaid = g.paidAmount;
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
                    <div className={cn("px-6 py-3 flex items-center gap-6 border-b shrink-0 text-xs", isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-gray-100")}>
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
                                <p className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>수업료</p>
                                <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-800")}>{activeGroup.totalFee.toLocaleString()}원</p>
                            </div>
                            <div className={cn("w-px h-8", isDark ? "bg-slate-700" : "bg-gray-200")} />
                            <div className="text-right">
                                <p className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>수납완료</p>
                                <p className={cn("text-sm font-black", groupPaidTotal >= activeGroup.totalFee ? "text-emerald-500" : "text-blue-500")}>{groupPaidTotal.toLocaleString()}원</p>
                            </div>
                            <div className={cn("w-px h-8", isDark ? "bg-slate-700" : "bg-gray-200")} />
                            <div className="text-right">
                                <p className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
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

                {/* ── 세션 카드 리스트 (스크롤) */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                    {!paidMapLoaded ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-slate-400" />
                        </div>
                    ) : (<>
                        {/* 전체선택 헤더 */}
                        <div className="flex items-center justify-between mb-1">
                            <p className={cn("text-xs font-black", isDark ? "text-slate-500" : "text-slate-400")}>회기별 상태</p>
                            {unpaidPayable.length > 0 && (
                                <button onClick={selectAllUnpaid} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all", isDark ? "hover:bg-slate-800 text-blue-400" : "hover:bg-blue-50 text-blue-500")}>
                                    미수납 전체 선택 ({unpaidPayable.length}건)
                                </button>
                            )}
                        </div>

                        {sortedSessions.map((s, i) => {
                            const ss = getStyle(s);
                            const isPaid = !!paidMap[s.id];
                            const isPayable = !s.isCanceled && !s.isCarriedOver;
                            const isChecked = checkedIds.has(s.id);
                            const inp = sessionInputs[s.id];

                            return (
                                <div key={s.id} className="space-y-0">
                                    <div className={cn("rounded-xl border p-3.5 flex items-center gap-3 transition-all hover:shadow-md", ss.bg, isChecked && 'ring-2 ring-blue-400 dark:ring-blue-600')}>
                                        {/* 체크박스 */}
                                        {isPayable && !isPaid ? (
                                            <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(s.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 accent-blue-600" />
                                        ) : <div className="w-4 shrink-0" />}

                                        {/* 회기 번호 */}
                                        <span className={cn("w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0", isDark ? "bg-black/20" : "bg-white/70", ss.text)}>{i + 1}</span>

                                        {/* 날짜 + 상태 */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-sm font-bold", isDark ? "text-slate-200" : "text-slate-700")}>{s.date}</p>
                                            <div className={cn("flex items-center gap-1 mt-0.5", ss.text)}>
                                                {ss.icon}
                                                <span className="text-[11px] font-bold">
                                                    {s.isCarriedOver ? '이월' : s.isCanceled ? '취소' : isPaid ? '수납완료' : s.status === 'completed' ? '수업완료' : '예정'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 상태 변경 */}
                                        <select value={s.status}
                                            onChange={e => handleStatusChange(s.id, e.target.value as ScheduleStatus)}
                                            disabled={loading}
                                            className={cn("text-[11px] font-bold px-2 py-1.5 rounded-lg border-none outline-none cursor-pointer shrink-0", isDark ? "bg-black/30 text-white" : "bg-white text-slate-600 shadow-sm")}>
                                            <option value="scheduled">예정</option>
                                            <option value="completed">완료</option>
                                            <option value="cancelled">취소</option>
                                            <option value="carried_over">이월</option>
                                        </select>

                                        {/* 금액 */}
                                        {isPayable && !isPaid ? (
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <input type="number" value={inp?.amount || ''}
                                                    onChange={e => updateSessionInput(s.id, 'amount', Number(e.target.value))}
                                                    className={cn("w-24 text-right font-black text-sm outline-none rounded-lg px-2 py-1.5 border transition-all", isDark ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-800 focus:border-blue-400")} />
                                                <span className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>원</span>
                                            </div>
                                        ) : isPaid ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-sm font-black text-emerald-500">{paidMap[s.id].toLocaleString()}원</span>
                                                <button onClick={() => handleSessionRefund(s)} disabled={loading} title="환불"
                                                    className={cn("p-1.5 rounded-lg transition-all", isDark ? "hover:bg-rose-900/40 text-slate-500 hover:text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-500")}>
                                                    <RotateCcw size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={cn("text-sm font-bold shrink-0", isDark ? "text-slate-600" : "text-slate-300")}>─</span>
                                        )}
                                    </div>

                                    {/* 체크 시 확장: 결제수단 + 메모 + 개별수납 */}
                                    {isChecked && isPayable && !isPaid && (
                                        <div className={cn("ml-11 mr-2 px-4 py-2.5 rounded-b-xl border border-t-0 flex items-center gap-2",
                                            isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200")}>
                                            <select value={inp?.method || '카드'} onChange={e => updateSessionInput(s.id, 'method', e.target.value)}
                                                className={cn("px-2 py-1.5 rounded-lg text-[11px] font-bold outline-none border shrink-0 cursor-pointer",
                                                    isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-600")}>
                                                <option value="카드">💳 카드</option>
                                                <option value="현금">💵 현금</option>
                                                <option value="계좌이체">🏦 계좌이체</option>
                                            </select>
                                            <input type="text" placeholder="메모" value={inp?.memo || ''}
                                                onChange={e => updateSessionInput(s.id, 'memo', e.target.value)}
                                                className={cn("flex-1 px-2.5 py-1.5 rounded-lg text-[11px] outline-none border min-w-0",
                                                    isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-600 placeholder-slate-400")} />
                                            <button onClick={() => handleSinglePay(s)} disabled={loading}
                                                className={cn("px-3 py-1.5 rounded-lg text-[11px] font-black transition-all shrink-0",
                                                    isDark ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                                                {loading ? '...' : '수납'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>)}
                </div>

                {/* ── 하단 고정 바 */}
                <div className={cn("px-6 py-4 border-t shrink-0 space-y-3", isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-gray-200")}>
                    {/* 크레딧 사용 표시 */}
                    {creditUsed > 0 && (
                        <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl border", isDark ? "bg-indigo-900/30 border-indigo-800" : "bg-indigo-50 border-indigo-200")}>
                            <span className="text-xs font-black text-indigo-500 flex items-center gap-1"><ArrowRightCircle size={12} />크레딧 적용</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-indigo-500 text-sm">-{creditUsed.toLocaleString()}원</span>
                                <button onClick={() => setCreditUsed(0)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={13} /></button>
                            </div>
                        </div>
                    )}

                    {/* 일괄 수납 버튼 */}
                    <div className="flex items-center gap-2">
                        <p className={cn("flex-1 text-xs font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                            {checkedIds.size > 0 ? `${checkedIds.size}건 선택됨 · 각 카드에서 결제수단/메모 설정` : '체크박스로 수납할 회기를 선택하세요'}
                        </p>
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