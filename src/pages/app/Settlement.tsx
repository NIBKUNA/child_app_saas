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
    Calendar, Edit2, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { SUPER_ADMIN_EMAILS, isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';

// ✨ 고용 형태 타입
type HireType = 'freelancer' | 'fulltime' | 'parttime' | 'regular';

// ✨ 시스템 역할 타입
type SystemRole = 'therapist' | 'manager' | 'admin' | 'super_admin' | 'parent';

// ✨ 정산 통계 타입
interface TotalStats {
    payout: number;
    count: number;
}

// ✨ 세션 카운트 타입
interface SessionCounts {
    weekday: number;
    weekend: number;
    eval: number;
    consult: number;
}

// ✨ 정산 대상 데이터 타입
interface SettlementData {
    id: string;
    name: string;
    email: string;
    hire_type: HireType;
    system_role?: SystemRole | null;
    base_salary?: number | null;
    required_sessions?: number | null;
    session_price_weekday?: number | null;
    session_price_weekend?: number | null;
    evaluation_price?: number | null;
    consult_price?: number | null;
    incentive_price?: number | null;
    bank_name?: string | null;
    account_number?: string | null;
    account_holder?: string | null;
    remarks?: string | null;

    payout: number;
    incentiveText: string;
    counts: SessionCounts;
}

// ✨ 편집 폼 상태 타입
interface EditFormState {
    hire_type: HireType;
    base_salary: string;
    base_session_count: string;
    weekday: string;
    weekend: string;
    eval: string;
    consult: string;
    incentive: string;
    remarks: string;
}

// ✨ 치료사 데이터 타입 (Supabase therapists 테이블)
interface TherapistData {
    id: string;
    name: string;
    email: string;
    hire_type: HireType | null;
    system_role: SystemRole | null;
    base_salary: number | null;
    required_sessions: number | null;
    session_price_weekday: number | null;
    session_price_weekend: number | null;
    evaluation_price: number | null;
    consult_price: number | null;
    incentive_price: number | null;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    remarks: string | null;
    center_id: string;
}

// ✨ 스케줄 세션 데이터 타입
interface ScheduleSessionData {
    id: string;
    therapist_id: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    start_time: string;
    end_time: string;
    service_type: string | null;
}

export function Settlement() {
    const { user } = useAuth();
    const { center } = useCenter();
    const centerId = center?.id;
    const [_loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [settlementList, setSettlementList] = useState<SettlementData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [_totalStats, setTotalStats] = useState<TotalStats>({ payout: 0, count: 0 });

    // ✨ [Fix] Missing State Definitions
    const [editingId, setEditingId] = useState<string | null>(null);
    // ✨ [Fix] Use string for inputs to prevent "0" locking
    const [editForm, setEditForm] = useState<EditFormState>({
        hire_type: 'freelancer',
        base_salary: '',
        base_session_count: '',
        weekday: '',
        weekend: '',
        eval: '',
        consult: '',
        incentive: '', // ✨ Added
        remarks: ''
    });

    const startEdit = (t: SettlementData) => {
        setEditingId(t.id);
        setEditForm({
            hire_type: t.hire_type || 'freelancer',
            base_salary: String(t.base_salary || ''),
            base_session_count: String(t.required_sessions || ''),
            weekday: String(t.session_price_weekday || ''),
            weekend: String(t.session_price_weekend || ''),
            eval: String(t.evaluation_price || ''),
            consult: String(t.consult_price || ''),
            incentive: String(t.incentive_price || ''),
            remarks: t.remarks || ''
        });
    };

    const saveEdit = async (id: string) => {
        if (!centerId) return;
        if (!window.confirm('저장하시겠습니까?')) return;
        try {
            const updatePayload = {
                hire_type: editForm.hire_type,
                base_salary: Number(editForm.base_salary) || 0,
                required_sessions: Number(editForm.base_session_count) || 0,
                session_price_weekday: Number(editForm.weekday) || 0,
                session_price_weekend: Number(editForm.weekend) || 0,
                evaluation_price: Number(editForm.eval) || 0,
                consult_price: Number(editForm.consult) || 0,
                incentive_price: Number(editForm.incentive) || 0,
                remarks: editForm.remarks
            };
            const { error } = await supabase.from('therapists').update(updatePayload as never).eq('id', id).eq('center_id', centerId);
            if (error) throw error;
            alert('저장되었습니다.');
            setEditingId(null);
            fetchSettlements();
        } catch (error) {
            console.error(error);
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
                    '지급액': t.payout,
                    '은행명': t.bank_name || '-',
                    '계좌번호': t.account_number || '-',
                    '예금주': t.account_holder || '-',
                    '세부 내역': t.incentiveText,
                    '비고': t.remarks || ''
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
        if (centerId) fetchSettlements();
    }, [selectedMonth, centerId]);

    const fetchSettlements = async () => {
        if (!centerId) return; // ✨ Wait for auth

        setLoading(true);
        try {
            // 1. Get Staff for this Center
            // ⚠️ 직원관리에서 정식 등록된 활성 직원만 (배치마스터 전시용 프로필 & 퇴사자 제외)
            const superAdminListHost = `("${SUPER_ADMIN_EMAILS.join('","')}")`;
            const { data: staffDataRaw } = await supabase
                .from('therapists')
                .select('*')
                .eq('center_id', centerId)
                .eq('system_status', 'active')
                .filter('email', 'not.in', superAdminListHost)
                .not('email', 'like', 'display+%');
            const staffData = (staffDataRaw || []) as TherapistData[];

            // 2. Get Sessions for Month (Table: schedules)
            const startDate = `${selectedMonth}-01`;
            const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10);

            const { data: sessionDataRaw } = await supabase
                .from('schedules')
                .select('id, therapist_id, status, start_time, end_time, service_type')
                .eq('center_id', centerId)
                .gte('start_time', startDate)
                .lt('start_time', endDate);
            const sessionData = (sessionDataRaw || []) as ScheduleSessionData[];

            // ✨ [Auto-Completion] DB 업데이트는 AppLayout의 useAutoCompleteSchedules에서 중앙 처리됨
            // 로컬 데이터에서만 과거 scheduled를 completed로 보정 (정산 정확성 보장)
            const now = new Date();
            sessionData.forEach((s: ScheduleSessionData) => {
                if (s.status === 'scheduled' && new Date(s.end_time) < now) {
                    (s as { status: string }).status = 'completed';
                }
            });

            // Filter for calculation (only completed sessions)
            const completedSessions = sessionData.filter((s: ScheduleSessionData) => s.status === 'completed');

            // 3. Calculate (Advanced Engine)
            const calculatedList = staffData?.map(staff => {
                const mySessions = completedSessions.filter(s => s.therapist_id === staff.id) || [];

                // 📊 1. Count Sessions
                let raw_weekday = 0;
                let raw_weekend = 0;
                let eval_count = 0;
                let consult_count = 0;

                mySessions.forEach(s => {
                    const date = new Date(s.start_time);
                    const day = date.getDay(); // 0: Sun, 6: Sat
                    const isWeekend = day === 0 || day === 6;
                    const isEval = s.service_type === 'evaluation' || s.service_type === 'assessment';
                    const isConsult = s.service_type === 'counseling' || s.service_type === 'consultation';

                    if (isEval) {
                        eval_count++;
                    } else if (isConsult) {
                        consult_count++;
                    } else {
                        if (isWeekend) raw_weekend++;
                        else raw_weekday++;
                    }
                });

                // 🏗️ 2. Apply Formula based on Hire Type

                let payout = 0;
                let incentiveText = '';

                const hireType = staff.hire_type || 'freelancer';
                // ✨ [FIX] base_salary가 0인 경우를 올바르게 처리
                // || 연산자는 0을 falsy로 취급하므로, ?? 연산자를 사용하여
                // null/undefined일 때만 기본값을 적용
                const baseSalary = staff.base_salary ?? 0;
                const evalPrice = staff.evaluation_price ?? 50000;
                const consultPrice = staff.consult_price ?? 0;

                // ✨ [FIX] 프리랜서는 hire_type을 최우선으로 체크
                // system_role이 'manager'여도, hire_type이 'freelancer'이면
                // 반드시 회기당 급여로 정산해야 함
                if (hireType === 'freelancer') {
                    // Freelancer Therapist (회기당 급여 정산)
                    const weekdayPrice = staff.session_price_weekday || 0;
                    const weekendPrice = staff.session_price_weekend || 0;

                    const weekdayPay = raw_weekday * weekdayPrice;
                    const weekendPay = raw_weekend * weekendPrice;
                    const evalPay = eval_count * evalPrice;
                    const consultPay = consult_count * consultPrice;

                    payout = weekdayPay + weekendPay + evalPay + consultPay;

                    incentiveText = `평일(${raw_weekday})${weekdayPay.toLocaleString()} + 주말(${raw_weekend})${weekendPay.toLocaleString()} + 평가(${eval_count})${evalPay.toLocaleString()} + 상담(${consult_count})${consultPay.toLocaleString()}`;
                } else if (staff.system_role === 'manager') {
                    // 행정직/매니저 (고정 급여)
                    payout = baseSalary;
                    incentiveText = `월 고정 급여 ${baseSalary.toLocaleString()}원 (행정/매니저)`;
                } else if (hireType === 'fulltime' || hireType === 'regular' || staff.system_role === 'admin') {
                    // ✨ [사용자 규정 적용 + 유연한 설정 유지]
                    const goal = staff.required_sessions || 90;
                    const incentivePrice = staff.incentive_price || 24000;


                    // 1. 수업 수 = 평일(1) + 주말(1.5)
                    const base_weighted = raw_weekday + (raw_weekend * 1.5);

                    // 🏗️ 상담 수당은 기본 회기 로직과 별개로 상시 합산
                    const consult_pay = consult_count * consultPrice;

                    if (base_weighted > goal) {
                        // 90회 수업 초과시
                        const alpha = base_weighted - goal;
                        const excess_pay = alpha * incentivePrice;
                        const eval_bonus = eval_count * evalPrice;
                        payout = baseSalary + excess_pay + eval_bonus + consult_pay;
                        incentiveText = `기본급 ${baseSalary.toLocaleString()} + 초과수당 ${excess_pay.toLocaleString()}(${alpha.toFixed(1)}회) + 평가수당 ${eval_bonus.toLocaleString()}${consult_pay > 0 ? ` + 상담수당 ${consult_pay.toLocaleString()}` : ''}`;
                    } else {
                        // 90회 수업 전까지: 평가 X 2 로 부족한 회기수를 채움
                        const gap = goal - base_weighted;
                        const evals_needed = Math.ceil(gap / 2);
                        const evals_to_fill = Math.min(eval_count, evals_needed);
                        const evals_bonus_count = eval_count - evals_to_fill;

                        // 부족분 채운 후의 수업 수
                        const filled_total = base_weighted + (evals_to_fill * 2);
                        const alpha = Math.max(0, filled_total - goal);

                        // 초과분이 발생하거나 남은 평가가 있다면 보너스 합산
                        const excess_pay = alpha * incentivePrice;
                        const eval_bonus = evals_bonus_count * evalPrice;

                        payout = baseSalary + excess_pay + eval_bonus + consult_pay;

                        let text = `기본급 ${baseSalary.toLocaleString()}`;
                        if (alpha > 0) text += ` + 초과수당 ${excess_pay.toLocaleString()}`;
                        if (evals_bonus_count > 0) text += ` + 평가수당 ${eval_bonus.toLocaleString()}`;
                        if (consult_pay > 0) text += ` + 상담수당 ${consult_pay.toLocaleString()}`;
                        if (alpha === 0 && evals_bonus_count === 0 && consult_pay === 0) {
                            text += ` (회기:${base_weighted}/보충:${evals_to_fill})`;
                        }
                        incentiveText = text;
                    }

                } else {
                    // 기타 고용 형태 (안전 fallback — 프리랜서 로직 적용)
                    const weekdayPrice = staff.session_price_weekday || 0;
                    const weekendPrice = staff.session_price_weekend || 0;

                    const weekdayPay = raw_weekday * weekdayPrice;
                    const weekendPay = raw_weekend * weekendPrice;
                    const evalPay = eval_count * evalPrice;
                    const consultPay = consult_count * consultPrice;

                    payout = weekdayPay + weekendPay + evalPay + consultPay;

                    incentiveText = `평일(${raw_weekday})${weekdayPay.toLocaleString()} + 주말(${raw_weekend})${weekendPay.toLocaleString()} + 평가(${eval_count})${evalPay.toLocaleString()} + 상담(${consult_count})${consultPay.toLocaleString()}`;
                }


                return {
                    ...staff,
                    hire_type: hireType,

                    payout,
                    incentiveText,
                    remarks: staff.remarks || '',
                    counts: {
                        weekday: raw_weekday,
                        weekend: raw_weekend,
                        eval: eval_count,
                        consult: consult_count
                    }
                };
            }) || [];

            setSettlementList(calculatedList);

            const totalPay = calculatedList.reduce((acc, curr) => acc + curr.payout, 0);

            setTotalStats({
                payout: totalPay,
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
                        {checkSuperAdmin(user?.email) && (
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* ✨ Staff List */}
                <div className="grid grid-cols-1 gap-4">
                    {settlementList.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
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
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">고용 및 급여 형태</label>
                                            {t.system_role === 'manager' ? (
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 font-bold text-slate-700 dark:text-white">
                                                    행정/매니저 (고정급 정산)
                                                </div>
                                            ) : (
                                                <select className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.hire_type} onChange={e => setEditForm({ ...editForm, hire_type: e.target.value as HireType })}>
                                                    <option value="freelancer">프리랜서</option>
                                                    <option value="fulltime">정규직</option>
                                                </select>
                                            )}

                                            {(editForm.hire_type === 'fulltime' || t.system_role === 'manager' || t.system_role === 'admin') && (
                                                <>
                                                    <div><span className="text-xs text-slate-400">월 고정 급여 (원)</span><input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.base_salary} onChange={e => setEditForm({ ...editForm, base_salary: e.target.value })} placeholder="0" /></div>
                                                    {t.system_role !== 'manager' && (
                                                        <div><span className="text-xs text-slate-400">기본 의무 회기 (회)</span><input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.base_session_count} onChange={e => setEditForm({ ...editForm, base_session_count: e.target.value })} placeholder="0" /></div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {t.system_role !== 'manager' && (
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-bold">평일 수업 단가</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.weekday} onChange={e => setEditForm({ ...editForm, weekday: e.target.value })} placeholder="0" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-bold">주말 수업 단가</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.weekend} onChange={e => setEditForm({ ...editForm, weekend: e.target.value })} placeholder="0" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-bold">평가 수당</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.eval} onChange={e => setEditForm({ ...editForm, eval: e.target.value })} placeholder="0" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-bold">상담 수당</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.consult} onChange={e => setEditForm({ ...editForm, consult: e.target.value })} placeholder="0" />
                                                    </div>
                                                </div>
                                                {(editForm.hire_type === 'fulltime' || editForm.hire_type === 'regular' || t.system_role === 'admin') && (
                                                    <div>
                                                        <span className="text-xs text-slate-400 font-bold">초과 인센티브 (회당)</span>
                                                        <input type="number" className="w-full p-2 border dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={editForm.incentive} onChange={e => setEditForm({ ...editForm, incentive: e.target.value })} placeholder="0" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
            </div>
        </>
    );
}