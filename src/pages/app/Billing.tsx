// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import {
    ChevronLeft, ChevronRight, Search, CreditCard, Banknote, Receipt,
    X, Loader2, CheckSquare, Square, Settings2, Trash2, User
} from 'lucide-react';

export function Billing() {
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [payments, setPayments] = useState([]);
    // ✨ [복구] 년-월 선택 상태
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    // ✨ [복구] 아동 검색어 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChild, setSelectedChild] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: sData } = await supabase.from('schedules').select(`*, children (*), programs (*)`).order('start_time', { ascending: false });
            const { data: pData } = await supabase.from('payments').select(`*, payment_items(*)`).eq('payment_month', selectedMonth);
            setSchedules(sData || []);
            setPayments(pData || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth]);

    const stats = useMemo(() => {
        const filteredSchedules = schedules.filter(s => s.start_time.includes(selectedMonth));
        const childMap = {};

        filteredSchedules.forEach(item => {
            const childId = item.children?.id;
            const childName = item.children?.name || '';

            // ✨ [복구] 검색어 필터링 로직
            if (!childId || (searchTerm && !childName.includes(searchTerm))) return;

            if (!childMap[childId]) {
                const childPaidTotal = payments
                    .filter(p => p.child_id === childId)
                    .reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.credit_used) || 0), 0);

                childMap[childId] = {
                    id: childId, name: childName, paid: childPaidTotal,
                    credit: item.children.credit || 0, completed: 0, sessions: []
                };
            }

            const isCanceled = item.status === 'canceled' || item.status === 'cancelled';
            const price = isCanceled ? 0 : (item.programs?.price || 0);
            childMap[childId].sessions.push({ ...item, price, isCanceled });
            if (item.status === 'completed') childMap[childId].completed += price;
        });
        return { childList: Object.values(childMap) };
    }, [schedules, payments, selectedMonth, searchTerm]);

    // ✨ [복구] 월 변경 함수
    const changeMonth = (offset) => {
        const d = new Date(selectedMonth + "-01");
        d.setMonth(d.getMonth() + offset);
        setSelectedMonth(d.toISOString().slice(0, 7));
    };

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <Helmet><title>수납 관리 - 자라다</title></Helmet>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">수납 관리</h1>

                {/* ✨ [복구] 월 선택 UI */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft /></button>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="font-bold border-none text-lg cursor-pointer outline-none" />
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight /></button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3 font-bold text-xl text-slate-800"><Receipt className="text-blue-600" /> {selectedMonth.split('-')[1]}월 수납 대장</div>

                    {/* ✨ [복구] 검색창 UI */}
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="아동 이름 검색..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400 tracking-widest">
                            <tr><th className="p-8">아동 정보</th><th className="p-8 text-right">수업료(완료)</th><th className="p-8 text-right">기수납액</th><th className="p-8 text-right">잔액</th><th className="p-8 text-center">관리</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin inline-block w-8 h-8 text-blue-500" /></td></tr>
                            ) : stats.childList.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold">해당 조건의 데이터가 없습니다.</td></tr>
                            ) : (
                                stats.childList.map(child => {
                                    const balance = child.completed - child.paid;
                                    return (
                                        <tr key={child.id} className="hover:bg-blue-50/20 transition-all cursor-pointer group" onClick={() => { setSelectedChild(child); setIsModalOpen(true); }}>
                                            <td className="p-8 font-bold text-xl flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors"><User /></div>
                                                {child.name}
                                            </td>
                                            <td className="p-8 text-right font-black text-slate-700">{child.completed.toLocaleString()}원</td>
                                            <td className="p-8 text-right font-bold text-slate-400">{child.paid.toLocaleString()}원</td>
                                            <td className={cn("p-8 text-right font-black text-2xl", balance > 0 ? "text-rose-500" : balance < 0 ? "text-indigo-600" : "text-emerald-500")}>
                                                {balance === 0 ? "0원" : balance > 0 ? `${balance.toLocaleString()}원` : `+${Math.abs(balance).toLocaleString()}원(과납)`}
                                            </td>
                                            <td className="p-8 text-center">
                                                <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95">상세 수납</button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <PaymentModal childData={selectedChild} month={selectedMonth} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />}
        </div>
    );
}

function PaymentModal({ childData, month, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState({ card: 0, cash: 0, creditUsed: 0, memo: '' });
    const [localSessions, setLocalSessions] = useState(childData.sessions);
    const [selectedSessions, setSelectedSessions] = useState(childData.sessions.filter(s => s.status === 'completed' && !s.isCanceled).map(s => s.id));

    const totalFee = localSessions.filter(s => selectedSessions.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
    const alreadyPaid = childData.paid;
    const currentPaying = Number(inputs.card) + Number(inputs.cash) + Number(inputs.creditUsed);
    const finalBalance = totalFee - alreadyPaid - currentPaying;

    const handleSave = async () => {
        setLoading(true);
        try {
            const payAmount = Number(inputs.card) + Number(inputs.cash);
            const { data: pay } = await supabase.from('payments').insert([{
                child_id: childData.id, amount: payAmount, method: inputs.card > 0 ? '카드' : '계좌이체', credit_used: inputs.creditUsed, memo: inputs.memo, payment_month: month
            }]).select().single();

            const items = selectedSessions.map(sid => ({ payment_id: pay.id, schedule_id: sid, amount: localSessions.find(s => s.id === sid).price }));
            await supabase.from('payment_items').insert(items);

            let newCredit = childData.credit - inputs.creditUsed;
            if (finalBalance < 0) newCredit += Math.abs(finalBalance);
            await supabase.from('children').update({ credit: newCredit }).eq('id', childData.id);

            alert('수납이 완료되었습니다.'); onSuccess(); onClose();
        } finally { setLoading(false); }
    };

    const handleStatusChange = async (sid, newStatus) => {
        const isCancel = newStatus === 'canceled' || newStatus === 'cancelled';
        if (isCancel && !confirm('수업을 취소하시겠습니까?')) return;
        setLoading(true);
        await supabase.from('schedules').update({ status: newStatus }).eq('id', sid);
        onSuccess();
        setLocalSessions(prev => prev.map(s => s.id === sid ? { ...s, status: newStatus, isCanceled: isCancel, price: isCancel ? 0 : s.price } : s));
        setLoading(false);
    };

    const handleManualAdjustment = async () => {
        const adj = prompt("차감(보정)할 금액을 숫자로 입력하세요.");
        if (!adj || isNaN(adj)) return;
        setLoading(true);
        await supabase.from('payments').insert([{
            child_id: childData.id, amount: -Number(adj), method: '보정', payment_month: month, memo: '수동 과납 보정'
        }]);
        onSuccess(); onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[50px] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-4xl font-black text-slate-800">{childData.name} 수납 상세</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={32} /></button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/2 p-10 border-r overflow-y-auto bg-slate-50/20">
                        <div className="space-y-4">
                            {localSessions.map(s => (
                                <div key={s.id} onClick={() => !s.isCanceled && setSelectedSessions(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])}
                                    className={cn("p-8 rounded-[35px] border-2 transition-all cursor-pointer",
                                        s.isCanceled ? "bg-slate-100 opacity-50" : selectedSessions.includes(s.id) ? "border-blue-500 bg-white shadow-xl ring-8 ring-blue-50" : "border-slate-100 bg-white")}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-5 items-center">
                                            {!s.isCanceled && (selectedSessions.includes(s.id) ? <CheckSquare className="text-blue-600 w-7 h-7" /> : <Square className="text-slate-200 w-7 h-7" />)}
                                            <div><p className="text-sm font-black text-slate-400">{s.date}</p><p className="text-2xl font-black text-slate-800">{s.programs?.name}</p></div>
                                        </div>
                                        <div className="text-right">
                                            <select
                                                value={s.status}
                                                onClick={e => e.stopPropagation()}
                                                onChange={(e) => handleStatusChange(s.id, e.target.value)}
                                                className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl border-none outline-none mb-2 cursor-pointer"
                                            >
                                                <option value="scheduled">예정</option><option value="completed">완료</option><option value="canceled">취소</option>
                                            </select>
                                            <p className="text-xl font-black">{s.price.toLocaleString()}원</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-1/2 p-12 space-y-12 bg-white flex flex-col">
                        <div className="p-10 bg-indigo-50/50 rounded-[45px] border border-indigo-100 flex justify-between items-center">
                            <div><p className="text-xs font-black text-indigo-400 mb-2 uppercase tracking-widest">Available Credit</p><p className="text-5xl font-black text-indigo-600 tracking-tighter">{childData.credit.toLocaleString()}원</p></div>
                            <button onClick={() => setInputs({ ...inputs, creditUsed: childData.credit })} className="bg-indigo-600 text-white px-8 py-4 rounded-[22px] font-black text-sm shadow-xl active:scale-95 transition-all">전액 사용</button>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2"><label className="text-xs font-black text-slate-400 ml-2">카드 결제</label><input type="number" placeholder="0" className="w-full p-6 bg-slate-50 rounded-[28px] text-right font-black text-2xl outline-none focus:ring-8 focus:ring-blue-50 transition-all" onChange={e => setInputs({ ...inputs, card: Number(e.target.value) })} /></div>
                            <div className="space-y-2"><label className="text-xs font-black text-slate-400 ml-2">현금/이체</label><input type="number" placeholder="0" className="w-full p-6 bg-slate-50 rounded-[28px] text-right font-black text-2xl outline-none focus:ring-8 focus:ring-blue-50 transition-all" onChange={e => setInputs({ ...inputs, cash: Number(e.target.value) })} /></div>
                        </div>
                        <div className="mt-auto pt-12 border-t-4 border-dashed border-slate-50 space-y-6">
                            <div className="flex justify-between font-bold text-slate-400 text-lg px-4"><span>수업료 합계</span><span>{totalFee.toLocaleString()}원</span></div>
                            <div className="flex justify-between font-bold text-blue-500 text-lg px-4"><span>기수납액(이번달)</span><span>-{alreadyPaid.toLocaleString()}원</span></div>
                            <div className="flex justify-between font-black text-5xl text-slate-900 pt-6 px-4"><span>최종 결제</span><span>{Math.max(0, finalBalance).toLocaleString()}원</span></div>
                            <div className="flex gap-4 mt-12">
                                <button onClick={handleSave} disabled={loading} className="flex-1 py-10 bg-blue-600 text-white rounded-[35px] font-black text-3xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.97] transition-all flex justify-center items-center gap-4">
                                    {loading ? <Loader2 className="animate-spin" /> : "수납 완료"}
                                </button>
                                <button onClick={handleManualAdjustment} className="p-10 bg-slate-100 text-slate-400 rounded-[35px] hover:bg-rose-50 hover:text-rose-500 transition-all"><Settings2 size={32} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}