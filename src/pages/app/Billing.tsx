/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 수납 관리 - 이월/크레딧 연동 완성판 (케어플 참고)
 * - carried_over 상태 지원
 * - 이월 크레딧 자동 표시
 * - center_id 필수 삽입
 * - 환불 기능
 * - 수납 이력 조회
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';
import {
    ChevronLeft, ChevronRight, Search, Loader2, User, X, CheckSquare, Square, Settings2, Receipt,
    ArrowRightCircle, RotateCcw, History, AlertTriangle
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

// ✨ 수납 상태 타입 정의 (carried_over 추가)
type ScheduleStatus = 'scheduled' | 'completed' | 'canceled' | 'cancelled' | 'carried_over' | 'makeup';

// ✨ 아동별 수납 세션 데이터 (Supabase join 결과)
interface ScheduleData extends Omit<TableRow<'schedules'>, 'status'> {
    status: ScheduleStatus;
    children: {
        id: string;
        name: string;
        credit: number | null;
        center_id: string | null;
    } | null;
    programs: {
        name: string;
        price: number;
    } | null;
}

// ✨ 아동별 수납 통합 데이터 (이월 크레딧 추가)
interface ChildBillingData {
    id: string;
    name: string;
    paid: number;
    credit: number;
    completed: number;
    carriedOverAmount: number;  // ⭐ 이월 금액 합계
    carriedOverCount: number;   // ⭐ 이월 횟수
    scheduledCount: number;     // 예정 횟수
    completedCount: number;     // 완료 횟수
    cancelledCount: number;     // 취소 횟수
    sessions: BillingSession[];
}

// ✨ 수납 세션 데이터 (내부 맵 저장용)
interface BillingSession {
    id: string;
    date: string;
    status: ScheduleStatus;
    price: number;
    isCanceled: boolean;
    isCarriedOver: boolean;     // ⭐ 이월 여부
    programs?: { name: string; price: number } | null;
}

// ✨ 수납 입력 폼 상태
interface PaymentInputs {
    card: number;
    cash: number;
    creditUsed: number;
    memo: string;
}

// ✨ PaymentModal Props
interface PaymentModalProps {
    childData: ChildBillingData;
    month: string;
    onClose: () => void;
    onSuccess: () => void;
    isDark: boolean;
}

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
            // ✨ [SECURITY] Enforce Center ID Filter via Inner Join
            const { data: sData } = await supabase
                .from('schedules')
                .select(`*, children!inner (*), programs (*)`)
                .eq('children.center_id', center.id)
                .order('start_time', { ascending: false });

            // ✨ [SECURITY] Enforce Center ID Filter via Inner Join on Payments
            const { data: pData } = await supabase
                .from('payments')
                .select(`*, payment_items(*), children!inner(center_id)`)
                .eq('payment_month', selectedMonth)
                .eq('children.center_id', center.id);

            setSchedules((sData || []) as unknown as ScheduleData[]);
            setPayments((pData || []) as unknown as TableRow<'payments'>[]);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, center]);

    const stats = useMemo(() => {
        const filteredSchedules = schedules.filter(s => s.start_time.includes(selectedMonth));
        const childMap: Record<string, ChildBillingData> = {};

        filteredSchedules.forEach(item => {
            const childId = item.children?.id;
            const childName = item.children?.name || '';

            if (!childId || (searchTerm && !childName.includes(searchTerm))) return;

            if (!childMap[childId]) {
                const childPaidTotal = payments
                    .filter(p => p.child_id === childId)
                    .reduce((sum: number, p) => sum + (Number(p.amount) || 0) + (Number(p.credit_used) || 0), 0);

                childMap[childId] = {
                    id: childId, name: childName, paid: childPaidTotal,
                    credit: item.children?.credit || 0,
                    completed: 0,
                    carriedOverAmount: 0,
                    carriedOverCount: 0,
                    scheduledCount: 0,
                    completedCount: 0,
                    cancelledCount: 0,
                    sessions: []
                };
            }

            const isCanceled = item.status === 'canceled' || item.status === 'cancelled';
            const isCarriedOver = item.status === 'carried_over';
            const programPrice = item.programs?.price || 0;
            // ⭐ 이월/취소된 세션은 수업료 0원 처리
            const price = (isCanceled || isCarriedOver) ? 0 : programPrice;
            const date = item.start_time.split('T')[0];

            childMap[childId].sessions.push({ ...item, date, price, isCanceled, isCarriedOver });

            // ⭐ 상태별 통계
            if (item.status === 'completed') {
                childMap[childId].completed += price;
                childMap[childId].completedCount++;
            } else if (isCarriedOver) {
                childMap[childId].carriedOverAmount += programPrice;
                childMap[childId].carriedOverCount++;
            } else if (isCanceled) {
                childMap[childId].cancelledCount++;
            } else if (item.status === 'scheduled') {
                childMap[childId].scheduledCount++;
            }
        });
        return { childList: Object.values(childMap) };
    }, [schedules, payments, selectedMonth, searchTerm]);

    const changeMonth = (offset: number) => {
        const d = new Date(selectedMonth + "-01");
        d.setMonth(d.getMonth() + offset);
        setSelectedMonth(d.toISOString().slice(0, 7));
    };

    // ⭐ 수납 상태 뱃지 계산
    const getBillingStatus = (child: ChildBillingData) => {
        const balance = child.completed - child.paid;
        if (child.completed === 0 && child.paid === 0) return { label: '미확정', color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500' };
        if (balance <= 0) return { label: '완납', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' };
        return { label: '미수', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' };
    };

    return (
        <div className={cn("p-8 space-y-6 min-h-screen transition-colors", isDark ? "bg-slate-950" : "bg-slate-50")}>
            <Helmet><title>수납 관리 - 자라다</title></Helmet>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>수납 관리</h1>
                    <ExcelExportButton
                        data={stats.childList}
                        fileName={`수납리스트_${selectedMonth}`}
                        headers={['name', 'completed', 'paid', 'credit', 'carriedOverAmount']}
                        headerLabels={{
                            name: '아동명',
                            completed: '총 수업료',
                            paid: '기수납액',
                            credit: '잔여 크레딧',
                            carriedOverAmount: '이월 금액'
                        }}
                    />
                </div>

                <div className={cn("flex items-center gap-3 p-2 rounded-2xl border shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                    <button onClick={() => changeMonth(-1)} className={cn("p-1 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100")}><ChevronLeft /></button>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={cn("font-bold border-none text-lg cursor-pointer outline-none bg-transparent", isDark ? "text-white" : "text-slate-900")} />
                    <button onClick={() => changeMonth(1)} className={cn("p-1 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100")}><ChevronRight /></button>
                </div>
            </div>

            <div className={cn("rounded-[32px] border shadow-xl overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                <div className={cn("p-8 border-b flex justify-between items-center", isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/50 border-slate-200")}>
                    <div className={cn("flex items-center gap-3 font-bold text-xl", isDark ? "text-white" : "text-slate-800")}><Receipt className="text-blue-600" /> {selectedMonth.split('-')[1]}월 수납 대장</div>

                    <div className="relative w-80">
                        <Search className={cn("absolute left-4 top-3.5 w-5 h-5", isDark ? "text-slate-500" : "text-slate-400")} />
                        <input
                            type="text"
                            placeholder="아동 이름 검색..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={cn("w-full pl-12 pr-4 py-3.5 border rounded-2xl text-sm transition-all outline-none", isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20" : "border-slate-200 focus:ring-4 focus:ring-blue-50")}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={cn("text-xs font-black uppercase tracking-widest", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400")}>
                            <tr>
                                <th className="p-4 md:p-8">아동 정보</th>
                                <th className="p-4 md:p-8 text-right">수업료(완료)</th>
                                <th className="p-4 md:p-8 text-right">이월 크레딧</th>
                                <th className="p-4 md:p-8 text-right">기수납액</th>
                                <th className="p-4 md:p-8 text-right">미수금</th>
                                <th className="p-4 md:p-8 text-center">상태</th>
                                <th className="p-4 md:p-8 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                            {loading ? (
                                <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="animate-spin inline-block w-8 h-8 text-blue-500" /></td></tr>
                            ) : stats.childList.length === 0 ? (
                                <tr><td colSpan={7} className={cn("p-20 text-center font-bold", isDark ? "text-slate-500" : "text-slate-400")}>해당 조건의 데이터가 없습니다.</td></tr>
                            ) : (
                                stats.childList.map((child: ChildBillingData) => {
                                    const balance = child.completed - child.paid;
                                    const status = getBillingStatus(child);
                                    return (
                                        <tr key={child.id} className={cn("transition-all cursor-pointer group", isDark ? "hover:bg-slate-800/50" : "hover:bg-blue-50/20")} onClick={() => { setSelectedChild(child); setIsModalOpen(true); }}>
                                            <td className={cn("p-4 md:p-8 font-bold text-lg md:text-xl", isDark ? "text-white" : "text-slate-900")}>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors shrink-0", isDark ? "bg-slate-800 text-slate-500 group-hover:bg-indigo-900 group-hover:text-indigo-400" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500")}><User /></div>
                                                    <div>
                                                        <p>{child.name}</p>
                                                        <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
                                                            완료 {child.completedCount}회
                                                            {child.carriedOverCount > 0 && <span className="text-purple-500 ml-1">· 이월 {child.carriedOverCount}회</span>}
                                                            {child.scheduledCount > 0 && <span className="ml-1">· 예정 {child.scheduledCount}회</span>}
                                                            {child.cancelledCount > 0 && <span className="text-rose-400 ml-1">· 취소 {child.cancelledCount}회</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={cn("p-4 md:p-8 text-right font-black", isDark ? "text-slate-200" : "text-slate-700")}>{child.completed.toLocaleString()}원</td>
                                            <td className="p-4 md:p-8 text-right">
                                                {child.credit > 0 ? (
                                                    <span className="font-black text-purple-500">{child.credit.toLocaleString()}원</span>
                                                ) : (
                                                    <span className={cn("font-bold", isDark ? "text-slate-600" : "text-slate-300")}>-</span>
                                                )}
                                            </td>
                                            <td className={cn("p-4 md:p-8 text-right font-bold", isDark ? "text-slate-500" : "text-slate-400")}>{child.paid.toLocaleString()}원</td>
                                            <td className={cn("p-4 md:p-8 text-right font-black text-lg md:text-2xl", balance > 0 ? "text-rose-500" : balance < 0 ? "text-indigo-500" : "text-emerald-500")}>
                                                {balance === 0 ? "0원" : balance > 0 ? `${balance.toLocaleString()}원` : `+${Math.abs(balance).toLocaleString()}원`}
                                            </td>
                                            <td className="p-4 md:p-8 text-center">
                                                <span className={cn("px-3 py-1.5 rounded-full text-xs font-black", status.color)}>{status.label}</span>
                                            </td>
                                            <td className="p-4 md:p-8 text-center">
                                                <button className={cn("px-6 py-2 md:px-8 md:py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 text-xs md:text-sm whitespace-nowrap", isDark ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-blue-600")}>상세 수납</button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && selectedChild && <PaymentModal childData={selectedChild} month={selectedMonth} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} isDark={isDark} />}
        </div>
    );
}

function PaymentModal({ childData, month, onClose, onSuccess, isDark }: PaymentModalProps) {
    const { center } = useCenter();
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState<PaymentInputs>({ card: 0, cash: 0, creditUsed: 0, memo: '' });
    const [localSessions, setLocalSessions] = useState<BillingSession[]>(childData.sessions);
    const [selectedSessions, setSelectedSessions] = useState<string[]>(
        childData.sessions.filter((s: BillingSession) => s.status === 'completed' && !s.isCanceled && !s.isCarriedOver).map((s: BillingSession) => s.id)
    );
    // ⭐ 수납 이력 조회 상태
    const [showHistory, setShowHistory] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<TableRow<'payments'>[]>([]);

    // ⭐ 수납 이력 로드
    const loadPaymentHistory = async () => {
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('child_id', childData.id)
            .eq('payment_month', month)
            .order('created_at', { ascending: false });
        setPaymentHistory(data || []);
        setShowHistory(true);
    };

    const totalFee = localSessions.filter((s: BillingSession) => selectedSessions.includes(s.id)).reduce((sum: number, s: BillingSession) => sum + s.price, 0);
    const alreadyPaid = childData.paid;
    const currentPaying = Number(inputs.card) + Number(inputs.cash) + Number(inputs.creditUsed);
    const finalBalance = totalFee - alreadyPaid - currentPaying;

    const handleSave = async () => {
        if (!center?.id) return;
        setLoading(true);
        try {
            const payAmount = Number(inputs.card) + Number(inputs.cash);
            const paymentData: TableInsert<'payments'> = {
                child_id: childData.id,
                center_id: center.id,  // ⭐ center_id 필수 삽입
                amount: payAmount,
                method: inputs.card > 0 ? (inputs.cash > 0 ? '카드+현금' : '카드') : (inputs.cash > 0 ? '현금' : '크레딧'),
                credit_used: inputs.creditUsed,
                memo: inputs.memo,
                payment_month: month
            };
            const { data: pay, error: payError } = await supabase.from('payments').insert(paymentData).select().maybeSingle();
            if (payError) throw payError;
            if (!pay) throw new Error('Payment was not recorded');

            // ⭐ payment_items 삽입 + 에러 처리
            const items: TableInsert<'payment_items'>[] = selectedSessions.map((sid: string) => ({
                payment_id: pay.id,
                schedule_id: sid,
                amount: localSessions.find((s: BillingSession) => s.id === sid)?.price || 0
            }));
            const { error: itemsError } = await supabase.from('payment_items').insert(items);
            if (itemsError) {
                console.error('payment_items 삽입 실패:', itemsError);
            }

            // 크레딧 차감
            if (inputs.creditUsed > 0) {
                let newCredit = childData.credit - inputs.creditUsed;
                const { error: creditError } = await supabase.from('children').update({ credit: Math.max(0, newCredit) }).eq('id', childData.id);
                if (creditError) console.error('크레딧 차감 실패:', creditError);
            }

            alert('수납이 완료되었습니다.'); onSuccess(); onClose();
        } catch (err: any) {
            alert('수납 처리 중 오류: ' + (err.message || '알 수 없는 오류'));
        } finally { setLoading(false); }
    };

    const handleStatusChange = async (sid: string, newStatus: ScheduleStatus) => {
        const session = localSessions.find(s => s.id === sid);
        if (!session) return;

        const isCancel = newStatus === 'canceled' || newStatus === 'cancelled';
        const isCarryOver = newStatus === 'carried_over';
        const prevStatus = session.status;

        if (isCancel && !confirm('수업을 취소하시겠습니까?')) return;
        if (isCarryOver && !confirm('이 회기를 이월 처리하시겠습니까?\n해당 금액이 아동 크레딧에 적립됩니다.')) return;

        setLoading(true);
        try {
            // DB 상태 업데이트
            await supabase.from('schedules').update({ status: newStatus } as never).eq('id', sid);

            const programPrice = session.programs?.price || 0;

            // ⭐ 이월 처리: 크레딧 자동 적립
            if (isCarryOver && prevStatus !== 'carried_over') {
                const { data: child } = await supabase
                    .from('children')
                    .select('credit')
                    .eq('id', childData.id)
                    .single();

                const newCredit = (child?.credit || 0) + programPrice;
                await supabase.from('children').update({ credit: newCredit }).eq('id', childData.id);
            }

            // ⭐ 이월 취소 → 다른 상태: 크레딧 복원 (차감)
            if (prevStatus === 'carried_over' && !isCarryOver) {
                const { data: child } = await supabase
                    .from('children')
                    .select('credit')
                    .eq('id', childData.id)
                    .single();

                const newCredit = Math.max(0, (child?.credit || 0) - programPrice);
                await supabase.from('children').update({ credit: newCredit }).eq('id', childData.id);
            }

            // UI 로컬 업데이트
            setLocalSessions((prev: BillingSession[]) => prev.map((s: BillingSession) =>
                s.id === sid
                    ? { ...s, status: newStatus, isCanceled: isCancel, isCarriedOver: isCarryOver, price: (isCancel || isCarryOver) ? 0 : (s.programs?.price || 0) }
                    : s
            ));

            // 이월/취소 된 세션은 선택 해제
            if (isCancel || isCarryOver) {
                setSelectedSessions(prev => prev.filter(i => i !== sid));
            }

            onSuccess();
        } catch (err) {
            console.error('상태 변경 실패:', err);
            alert('상태 변경 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualAdjustment = async () => {
        if (!center?.id) return;
        const adj = prompt("차감(보정)할 금액을 숫자로 입력하세요.");
        if (!adj || isNaN(Number(adj))) return;
        setLoading(true);
        try {
            const adjustmentData: TableInsert<'payments'> = {
                child_id: childData.id,
                center_id: center.id,  // ⭐ center_id 필수 삽입
                amount: -Number(adj),
                method: '보정',
                payment_month: month,
                memo: '수동 과납 보정'
            };
            const { error } = await supabase.from('payments').insert(adjustmentData);
            if (error) throw error;
            onSuccess(); onClose();
        } catch (err: any) {
            alert('보정 처리 중 오류: ' + (err.message || '알 수 없는 오류'));
        } finally { setLoading(false); }
    };

    // ⭐ 환불 처리
    const handleRefund = async () => {
        if (!center?.id) return;
        const refundStr = prompt("환불할 금액을 숫자로 입력하세요.");
        if (!refundStr || isNaN(Number(refundStr)) || Number(refundStr) <= 0) return;
        const refundAmount = Number(refundStr);

        if (!confirm(`${refundAmount.toLocaleString()}원을 환불 처리하시겠습니까?`)) return;

        setLoading(true);
        try {
            const refundData: TableInsert<'payments'> = {
                child_id: childData.id,
                center_id: center.id,
                amount: -refundAmount,
                method: '환불',
                payment_month: month,
                memo: `환불 처리 (${new Date().toLocaleDateString('ko-KR')})`
            };
            const { error } = await supabase.from('payments').insert(refundData);
            if (error) throw error;
            alert('환불이 완료되었습니다.');
            onSuccess(); onClose();
        } catch (err: any) {
            alert('환불 처리 중 오류: ' + (err.message || '알 수 없는 오류'));
        } finally { setLoading(false); }
    };

    // ⭐ 세션 상태별 스타일
    const getSessionStyle = (s: BillingSession) => {
        if (s.isCarriedOver) return { border: 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20', badge: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400', icon: <ArrowRightCircle className="w-4 h-4" /> };
        if (s.isCanceled) return { border: 'border-rose-200 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-900/20', badge: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400', icon: <X className="w-4 h-4" /> };
        if (s.status === 'completed') return { border: 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400', icon: <CheckSquare className="w-4 h-4" /> };
        return { border: 'border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-800/50', badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: null };
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className={cn(
                "rounded-[32px] md:rounded-[50px] w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200",
                isDark ? "bg-slate-900" : "bg-white"
            )}>
                <div className={cn(
                    "p-6 md:p-10 border-b flex justify-between items-center shrink-0",
                    isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50/50 border-slate-200"
                )}>
                    <h2 className={cn("text-2xl md:text-4xl font-black truncate max-w-[60%]", isDark ? "text-white" : "text-slate-800")}>{childData.name} 수납 상세</h2>
                    <div className="flex items-center gap-3">
                        {/* ⭐ 수납 이력 버튼 */}
                        <button onClick={loadPaymentHistory} className={cn("p-2.5 rounded-xl transition-all", isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")} title="수납 이력">
                            <History size={20} />
                        </button>
                        {/* ⭐ 환불 버튼 */}
                        <button onClick={handleRefund} className={cn("p-2.5 rounded-xl transition-all", isDark ? "hover:bg-rose-900/50 text-slate-400 hover:text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-500")} title="환불 처리">
                            <RotateCcw size={20} />
                        </button>
                        <button onClick={onClose} className={cn("p-2 rounded-full transition-all", isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100")}><X size={24} className="md:w-8 md:h-8" /></button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                    {/* 왼쪽: 세션 목록 */}
                    <div className={cn(
                        "w-full md:w-1/2 p-6 md:p-10 border-b md:border-b-0 md:border-r overflow-y-auto custom-scrollbar",
                        isDark ? "bg-slate-900/50 border-slate-700" : "bg-slate-50/20 border-slate-200"
                    )}>
                        {/* ⭐ 수납 이력 패널 */}
                        {showHistory && (
                            <div className={cn("mb-6 p-5 rounded-2xl border", isDark ? "bg-slate-800 border-slate-700" : "bg-blue-50/50 border-blue-100")}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className={cn("text-sm font-black flex items-center gap-2", isDark ? "text-slate-300" : "text-slate-700")}><History className="w-4 h-4" /> 수납 이력</h3>
                                    <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 hover:text-slate-600">닫기</button>
                                </div>
                                {paymentHistory.length === 0 ? (
                                    <p className={cn("text-xs font-medium", isDark ? "text-slate-500" : "text-slate-400")}>이번 달 수납 기록이 없습니다.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {paymentHistory.map(ph => (
                                            <div key={ph.id} className={cn("flex justify-between items-center p-3 rounded-xl text-sm", isDark ? "bg-slate-900" : "bg-white")}>
                                                <div>
                                                    <span className={cn("font-black", ph.method === '환불' || ph.method === '보정' ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-600')}>{ph.method}</span>
                                                    {ph.memo && <span className={cn("ml-2 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{ph.memo}</span>}
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn("font-black", (Number(ph.amount) || 0) < 0 ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-800')}>
                                                        {(Number(ph.amount) || 0) >= 0 ? '+' : ''}{Number(ph.amount || 0).toLocaleString()}원
                                                    </span>
                                                    {(Number(ph.credit_used) || 0) > 0 && (
                                                        <span className="text-purple-500 text-xs ml-1">(크레딧 {Number(ph.credit_used).toLocaleString()}원)</span>
                                                    )}
                                                    <p className={cn("text-[10px]", isDark ? "text-slate-600" : "text-slate-300")}>{ph.created_at ? new Date(ph.created_at).toLocaleDateString('ko-KR') : ''}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            {localSessions.map(s => {
                                const style = getSessionStyle(s);
                                const isClickable = !s.isCanceled && !s.isCarriedOver;
                                return (
                                    <div key={s.id}
                                        onClick={() => isClickable && setSelectedSessions(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])}
                                        className={cn(
                                            "p-6 md:p-8 rounded-[24px] md:rounded-[35px] border-2 transition-all",
                                            isClickable ? "cursor-pointer" : "cursor-default opacity-70",
                                            !isClickable ? style.border :
                                                selectedSessions.includes(s.id)
                                                    ? (isDark ? "border-blue-500 bg-slate-800 shadow-xl ring-4 ring-blue-500/10" : "border-blue-500 bg-white shadow-xl ring-4 md:ring-8 ring-blue-50")
                                                    : (isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-white")
                                        )}>
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex gap-3 md:gap-5 items-center flex-1 min-w-0">
                                                {isClickable && (selectedSessions.includes(s.id)
                                                    ? <CheckSquare className="text-blue-600 w-6 h-6 md:w-7 md:h-7 shrink-0" />
                                                    : <Square className={cn("w-6 h-6 md:w-7 md:h-7 shrink-0", isDark ? "text-slate-600" : "text-slate-200")} />
                                                )}
                                                {s.isCarriedOver && <ArrowRightCircle className="text-purple-500 w-6 h-6 shrink-0" />}
                                                {s.isCanceled && <X className="text-rose-400 w-6 h-6 shrink-0" />}
                                                <div className="truncate">
                                                    <p className={cn("text-xs md:text-sm font-black", isDark ? "text-slate-500" : "text-slate-400")}>{s.date}</p>
                                                    <p className={cn("text-lg md:text-2xl font-black truncate", isDark ? "text-white" : "text-slate-800", s.isCanceled && "line-through", s.isCarriedOver && "text-purple-500 dark:text-purple-400")}>{s.programs?.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <select
                                                    value={s.status}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={(e) => handleStatusChange(s.id, e.target.value as ScheduleStatus)}
                                                    className={cn("text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-xl border-none outline-none mb-2 cursor-pointer", isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100")}
                                                >
                                                    <option value="scheduled">예정</option>
                                                    <option value="completed">완료</option>
                                                    <option value="canceled">취소</option>
                                                    <option value="carried_over">이월</option>
                                                </select>
                                                <p className={cn("text-lg md:text-xl font-black", s.isCarriedOver ? "text-purple-500" : isDark ? "text-white" : "")}>
                                                    {s.isCarriedOver ? `→ 크레딧` : `${s.price.toLocaleString()}원`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* 오른쪽: 결제 정보 */}
                    <div className={cn(
                        "w-full md:w-1/2 p-6 md:p-12 space-y-6 md:space-y-8 flex flex-col overflow-y-auto custom-scrollbar",
                        isDark ? "bg-slate-800" : "bg-white"
                    )}>
                        {/* ⭐ 이월 크레딧 안내 (이월 이력이 있으면 표시) */}
                        {childData.carriedOverCount > 0 && (
                            <div className={cn("p-4 rounded-2xl border flex items-center gap-3", isDark ? "bg-purple-900/20 border-purple-800" : "bg-purple-50 border-purple-100")}>
                                <ArrowRightCircle className="text-purple-500 w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-purple-500">이월 {childData.carriedOverCount}회 ({childData.carriedOverAmount.toLocaleString()}원)</p>
                                    <p className={cn("text-[10px] mt-0.5", isDark ? "text-purple-400/60" : "text-purple-400")}>이월된 금액은 아동 크레딧으로 자동 적립되었습니다</p>
                                </div>
                            </div>
                        )}

                        {/* 크레딧 카드 */}
                        <div className={cn(
                            "p-6 md:p-10 rounded-[32px] md:rounded-[45px] border flex justify-between items-center shrink-0",
                            isDark ? "bg-indigo-900/30 border-indigo-800" : "bg-indigo-50/50 border-indigo-100"
                        )}>
                            <div>
                                <p className={cn("text-[10px] md:text-xs font-black mb-2 uppercase tracking-widest", isDark ? "text-indigo-400" : "text-indigo-400")}>Available Credit</p>
                                <p className={cn("text-3xl md:text-5xl font-black tracking-tighter", isDark ? "text-indigo-300" : "text-indigo-600")}>{childData.credit.toLocaleString()}원</p>
                            </div>
                            <button
                                onClick={() => setInputs({ ...inputs, creditUsed: childData.credit })}
                                disabled={childData.credit <= 0}
                                className={cn(
                                    "px-5 py-3 md:px-8 md:py-4 rounded-[18px] md:rounded-[22px] font-black text-xs md:text-sm shadow-xl active:scale-95 transition-all whitespace-nowrap",
                                    childData.credit > 0 ? "bg-indigo-600 text-white" : "bg-slate-300 text-slate-500 cursor-not-allowed"
                                )}
                            >전액 사용</button>
                        </div>

                        {/* 결제 입력 */}
                        <div className="grid grid-cols-2 gap-4 md:gap-8">
                            <div className="space-y-2">
                                <label className={cn("text-xs font-black ml-2", isDark ? "text-slate-500" : "text-slate-400")}>카드 결제</label>
                                <input type="number" placeholder="0" className={cn(
                                    "w-full p-4 md:p-6 rounded-[24px] md:rounded-[28px] text-right font-black text-xl md:text-2xl outline-none focus:ring-4 md:focus:ring-8 transition-all",
                                    isDark ? "bg-slate-700 text-white focus:ring-indigo-900" : "bg-slate-50 focus:ring-blue-50"
                                )} onChange={e => setInputs({ ...inputs, card: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className={cn("text-xs font-black ml-2", isDark ? "text-slate-500" : "text-slate-400")}>현금/이체</label>
                                <input type="number" placeholder="0" className={cn(
                                    "w-full p-4 md:p-6 rounded-[24px] md:rounded-[28px] text-right font-black text-xl md:text-2xl outline-none focus:ring-4 md:focus:ring-8 transition-all",
                                    isDark ? "bg-slate-700 text-white focus:ring-indigo-900" : "bg-slate-50 focus:ring-blue-50"
                                )} onChange={e => setInputs({ ...inputs, cash: Number(e.target.value) })} />
                            </div>
                        </div>

                        {/* 결제 요약 */}
                        <div className={cn(
                            "mt-auto pt-8 border-t-4 border-dashed space-y-4 md:space-y-6 pb-8",
                            isDark ? "border-slate-700" : "border-slate-50"
                        )}>
                            <div className="flex justify-between font-bold text-slate-400 text-base md:text-lg px-2 md:px-4"><span>수업료 합계</span><span>{totalFee.toLocaleString()}원</span></div>
                            {inputs.creditUsed > 0 && (
                                <div className="flex justify-between font-bold text-purple-500 text-base md:text-lg px-2 md:px-4"><span>크레딧 사용</span><span>-{inputs.creditUsed.toLocaleString()}원</span></div>
                            )}
                            <div className="flex justify-between font-bold text-blue-500 text-base md:text-lg px-2 md:px-4"><span>기수납액(이번달)</span><span>-{alreadyPaid.toLocaleString()}원</span></div>
                            {finalBalance < 0 && (
                                <div className="flex items-center gap-2 px-2 md:px-4">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-bold text-amber-500">과납 상태입니다. 보정 처리가 필요합니다.</span>
                                </div>
                            )}
                            <div className={cn("flex justify-between font-black text-3xl md:text-5xl pt-4 md:pt-6 px-2 md:px-4", isDark ? "text-white" : "text-slate-900")}><span>최종 결제</span><span>{Math.max(0, finalBalance).toLocaleString()}원</span></div>
                            <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
                                <button onClick={handleSave} disabled={loading} className={cn(
                                    "flex-1 py-6 md:py-8 rounded-[28px] md:rounded-[35px] font-black text-lg md:text-2xl shadow-2xl active:scale-[0.97] transition-all flex justify-center items-center gap-4",
                                    isDark ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/50" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                                )}>
                                    {loading ? <Loader2 className="animate-spin" /> : "수납 완료"}
                                </button>
                                <button onClick={handleManualAdjustment} className={cn(
                                    "p-6 md:p-8 rounded-[28px] md:rounded-[35px] transition-all",
                                    isDark ? "bg-slate-700 text-slate-400 hover:bg-rose-900 hover:text-rose-400" : "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                )}><Settings2 size={24} className="md:w-8 md:h-8" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}