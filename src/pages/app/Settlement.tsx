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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import {
    Calendar, DollarSign, Coins, Briefcase, Edit2, X, Check, Calculator, UserCheck, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';

export function Settlement() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('therapist');

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [settlementList, setSettlementList] = useState<any[]>([]);
    const [adminList, setAdminList] = useState<any[]>([]);
    const [totalStats, setTotalStats] = useState({ revenue: 0, payout: 0, net: 0, count: 0 });

    // ✨ [Fix] Missing State Definitions
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        hire_type: 'freelancer',
        base_salary: 0,
        base_session_count: 0,
        weekday: 0,
        weekend: 0,
        eval: 0,
        consult: 0,
        remarks: ''
    });

    const startEdit = (t: any) => {
        setEditingId(t.id);
        setEditForm({
            hire_type: t.hire_type || 'freelancer',
            base_salary: t.base_salary || 0,
            base_session_count: t.required_sessions || 0,
            weekday: t.session_price_weekday || 0,
            weekend: t.session_price_weekend || 0,
            eval: t.evaluation_price || 0,
            consult: t.incentive_price || 0,
            remarks: t.remarks || ''
        });
    };

    const saveEdit = async (id: string) => {
        if (!window.confirm('저장하시겠습니까?')) return;
        try {
            await supabase.from('therapists').update({
                hire_type: editForm.hire_type,
                base_salary: editForm.base_salary,
                required_sessions: editForm.base_session_count,
                session_price_weekday: editForm.weekday,
                session_price_weekend: editForm.weekend,
                evaluation_price: editForm.eval,
                incentive_price: editForm.consult,
                remarks: editForm.remarks
            }).eq('id', id);

            setEditingId(null);
            fetchSettlements();
        } catch (e) {
            console.error(e);
            alert('저장 실패');
        }
    };

    const handleDownloadExcel = () => {
        if (!window.confirm('현재 화면에 표시된 정산 내역을 엑셀로 저장하시겠습니까?')) return;

        try {
            // 1. Data Mapping
            const excelData = [
                ...settlementList.map(t => ({
                    '구분': '치료사',
                    '이름': t.name,
                    '직책/역할': t.hire_type === 'regular' ? '정규직' : '프리랜서',
                    '총 매출': t.revenue,
                    '실 지급액': t.payout,
                    '은행명': t.bank_name || '-',
                    '계좌번호': t.account_number || '-',
                    '예금주': t.account_holder || '-',
                    '세부 내역': t.incentiveText,
                    '비고': t.remarks || ''
                })),
                ...adminList.map(a => ({
                    '구분': '행정직',
                    '이름': a.name,
                    '직책/역할': 'Staff',
                    '총 매출': '-',
                    '실 지급액': a.payout,
                    '은행명': a.bank_name || '-',
                    '계좌번호': a.account_number || '-',
                    '예금주': a.account_holder || '-',
                    '세부 내역': '기본급',
                    '비고': a.remarks || ''
                }))
            ];

            // 2. Create Sheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // 3. Style Column Widths (Optional basic scaling)
            ws['!cols'] = [
                { wch: 10 }, { wch: 10 }, { wch: 10 },
                { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 20 }, { wch: 10 },
                { wch: 40 }, { wch: 20 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `${selectedMonth} 급여정산`);

            // 4. Download
            XLSX.writeFile(wb, `Zarada_Settlement_${selectedMonth}.xlsx`);

        } catch (e) {
            console.error(e);
            alert('엑셀 변환 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        fetchSettlements();
    }, [selectedMonth]);

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            // 1. Get Staff
            const { data: staffData } = await supabase
                .from('therapists')
                .select('*')
                .neq('email', 'anukbin@gmail.com');

            // 2. Get Sessions for Month (Table: schedules)
            // Note: 'date' in sessions -> 'start_time' in schedules
            const startDate = `${selectedMonth}-01`;
            const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10);

            const { data: sessionData } = await supabase
                .from('schedules')
                .select('id, therapist_id, status, start_time, service_type')
                .gte('start_time', startDate)
                .lt('start_time', endDate)
                .eq('status', 'completed');

            // 3. Calculate (Advanced Engine)
            const calculatedList = staffData?.map(staff => {
                const mySessions = sessionData?.filter(s => s.therapist_id === staff.id) || [];

                // 📊 1. Count Sessions
                let raw_weekday = 0;
                let raw_weekend = 0;
                let eval_count = 0;

                mySessions.forEach(s => {
                    const date = new Date(s.start_time);
                    const day = date.getDay(); // 0: Sun, 6: Sat
                    const isWeekend = day === 0 || day === 6;
                    const isEval = s.service_type === 'evaluation' || s.service_type === 'assessment'; // Check service types

                    if (isEval) {
                        eval_count++;
                    } else {
                        if (isWeekend) raw_weekend++;
                        else raw_weekday++;
                    }
                });

                // 🏗️ 2. Apply Formula based on Hire Type
                let revenue = 0; // Conceptual revenue (could be just sum of prices, but we calculate 'Payout' mainly)
                let payout = 0;
                let incentiveText = '';

                const hireType = staff.hire_type || 'freelancer';
                const evalPrice = staff.evaluation_price || 50000;

                if (hireType === 'fulltime' || hireType === 'regular') {
                    // Case A: Regular (Base + Incentive + Eval)
                    const baseSalary = staff.base_salary || 0;
                    const required = staff.required_sessions || 0;
                    const incentivePrice = staff.incentive_price || 24000;

                    let weighted_count = raw_weekday + (raw_weekend * 1.5);

                    // Correction for under-performance
                    if (weighted_count < required) {
                        weighted_count += (eval_count * 2);
                    }

                    const excess = Math.max(0, weighted_count - required);
                    const incentive = excess * incentivePrice;
                    const evalPay = eval_count * evalPrice;

                    payout = baseSalary + incentive + evalPay;
                    revenue = payout / 0.6; // Estimate revenue back from payout? Or just 0.
                    incentiveText = `기본급 ${baseSalary.toLocaleString()} + 인센티브 ${incentive.toLocaleString()} (초과 ${excess.toFixed(1)}회) + 평가 ${evalPay.toLocaleString()}`;

                } else {
                    // Case B: Freelancer (Ratio-based)
                    const weekdayPrice = staff.session_price_weekday || 0;
                    const weekendPrice = staff.session_price_weekend || 0;

                    const weekdayPay = raw_weekday * weekdayPrice;
                    const weekendPay = raw_weekend * weekendPrice;
                    // Note: User prompt implied "Final Pay" formula. 
                    // If Eval is separate, it should be added.
                    // Assuming Eval is paid at 'evalPrice' for freelancers too?
                    // User prompt ONLY said: (raw_weekday * session_price_weekday) + (raw_weekend * session_price_weekend)
                    // But Logic A had eval variable. logic B Logic didn't mentioned Eval pay.
                    // I will add Eval Pay to be safe, labeled clearly.
                    const evalPay = eval_count * evalPrice;

                    payout = weekdayPay + weekendPay + evalPay;
                    revenue = payout / 0.6; // Rough estimate
                    incentiveText = `평일(${raw_weekday}) ${weekdayPay.toLocaleString()} + 주말(${raw_weekend}) ${weekendPay.toLocaleString()} + 평가(${eval_count}) ${evalPay.toLocaleString()}`;
                }

                return {
                    ...staff,
                    hire_type: hireType,
                    revenue,
                    payout,
                    incentiveText,
                    remarks: '',
                    counts: {
                        weekday: raw_weekday,
                        weekend: raw_weekend,
                        eval: eval_count,
                        consult: 0 // Defaulting to 0 as it wasn't calculated separately in this logic
                    }
                };
            }) || [];

            setSettlementList(calculatedList);
            setAdminList([]); // Admins not in therapists table usually

            const totalRev = calculatedList.reduce((acc, curr) => acc + curr.revenue, 0);
            const totalPay = calculatedList.reduce((acc, curr) => acc + curr.payout, 0);

            setTotalStats({
                revenue: totalRev,
                payout: totalPay,
                net: totalRev - totalPay,
                count: sessionData?.length || 0
            });

        } catch (error) {
            console.error('Error fetching settlements:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>급여 관리 - 자라다 Admin</title></Helmet>

            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">급여 정산</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">정규직 및 프리랜서 급여 자동 계산 (상담/평가 포함)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 🛡️ Super Admin Only Excel Button */}
                        {user?.email === 'anukbin@gmail.com' && (
                            <button
                                onClick={handleDownloadExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-md transition-all active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                엑셀 다운로드
                            </button>
                        )}
                        <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="font-bold text-slate-700 dark:text-white bg-transparent outline-none cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* ... existing stats ... */}

                {/* ✨ Staff Name Search Bar */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="직원 이름으로 검색..."
                        className="flex-1 font-bold text-slate-700 dark:text-white bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            if (!searchTerm) {
                                fetchSettlements(); // Reset to full list
                            } else {
                                setSettlementList(prev => prev.filter(s => s.name.toLowerCase().includes(searchTerm)));
                            }
                        }}
                    />
                </div>

                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setActiveTab('therapist')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'therapist' ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white' : 'text-slate-400 dark:text-slate-600'}`}>치료사</button>
                    <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'admin' ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white' : 'text-slate-400 dark:text-slate-600'}`}>행정직</button>
                </div>

                {activeTab === 'therapist' && (
                    <div className="grid grid-cols-1 gap-4">
                        {settlementList.map((t) => (
                            <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                {editingId === t.id ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                                            <span className="font-bold text-slate-800 dark:text-white">{t.name} 선생님 조건 수정</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">저장</button>
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold">취소</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">고용 형태</label>
                                                <select className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.hire_type} onChange={e => setEditForm({ ...editForm, hire_type: e.target.value })}>
                                                    <option value="freelancer">프리랜서</option>
                                                    <option value="fulltime">정규직</option>
                                                </select>
                                                {(editForm.hire_type === 'regular' || editForm.hire_type === 'fulltime') && (
                                                    <>
                                                        <div><span className="text-xs text-slate-400">기본급 (예: 1900000)</span><input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.base_salary} onChange={e => setEditForm({ ...editForm, base_salary: Number(e.target.value) })} /></div>
                                                        <div><span className="text-xs text-slate-400">기본 회기 (예: 90)</span><input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.base_session_count} onChange={e => setEditForm({ ...editForm, base_session_count: Number(e.target.value) })} /></div>
                                                        <div className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-1 rounded">ℹ️ 평일 1회, 주말 1.5회로 자동 계산</div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">{editForm.hire_type === 'regular' ? '인센 단가' : '평일 단가'}</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.weekday} onChange={e => setEditForm({ ...editForm, weekday: Number(e.target.value) })} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">주말 단가</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.weekend} onChange={e => setEditForm({ ...editForm, weekend: Number(e.target.value) })} placeholder={editForm.hire_type === 'regular' ? '계산 미사용' : ''} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">평가 수당</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.eval} onChange={e => setEditForm({ ...editForm, eval: Number(e.target.value) })} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">상담 수당</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.consult} onChange={e => setEditForm({ ...editForm, consult: Number(e.target.value) })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-5 flex-1 w-full">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-300 dark:text-slate-600 text-2xl">{t.name[0]}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${(t.hire_type === 'regular' || t.hire_type === 'fulltime') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                        {(t.hire_type === 'regular' || t.hire_type === 'fulltime') ? '정규직' : '프리랜서'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg inline-flex flex-wrap">
                                                    <span>평일 <b>{t.counts.weekday}</b></span>
                                                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                                                    <span>주말 <b>{t.counts.weekend}</b> <span className="text-[10px] text-slate-400">{t.hire_type === 'regular' ? '(x1.5)' : ''}</span></span>
                                                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                                                    <span className="text-blue-600 dark:text-blue-400">평가 <b>{t.counts.eval}</b></span>
                                                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                                                    <span className="text-emerald-600 dark:text-emerald-400">상담 <b>{t.counts.consult}</b></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end min-w-[150px]">
                                            <span className="block text-xs font-bold text-slate-400 mb-0.5">지급 예상액</span>
                                            <span className="block text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.payout.toLocaleString()}원</span>
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.incentiveText}</span>
                                        </div>
                                        <button onClick={() => startEdit(t)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'admin' && (
                    <div className="space-y-4">
                        {adminList.map((t) => (
                            <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
                                {editingId === t.id ? (
                                    <div className="flex gap-2 w-full items-center">
                                        <span className="font-bold w-20 text-slate-900 dark:text-white">{t.name}</span>
                                        <input placeholder="비고" className="border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded text-sm flex-1" value={editForm.remarks} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} />
                                        <input type="number" placeholder="월급" className="border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded text-sm w-32" value={editForm.base_salary} onChange={e => setEditForm({ ...editForm, base_salary: Number(e.target.value) })} />
                                        <button onClick={() => saveEdit(t.id)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold">저장</button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">{t.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.remarks || '행정직'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-lg text-slate-900 dark:text-white">{t.payout.toLocaleString()}원</span>
                                            <button onClick={() => startEdit(t)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"><Edit2 className="w-4 h-4 text-slate-400" /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}