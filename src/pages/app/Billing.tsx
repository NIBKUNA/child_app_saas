// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search,
    CreditCard, Banknote, Coins, Receipt, X, Loader2, CheckSquare, Square, Save
} from 'lucide-react';

// ... (아이콘 컴포넌트는 기존 유지) ...
const iconClasses = "w-6 h-6 stroke-[1.5]";
const WalletIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={iconClasses}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>);
const ChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={iconClasses}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>);
const PercentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={iconClasses}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);

export function Billing() {
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [payments, setPayments] = useState([]);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000));
        return kstDate.toISOString().slice(0, 7);
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChild, setSelectedChild] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ... (fetchData 등 기존 로직 동일)
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('schedules')
                .select(`*, children (id, name, registration_number, credit), programs (name, price)`)
                .order('start_time', { ascending: false });

            if (scheduleError) throw scheduleError;
            if (scheduleData) setSchedules(scheduleData);

            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .select('*')
                .eq('payment_month', selectedMonth);

            if (!paymentError && paymentData) {
                setPayments(paymentData);
            } else {
                setPayments([]);
            }

        } catch (error) {
            console.error('Data Load Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const stats = useMemo(() => {
        const filteredSchedules = schedules.filter(s => s.start_time.includes(selectedMonth));

        let totalCompleted = 0;
        let totalExpected = 0;
        const childMap = {};

        filteredSchedules.forEach(item => {
            const price = item.programs?.price || 0;
            const childId = item.children?.id;
            const childName = item.children?.name || '미등록 아동';
            const currentCredit = item.children?.credit || 0;

            if (searchTerm && !childName.includes(searchTerm)) return;

            if (!childMap[childId]) {
                const paidAmount = payments
                    .filter(p => p.child_id === childId)
                    .reduce((sum, p) => sum + (p.amount || 0) + (p.credit_used || 0), 0);

                childMap[childId] = {
                    id: childId,
                    name: childName,
                    total: 0,
                    completed: 0,
                    paid: paidAmount,
                    credit: currentCredit,
                    sessions: []
                };
            }

            childMap[childId].sessions.push({
                id: item.id,
                date: item.start_time.split('T')[0],
                program: item.programs?.name || '프로그램 미지정',
                price: price,
                status: item.status
            });

            if (item.status === 'completed') {
                totalCompleted += price;
                totalExpected += price;
                childMap[childId].total += price;
                childMap[childId].completed += price;
            }
            else if (item.status === 'scheduled') {
                totalExpected += price;
                childMap[childId].total += price;
            }
        });

        const progressRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
        return { totalCompleted, totalExpected, progressRate, childList: Object.values(childMap) };
    }, [schedules, payments, selectedMonth, searchTerm]);

    const changeMonth = (offset) => {
        const date = new Date(selectedMonth + "-01");
        date.setMonth(date.getMonth() + offset);
        const newYear = date.getFullYear();
        const newMonth = String(date.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${newYear}-${newMonth}`);
    };

    const handlePaymentSuccess = () => {
        setIsModalOpen(false);
        fetchData();
    };

    const formatMoney = (amount) => amount.toLocaleString() + '원';

    // ✨ 심플해진 상태 표시 (케어플 스타일)
    const getStatusBadge = (data) => {
        // 잔액 = 총 수업료 - 이미 낸 돈
        const balance = data.completed - data.paid;

        // 1. 돈을 더 냈다 (잔액이 마이너스) -> 이월 예정
        if (balance < 0) {
            return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">이월 예정</span>;
        }
        // 2. 딱 맞게 냈다 (잔액 0)
        if (balance === 0) {
            return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">정산 완료</span>;
        }
        // 3. 덜 냈다 (잔액 플러스)
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">미납</span>;
    };

    const handleButtonClick = (e, data) => {
        e.stopPropagation();
        openPaymentModal(data);
    };

    const openPaymentModal = (childData) => {
        setSelectedChild(childData);
        setIsModalOpen(true);
    };

    return (
        <>
            <Helmet><title>수납 관리 - 자라다 Admin</title></Helmet>
            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">수납 관리</h1>
                        <p className="text-slate-500 font-medium">이번 달 수업료와 수납 현황을 확인합니다.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="flex items-center gap-2 px-2">
                            <CalendarIcon className="w-5 h-5 text-indigo-600" />
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer text-lg" />
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="확정 수업료" value={formatMoney(stats.totalCompleted)} desc="완료된 수업 기준" icon={WalletIcon} color="text-blue-600" bg="bg-blue-50" border="border-blue-200" />
                    <StatCard title="예상 총 매출" value={formatMoney(stats.totalExpected)} desc="예정 수업 포함" icon={ChartIcon} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" />
                    <StatCard title="수납 진행률" value={`${stats.progressRate}%`} desc="예상 총액 대비" icon={PercentIcon} color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-200" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-slate-500" />
                            {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월 수납 대장
                        </h3>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="아동 이름 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">아동명</th>
                                    {/* ✨ 쉬운 단어로 변경 */}
                                    <th className="px-6 py-4 text-right">총 수업료(완료)</th>
                                    <th className="px-6 py-4 text-right">이미 낸 돈</th>
                                    <th className="px-6 py-4 text-right">정산 금액(잔액)</th>
                                    <th className="px-6 py-4 text-center">상태</th>
                                    <th className="px-6 py-4 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 flex justify-center items-center gap-2"><Loader2 className="animate-spin w-5 h-5" /> 데이터 로딩 중...</td></tr>
                                ) : stats.childList.length === 0 ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">
                                        <span className="font-bold text-slate-500">{selectedMonth}월 수납 데이터가 없습니다.</span>
                                    </td></tr>
                                ) : (
                                    stats.childList.map((data, idx) => {
                                        // 잔액 = 수업료 - 낸돈
                                        const balance = data.completed - data.paid;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => openPaymentModal(data)}>
                                                <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><UserIcon /></div>
                                                    {data.name}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700">{formatMoney(data.completed)}</td>
                                                <td className="px-6 py-4 text-right text-slate-400">{formatMoney(data.paid)}</td>
                                                {/* ✨ 마이너스면 파란색(남음), 플러스면 빨간색(부족) */}
                                                <td className={cn("px-6 py-4 text-right font-black", balance > 0 ? "text-rose-500" : balance < 0 ? "text-indigo-500" : "text-emerald-500")}>
                                                    {balance === 0 ? "0원" : balance > 0 ? formatMoney(balance) : `+${formatMoney(Math.abs(balance))} (남음)`}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {getStatusBadge(data)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleButtonClick(e, data)}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100 active:scale-95"
                                                    >
                                                        수납하기
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isModalOpen && selectedChild && (
                    <PaymentModal childData={selectedChild} month={selectedMonth} onClose={() => setIsModalOpen(false)} onSuccess={handlePaymentSuccess} />
                )}
            </div>
        </>
    );
}

// ------------------------------------------
// 💳 심플해진 수납 팝업 (케어플 스타일)
// ------------------------------------------
function PaymentModal({ childData, month, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState({ card: 0, cash: 0, transfer: 0, creditUsed: 0, memo: '' });

    // 완료된 수업만 기본 선택
    const [selectedSessions, setSelectedSessions] = useState(() =>
        childData.sessions.filter(s => s.status === 'completed').map(s => s.id)
    );

    const prevCredit = childData.credit || 0; // 기존 적립금
    const alreadyPaid = childData.paid || 0; // 이번달 이미 낸 돈

    // 1. 총 수업료 (선택된 수업의 합계)
    const totalClassFee = childData.sessions
        .filter(s => selectedSessions.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0);

    // 2. 지금 낼 돈
    const currentPaying = Number(inputs.card) + Number(inputs.cash) + Number(inputs.transfer) + Number(inputs.creditUsed);

    // 3. 최종 정산 (수업료 - 이미낸돈 - 지금낼돈)
    // 양수(+)면 더 내야 함 / 음수(-)면 돈이 남음(과납)
    const finalBalance = totalClassFee - alreadyPaid - currentPaying;

    // 다음 달로 넘길 적립금 예측치 (기존 적립금 + 이번에 남은 돈 - 이번에 쓴 적립금)
    const estimatedNextCredit = prevCredit + (finalBalance < 0 ? Math.abs(finalBalance) : 0) - Number(inputs.creditUsed);

    const toggleSession = (id) => {
        setSelectedSessions(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleFullPay = () => {
        // 낼 돈 = 수업료 - 이미낸돈
        const toPay = totalClassFee - alreadyPaid - inputs.creditUsed;
        if (toPay > 0) {
            setInputs({ ...inputs, card: toPay, cash: 0, transfer: 0 });
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const paymentAmount = Number(inputs.card) + Number(inputs.cash) + Number(inputs.transfer);

            // 수납 내역 저장
            if (paymentAmount > 0 || inputs.creditUsed > 0) {
                const { error: payError } = await supabase.from('payments').insert([{
                    child_id: childData.id,
                    amount: paymentAmount,
                    method: inputs.card > 0 ? '카드' : inputs.cash > 0 ? '현금' : '계좌이체',
                    credit_used: inputs.creditUsed,
                    memo: inputs.memo,
                    payment_month: month
                }]);
                if (payError) throw new Error(payError.message);
            }

            // ✨ [핵심] 적립금 업데이트 로직
            // 만약 finalBalance가 마이너스(돈이 남음)면, 그만큼 적립금에 더해줍니다.
            let newCredit = prevCredit - Number(inputs.creditUsed); // 쓴 돈 차감
            if (finalBalance < 0) {
                newCredit += Math.abs(finalBalance); // 남은 돈 추가
            }

            const { error: creditError } = await supabase.from('children').update({ credit: newCredit }).eq('id', childData.id);
            if (creditError) throw new Error(creditError.message);

            alert('수납 및 정산이 완료되었습니다.');
            onSuccess();

        } catch (error) {
            alert(`저장 실패: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            수납 처리 <span className="text-base font-medium text-slate-400">| {childData.name} ({month})</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">청구할 수업을 체크하세요.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-auto flex flex-col md:flex-row">
                    {/* 왼쪽: 수업 내역 */}
                    <div className="w-full md:w-5/12 bg-slate-50 p-6 border-r border-slate-100 overflow-y-auto">
                        <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex justify-between">
                            <span>수업 내역</span>
                            <span className="text-xs normal-case bg-white px-2 py-0.5 rounded border border-slate-200">클릭하여 선택</span>
                        </h3>
                        <div className="space-y-3">
                            {childData.sessions.map((s, idx) => {
                                const isSelected = selectedSessions.includes(s.id);
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => toggleSession(s.id)}
                                        className={cn(
                                            "p-3 rounded-xl border shadow-sm flex items-start gap-3 cursor-pointer transition-all select-none",
                                            isSelected ? "bg-white border-slate-200 hover:border-blue-300" : "bg-slate-100 border-slate-100 opacity-60"
                                        )}
                                    >
                                        <div className={cn("mt-0.5", isSelected ? "text-blue-600" : "text-slate-400")}>
                                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-slate-500">{s.date}</span>
                                                <span className={cn("text-xs font-bold",
                                                    s.status === 'completed' ? "text-blue-500" :
                                                        s.status === 'cancelled' ? "text-rose-500" :
                                                            s.status === 'carried_over' ? "text-purple-500" : "text-slate-400"
                                                )}>
                                                    {s.status === 'completed' ? '완료' :
                                                        s.status === 'cancelled' ? '취소' :
                                                            s.status === 'carried_over' ? '이월' : '예정'}
                                                </span>
                                            </div>
                                            <div className={cn("font-bold text-sm", isSelected ? "text-slate-800" : "text-slate-400 line-through")}>
                                                {s.program}
                                            </div>
                                            <div className={cn("text-right font-bold text-sm mt-1", isSelected ? "text-slate-800" : "text-slate-400 line-through")}>
                                                {s.price.toLocaleString()}원
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ✨ 심플 계산 내역 */}
                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>수업료 합계</span>
                                    <span>{totalClassFee.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-blue-500 font-bold">
                                    <span>(-) 이미 낸 돈</span>
                                    <span>-{alreadyPaid.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="font-bold text-slate-800">남은 청구액</span>
                                    <span className="text-xl font-black text-slate-800">
                                        {/* 마이너스면 0원으로 표시 (이미 다 냈으니까) */}
                                        {Math.max(0, totalClassFee - alreadyPaid).toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 결제 입력 */}
                    <div className="w-full md:w-7/12 p-6 bg-white flex flex-col justify-between">
                        <div>
                            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-indigo-500 mb-0.5">현재 보유 적립금</p>
                                    <p className="text-lg font-black text-indigo-700">{prevCredit.toLocaleString()}원</p>
                                </div>
                                <button onClick={() => setInputs(prev => ({ ...prev, creditUsed: prevCredit }))} className="px-3 py-1.5 bg-indigo-200 text-indigo-800 text-xs font-bold rounded-lg hover:bg-indigo-300 transition-colors">
                                    전액 사용
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <PaymentInput label="카드 결제" icon={CreditCard} value={inputs.card} onChange={v => setInputs({ ...inputs, card: v })} />
                                    <PaymentInput label="현금 결제" icon={Banknote} value={inputs.cash} onChange={v => setInputs({ ...inputs, cash: v })} />
                                    <PaymentInput label="계좌 이체" icon={Receipt} value={inputs.transfer} onChange={v => setInputs({ ...inputs, transfer: v })} />
                                    <PaymentInput label="적립금 사용" icon={Coins} value={inputs.creditUsed} onChange={v => setInputs({ ...inputs, creditUsed: v })} max={prevCredit} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">메모</label>
                                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="예: 할머니가 입금함" value={inputs.memo} onChange={e => setInputs({ ...inputs, memo: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* ✨ 여기가 핵심: 최종 상태 메시지 */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-500">이번에 내는 돈</span>
                                <span className="text-lg font-bold text-slate-800">{currentPaying.toLocaleString()}원</span>
                            </div>

                            {finalBalance > 0 ? (
                                // 1. 돈이 부족할 때
                                <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                                    <span className="font-bold text-rose-600">더 내야 할 돈 (미납)</span>
                                    <span className="text-xl font-black text-rose-600">{finalBalance.toLocaleString()}원</span>
                                </div>
                            ) : finalBalance < 0 ? (
                                // 2. 돈이 남을 때 (자동 이월)
                                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl border border-indigo-200 animate-in zoom-in-95 duration-200">
                                    <div>
                                        <span className="font-bold text-indigo-700 block">돈이 남았습니다 (자동 적립)</span>
                                        <span className="text-xs text-indigo-400">다음 달 수업료로 쓰세요!</span>
                                    </div>
                                    <span className="text-xl font-black text-indigo-600">
                                        +{Math.abs(finalBalance).toLocaleString()}원
                                    </span>
                                </div>
                            ) : (
                                // 3. 딱 맞을 때
                                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="font-bold text-emerald-600">정산 완료</span>
                                    <span className="text-xl font-black text-emerald-600">0원</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button onClick={handleFullPay} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">나머지 금액 자동입력</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} 수납 완료 처리
                    </button>
                </div>
            </div>
        </div>
    );
}

// ... (하단 PaymentInput, StatCard는 기존과 동일) ...
function PaymentInput({ label, icon: Icon, value, onChange, max }) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</label>
            <input type="number" value={value === 0 ? '' : value} onChange={(e) => { let val = Number(e.target.value); if (max !== undefined && val > max) val = max; onChange(val); }} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-bold text-right focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="0" />
        </div>
    );
}

function StatCard({ title, value, desc, icon: Icon, color, bg, border }) {
    return (
        <div className={`p-6 rounded-2xl shadow-sm border ${border} ${bg} relative overflow-hidden group hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-4">
                <div><p className="text-sm font-bold text-slate-500 mb-1">{title}</p><h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3></div>
                <div className={`p-3 rounded-xl bg-white bg-opacity-60 ${color}`}><Icon /></div>
            </div>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1">{desc}</p>
        </div>
    );
}