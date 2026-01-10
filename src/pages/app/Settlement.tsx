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
    Calendar, DollarSign, Coins, Briefcase, Edit2, X, Check, Calculator, UserCheck
} from 'lucide-react';

export function Settlement() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('therapist');

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000));
        return kstDate.toISOString().slice(0, 7);
    });

    const [settlementList, setSettlementList] = useState([]);
    const [adminList, setAdminList] = useState([]);
    const [totalStats, setTotalStats] = useState({ revenue: 0, payout: 0 });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            const { data: staffs } = await supabase.from('therapists').select('*').order('name');
            const { data: schedules } = await supabase
                .from('schedules')
                .select(`
            date, 
            status,
            therapist_id, 
            programs (name, price, category)
        `)
                .eq('status', 'completed')
                .gte('date', startDate)
                .lte('date', endDate);

            let totalRev = 0;
            let totalPay = 0;

            const tList = [];
            const aList = [];

            staffs.forEach(staff => {
                if (staff.hire_type === 'admin') {
                    const pay = staff.base_salary || 0;
                    totalPay += pay;
                    aList.push({ ...staff, payout: pay });
                    return;
                }

                const mySchedules = schedules ? schedules.filter(s => s.therapist_id === staff.id) : [];

                let revenue = 0;
                let payout = 0;

                let cntWeekday = 0;
                let cntWeekend = 0;
                let cntEval = 0;
                let cntConsult = 0;

                mySchedules.forEach(s => {
                    const price = s.programs?.price || 0;
                    const category = s.programs?.category || 'therapy';
                    const pName = s.programs?.name || '';
                    const date = new Date(s.date);
                    const day = date.getDay();
                    const isWeekend = day === 0 || day === 6;

                    revenue += price;

                    // 카테고리별 분류
                    if (category === 'evaluation' || pName.includes('평가')) {
                        cntEval++;
                    } else if (category === 'counseling' || pName.includes('상담')) {
                        cntConsult++;
                    } else {
                        // 일반 치료 (평일/주말 구분)
                        if (isWeekend) cntWeekend++;
                        else cntWeekday++;
                    }
                });

                // 🧮 급여 계산 로직
                let incentiveText = '';
                const unitPriceWeekday = staff.session_rate_weekday || 0;
                const unitPriceWeekend = staff.session_rate_weekend || 0;
                const evalAllowance = staff.allowance_eval || 0;
                const consultAllowance = staff.allowance_consult || 0; // ✨ 상담 수당

                // [A] 정규직 (주말 1.5배 횟수 인정 + 상담수당 별도)
                if (staff.hire_type === 'regular') {
                    const baseCount = staff.base_session_count || 90;
                    const baseSalary = staff.base_salary || 1900000;
                    const incentiveRate = unitPriceWeekday; // 인센티브 단가는 평일단가 기준(보통 24000)

                    // 1. 회기 점수 계산 (주말 1.5배)
                    const sessionPoints = cntWeekday + (cntWeekend * 1.5);

                    payout = baseSalary; // 기본급

                    // 2. 상담 수당은 무조건 별도 지급 (+)
                    payout += (cntConsult * consultAllowance);

                    if (sessionPoints > baseCount) {
                        // 🟢 초과 달성: (초과점수 × 단가) + 평가수당
                        const alpha = sessionPoints - baseCount;
                        payout += (alpha * incentiveRate);
                        payout += (cntEval * evalAllowance);
                        incentiveText = `(초과 ${alpha.toFixed(1)}점)`;
                    } else {
                        // 🟠 미달 시: 평가를 점수(2배)로 환산하여 메꿈
                        const filledPoints = sessionPoints + (cntEval * 2);

                        if (filledPoints > baseCount) {
                            const alpha = filledPoints - baseCount;
                            payout += (alpha * incentiveRate);
                            incentiveText = `(평가환산 후 초과 ${alpha.toFixed(1)}점)`;
                        } else {
                            incentiveText = '(기본급)';
                        }
                    }
                }
                // [B] 프리랜서 (모두 건별 합산)
                else {
                    const payWeekday = cntWeekday * unitPriceWeekday;
                    const payWeekend = cntWeekend * unitPriceWeekend;
                    const payEval = cntEval * evalAllowance;
                    const payConsult = cntConsult * consultAllowance; // ✨ 상담 수당 추가

                    payout = payWeekday + payWeekend + payEval + payConsult;

                    incentiveText = `(평일${cntWeekday}/주말${cntWeekend}/상담${cntConsult})`;
                }

                totalRev += revenue;
                totalPay += payout;

                tList.push({
                    ...staff,
                    revenue,
                    payout,
                    totalCount: mySchedules.length,
                    counts: {
                        weekday: cntWeekday,
                        weekend: cntWeekend,
                        eval: cntEval,
                        consult: cntConsult
                    },
                    incentiveText
                });
            });

            setSettlementList(tList);
            setAdminList(aList);
            setTotalStats({ revenue: totalRev, payout: totalPay });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setEditForm({
            hire_type: t.hire_type || 'freelancer',
            base_salary: t.base_salary || 0,
            base_session_count: t.base_session_count || 0,
            weekday: t.session_rate_weekday || 0,
            weekend: t.session_rate_weekend || 0,
            eval: t.allowance_eval || 0,
            consult: t.allowance_consult || 0, // ✨ 상담
            remarks: t.remarks || ''
        });
    };

    const saveEdit = async (id) => {
        try {
            await supabase.from('therapists').update({
                hire_type: editForm.hire_type,
                base_salary: editForm.base_salary,
                base_session_count: editForm.base_session_count,
                session_rate_weekday: editForm.weekday,
                session_rate_weekend: editForm.weekend,
                allowance_eval: editForm.eval,
                allowance_consult: editForm.consult, // ✨ 상담 저장
                remarks: editForm.remarks
            }).eq('id', id);
            setEditingId(null);
            fetchData();
            alert('저장되었습니다.');
        } catch (e) {
            alert('저장 실패');
        }
    };

    return (
        <>
            <Helmet><title>급여 관리 - 자라다 Admin</title></Helmet>

            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">급여 정산</h1>
                        <p className="text-slate-500 text-sm">정규직 및 프리랜서 급여 자동 계산 (상담/평가 포함)</p>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="font-bold text-slate-700 bg-transparent outline-none cursor-pointer" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 mb-1">총 매출</p>
                        <h3 className="text-2xl font-black text-blue-600">{totalStats.revenue.toLocaleString()}원</h3>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 mb-1">총 급여 지급액</p>
                        <h3 className="text-2xl font-black text-rose-600">{totalStats.payout.toLocaleString()}원</h3>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 hidden md:block">
                        <p className="text-xs font-bold text-emerald-600 mb-1">예상 순수익</p>
                        <h3 className="text-2xl font-black text-emerald-700">{(totalStats.revenue - totalStats.payout).toLocaleString()}원</h3>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-slate-200">
                    <button onClick={() => setActiveTab('therapist')} className={`px-4 py-2 font-bold text-sm ${activeTab === 'therapist' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'}`}>치료사</button>
                    <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 font-bold text-sm ${activeTab === 'admin' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'}`}>행정직</button>
                </div>

                {activeTab === 'therapist' && (
                    <div className="grid grid-cols-1 gap-4">
                        {settlementList.map((t) => (
                            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                {editingId === t.id ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-bold text-slate-800">{t.name} 선생님 조건 수정</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">저장</button>
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">취소</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                                                <label className="block text-xs font-bold text-slate-500">고용 형태</label>
                                                <select className="w-full p-2 border rounded-lg font-bold" value={editForm.hire_type} onChange={e => setEditForm({ ...editForm, hire_type: e.target.value })}>
                                                    <option value="freelancer">프리랜서</option>
                                                    <option value="regular">정규직</option>
                                                </select>
                                                {editForm.hire_type === 'regular' && (
                                                    <>
                                                        <div><span className="text-xs text-slate-400">기본급 (예: 1900000)</span><input type="number" className="w-full p-2 border rounded-lg font-bold" value={editForm.base_salary} onChange={e => setEditForm({ ...editForm, base_salary: Number(e.target.value) })} /></div>
                                                        <div><span className="text-xs text-slate-400">기본 회기 (예: 90)</span><input type="number" className="w-full p-2 border rounded-lg font-bold" value={editForm.base_session_count} onChange={e => setEditForm({ ...editForm, base_session_count: Number(e.target.value) })} /></div>
                                                        <div className="text-[10px] text-blue-600 bg-blue-50 p-1 rounded">ℹ️ 평일 1회, 주말 1.5회로 자동 계산</div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">{editForm.hire_type === 'regular' ? '인센 단가' : '평일 단가'}</span>
                                                        <input type="number" className="w-full p-2 border rounded-lg font-bold" value={editForm.weekday} onChange={e => setEditForm({ ...editForm, weekday: Number(e.target.value) })} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">주말 단가</span>
                                                        <input type="number" className="w-full p-2 border rounded-lg font-bold" value={editForm.weekend} onChange={e => setEditForm({ ...editForm, weekend: Number(e.target.value) })} placeholder={editForm.hire_type === 'regular' ? '계산 미사용' : ''} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">평가 수당</span>
                                                        <input type="number" className="w-full p-2 border rounded-lg font-bold" value={editForm.eval} onChange={e => setEditForm({ ...editForm, eval: Number(e.target.value) })} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <span className="text-xs text-slate-400">상담 수당</span>
                                                        <input type="number" className="w-full p-2 border rounded-lg font-bold" value={editForm.consult} onChange={e => setEditForm({ ...editForm, consult: Number(e.target.value) })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-5 flex-1 w-full">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-300 text-2xl">{t.name[0]}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.hire_type === 'regular' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {t.hire_type === 'regular' ? '정규직' : '프리랜서'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-3 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg inline-flex flex-wrap">
                                                    <span>평일 <b>{t.counts.weekday}</b></span>
                                                    <span className="w-px h-4 bg-slate-200"></span>
                                                    <span>주말 <b>{t.counts.weekend}</b> <span className="text-[10px] text-slate-400">{t.hire_type === 'regular' ? '(x1.5)' : ''}</span></span>
                                                    <span className="w-px h-4 bg-slate-200"></span>
                                                    <span className="text-blue-600">평가 <b>{t.counts.eval}</b></span>
                                                    <span className="w-px h-4 bg-slate-200"></span>
                                                    <span className="text-emerald-600">상담 <b>{t.counts.consult}</b></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end min-w-[150px]">
                                            <span className="block text-xs font-bold text-slate-400 mb-0.5">지급 예상액</span>
                                            <span className="block text-2xl font-black text-slate-900 tracking-tight">{t.payout.toLocaleString()}원</span>
                                            <span className="text-[10px] font-bold text-blue-600">{t.incentiveText}</span>
                                        </div>
                                        <button onClick={() => startEdit(t)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600">
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
                            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                {editingId === t.id ? (
                                    <div className="flex gap-2 w-full items-center">
                                        <span className="font-bold w-20">{t.name}</span>
                                        <input placeholder="비고" className="border p-2 rounded text-sm flex-1" value={editForm.remarks} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} />
                                        <input type="number" placeholder="월급" className="border p-2 rounded text-sm w-32" value={editForm.base_salary} onChange={e => setEditForm({ ...editForm, base_salary: Number(e.target.value) })} />
                                        <button onClick={() => saveEdit(t.id)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold">저장</button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{t.name}</h3>
                                            <p className="text-xs text-slate-500">{t.remarks || '행정직'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-lg text-slate-900">{t.payout.toLocaleString()}원</span>
                                            <button onClick={() => startEdit(t)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><Edit2 className="w-4 h-4 text-slate-400" /></button>
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