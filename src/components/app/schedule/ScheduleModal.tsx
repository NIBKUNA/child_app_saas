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
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import {
    X, Loader2, Save, Trash2,
    CheckCircle2, XCircle, ArrowRightCircle, CalendarClock, Repeat, Search, ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { isSuperAdmin } from '@/config/superAdmin';

// ✨ 10분 단위 시간 목록 (00:00 ~ 23:50)
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
        TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
}

/** 케어플 스타일 시간 입력 (타이핑 + 드롭다운) */
function TimeComboBox({ value, onChange, label, disabled = false }: { value: string; onChange: (v: string) => void; label: string; disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const [inputVal, setInputVal] = useState(value);
    const listRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setInputVal(value); }, [value]);

    // 드롭다운 열릴 때 현재 값 근처로 스크롤
    useEffect(() => {
        if (open && listRef.current) {
            const idx = TIME_OPTIONS.indexOf(value);
            if (idx >= 0) {
                const item = listRef.current.children[idx] as HTMLElement;
                if (item) item.scrollIntoView({ block: 'center' });
            }
        }
    }, [open, value]);

    // 바깥 클릭 시 닫기
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const commitValue = useCallback((raw: string) => {
        const clean = raw.replace(/[^0-9:]/g, '');
        const match = clean.match(/^(\d{1,2}):?(\d{0,2})$/);
        if (match) {
            const h = Math.min(23, Math.max(0, parseInt(match[1] || '0')));
            const m = Math.min(59, Math.max(0, parseInt(match[2] || '0')));
            const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            setInputVal(formatted);
            onChange(formatted);
        } else {
            setInputVal(value);
        }
    }, [value, onChange]);

    return (
        <div className="flex-1 relative" ref={wrapRef}>
            <span className="text-[10px] font-bold text-rose-500 mr-0.5">*</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
            <input
                type="text"
                disabled={disabled}
                className={cn(
                    "w-full mt-1 p-2.5 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-center text-sm",
                    disabled && "opacity-60 cursor-not-allowed"
                )}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onFocus={() => !disabled && setOpen(true)}
                onClick={() => !disabled && setOpen(true)}
                onBlur={() => setTimeout(() => commitValue(inputVal), 150)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitValue(inputVal); setOpen(false); } }}
                placeholder="HH:MM"
            />
            {open && !disabled && (
                <div
                    ref={listRef}
                    className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg"
                >
                    {TIME_OPTIONS.map(t => (
                        <button
                            key={t}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); onChange(t); setInputVal(t); setOpen(false); }}
                            className={cn(
                                "w-full px-3 py-2 text-sm font-bold text-left hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors",
                                t === value ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ✨ [Searchable Select Component]
// Moved import to top-level
import { useAuth } from '@/contexts/AuthContext';

interface Option {
    id: string;
    name: string;
    color?: string;
}

interface SearchableSelectProps {
    label: string;
    placeholder: string;
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
}

function SearchableSelect({ label, placeholder, options, value, onChange }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">{label}</label>
            <div
                className="w-full p-3 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500/20"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            {selectedOption.color && (
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedOption.color }} />
                            )}
                            <span className="text-slate-900 dark:text-white">{selectedOption.name}</span>
                        </>
                    ) : (
                        <span className="text-slate-400 font-medium">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </div>

            {isOpen && (
                <div className="absolute z-[60] mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="p-2 border-b dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                autoFocus
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-0 font-bold"
                                placeholder="검색..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    className={cn(
                                        "px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2",
                                        value === opt.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                    )}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {opt.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />}
                                    {opt.name}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center font-bold">검색 결과가 없습니다.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setIsOpen(false)} />}
        </div>
    );
}



interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    scheduleId?: string | null;
    initialDate?: string | Date | any;
    onSuccess: () => void;
    readOnly?: boolean; // ✨ 치료사 권한일 때 true → 읽기 전용
}

// ✨ [Helper] 공통 타임존 변환 유틸
import { toLocalTimeStr, toLocalDateStr } from '@/utils/timezone';

export function ScheduleModal({ isOpen, onClose, scheduleId, initialDate, onSuccess, readOnly = false }: ScheduleModalProps) {
    const { center } = useCenter();
    const centerId = center?.id;
    const { role, therapistId: authTherapistId } = useAuth(); // ✨ Role & Therapist ID

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [childrenList, setChildrenList] = useState<any[]>([]);
    const [programsList, setProgramsList] = useState<any[]>([]);
    const [therapistsList, setTherapistsList] = useState<any[]>([]);


    const [isRecurring, setIsRecurring] = useState(false);
    const RECURRING_WEEKS = 26; // 6개월 자동 반복

    const [formData, setFormData] = useState({
        child_id: '',
        program_id: '',
        therapist_id: '',
        date: '',
        start_time: '10:00',
        end_time: '10:40',
        status: 'scheduled',
        service_type: 'therapy',
        notes: ''
    });

    // ✨ [원래 시간 추적] 시간 변경 감지용
    const [originalTime, setOriginalTime] = useState({ start_time: '', end_time: '' });

    // ✨ [시간 변경 범위 선택 모달]
    const [showTimeChangeModal, setShowTimeChangeModal] = useState(false);
    const [pendingTimeChange, setPendingTimeChange] = useState<{
        prevSchedule: any;
        makeIsoString: (d: string, t: string) => string;
    } | null>(null);

    // ✨ [ScheduleModal] Initialization
    useEffect(() => {
        if (isOpen && centerId && centerId.length >= 32) {
            loadInitialData(centerId);
            setIsRecurring(false);
        }
    }, [isOpen, scheduleId, initialDate, centerId]);

    const loadInitialData = async (targetId: string) => {
        if (!targetId || targetId.length < 32) return;

        setFetching(true);
        try {
            // ✨ [Performance] user_profiles 전체 쿼리 제거 → therapists 데이터만으로 필터링
            const [childRes, progRes, therRes] = await Promise.all([
                supabase.from('children').select('id, name, status, is_active, center_id').eq('center_id', targetId).order('name'),
                supabase.from('programs').select('id, name, duration, price, is_active, category').eq('center_id', targetId).order('name'),
                supabase.from('therapists').select('id, name, email, color, system_status, system_role, profile_id').eq('center_id', targetId).order('name'),
            ]);

            // ✨ [FIX] 이용중(active) 아동만 일정 등록 가능 (종결/대기 제외)
            const activeChildrenOnly = (childRes.data || []).filter((c: any) =>
                c.status === 'active' || (!c.status && c.is_active !== false)
            );
            setChildrenList(activeChildrenOnly);
            setProgramsList(progRes.data || []);

            // ✨ [Filter] 슈퍼 어드민 제외, display-only 프로필 제외, 퇴사자 제외
            const rawTherapists = therRes.data || [];

            let filteredTherapists = rawTherapists.filter((t: any) => {
                if (t.email && isSuperAdmin(t.email)) return false;
                // ⚠️ 치료사 배치 마스터 전시용 프로필 제외
                if (t.email && t.email.startsWith('display+')) return false;
                // ⚠️ 퇴사자 제외
                if (t.system_status === 'retired' || t.system_status === 'rejected') return false;
                // ⚠️ system_role이 super_admin이면 제외
                if (t.system_role === 'super_admin') return false;
                return true;
            });

            // ✨ [권한 분리] 치료사는 본인만 선택 가능하도록 제한
            if (role === 'therapist' && authTherapistId) {
                filteredTherapists = filteredTherapists.filter((t: { id: string }) => t.id === authTherapistId);
            }

            // 👑 [브랜딩] (주)자라다를 목록 맨 앞에 추가 (노출용)
            const zaradaEntry = { id: '__zarada_brand__', name: '(주)자라다', color: '#000000' };
            setTherapistsList([zaradaEntry, ...filteredTherapists]);

            if (scheduleId) {
                // ✨ [성능 개선] 부모로부터 데이터가 넘어왔다면 DB 조회 스킵
                if (initialDate && typeof initialDate === 'object' && initialDate.child_id) {
                    const data = initialDate;
                    const sTime = toLocalTimeStr(data.start_time);
                    const eTime = toLocalTimeStr(data.end_time);

                    setFormData({
                        child_id: data.child_id,
                        program_id: data.program_id,
                        therapist_id: data.therapist_id,
                        date: data.date || toLocalDateStr(data.start_time),
                        start_time: sTime || '10:00',
                        end_time: eTime || '10:40',
                        status: data.status,
                        service_type: data.service_type || 'therapy',
                        notes: data.notes || ''
                    });
                    setOriginalTime({ start_time: sTime || '10:00', end_time: eTime || '10:40' });
                } else {
                    const { data } = await supabase.from('schedules').select('*').eq('id', scheduleId).single();
                    if (data) {
                        const sTime = toLocalTimeStr(data.start_time);
                        const eTime = toLocalTimeStr(data.end_time);

                        setFormData({
                            child_id: data.child_id ?? '',
                            program_id: data.program_id ?? '',
                            therapist_id: data.therapist_id ?? '',
                            date: data.date || toLocalDateStr(data.start_time),
                            start_time: sTime || '10:00',
                            end_time: eTime || '10:40',
                            status: data.status ?? 'scheduled',
                            service_type: data.service_type || 'therapy',
                            notes: data.notes ?? ''
                        });
                        setOriginalTime({ start_time: sTime || '10:00', end_time: eTime || '10:40' });
                    }
                }
            } else {
                // 신규 등록
                const initDateParam = (initialDate && !(initialDate instanceof Date) && typeof initialDate === 'object' && initialDate.date)
                    ? initialDate.date
                    : initialDate;

                let initDate = initDateParam ? new Date(initDateParam) : new Date();
                if (isNaN(initDate.getTime())) initDate = new Date();

                const year = initDate.getFullYear();
                const month = String(initDate.getMonth() + 1).padStart(2, '0');
                const day = String(initDate.getDate()).padStart(2, '0');
                const h = String(initDate.getHours()).padStart(2, '0');
                const m = String(initDate.getMinutes()).padStart(2, '0');
                const timeStr = `${h}:${m}`;

                setFormData({
                    child_id: '',
                    program_id: '',
                    therapist_id: (role === 'therapist' && authTherapistId) ? authTherapistId : '__zarada_brand__',
                    date: `${year}-${month}-${day}`,
                    start_time: timeStr === '00:00' ? '10:00' : timeStr,
                    end_time: calculateEndTime(timeStr === '00:00' ? '10:00' : timeStr, 40),
                    status: 'scheduled',
                    service_type: 'therapy',
                    notes: ''
                });
            }
        } finally {
            setFetching(false);
        }
    };

    const calculateEndTime = (start: string, duration: number) => {
        const [h, m] = start.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + duration);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // ✨ [STRICT CHECK] 
            if (!formData.child_id) {
                alert("아동을 선택해주세요.");
                setLoading(false);
                return;
            }
            if (!centerId) throw new Error("센터 정보가 없습니다. 다시 시도해 주세요.");

            // 👑 브랜딩용 가짜 ID는 DB 저장 시 null로 변환
            const sanitizedTherapistId = formData.therapist_id === '__zarada_brand__' ? null : (formData.therapist_id || null);

            const basePayload = {
                center_id: centerId,
                child_id: formData.child_id || null,
                program_id: formData.program_id || null,
                therapist_id: sanitizedTherapistId,
                status: formData.status as any,
                service_type: formData.service_type,
                notes: formData.notes || null
            };

            // ✨ [핵심 수정] KST 타임존 명시 — TIMESTAMPTZ에 UTC로 해석되는 것을 방지
            const makeIsoString = (date: string, time: string) => `${date}T${time}:00+09:00`;

            if (!scheduleId && isRecurring) {
                // ✨ [매주 반복 등록] 6개월(26주) 자동 생성 — parent_schedule_id로 그룹 추적
                const [y, m, d] = formData.date.split('-').map(Number);

                // 1단계: 첫 번째 일정 생성 (이것이 parent가 됨)
                const firstDateStr = formData.date;
                const { data: firstSchedule, error: firstError } = await supabase.from('schedules').insert([{
                    ...basePayload,
                    date: firstDateStr,
                    start_time: makeIsoString(firstDateStr, formData.start_time),
                    end_time: makeIsoString(firstDateStr, formData.end_time),
                    is_recurring: true,
                    recurrence_rule: 'WEEKLY'
                }]).select('id').single();
                if (firstError) throw firstError;

                const parentId = firstSchedule.id;

                // 2단계: 나머지 25주 일정 생성 (parent_schedule_id로 연결)
                const remainingSchedules = [];
                for (let i = 1; i < RECURRING_WEEKS; i++) {
                    const nextDate = new Date(y, m - 1, d + (i * 7));
                    const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
                    remainingSchedules.push({
                        ...basePayload,
                        date: nextDateStr,
                        start_time: makeIsoString(nextDateStr, formData.start_time),
                        end_time: makeIsoString(nextDateStr, formData.end_time),
                        is_recurring: true,
                        recurrence_rule: 'WEEKLY',
                        parent_schedule_id: parentId
                    });
                }
                const { error: batchError } = await supabase.from('schedules').insert(remainingSchedules);
                if (batchError) throw batchError;

                // ✨ [Notification] 치료사에게 알림 생성
                const targetTherapist = therapistsList.find(t => t.id === formData.therapist_id);
                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (targetTherapist?.profile_id && targetTherapist.profile_id !== currentUser?.id) {
                    await supabase.from('admin_notifications').insert([{
                        center_id: centerId,
                        user_id: targetTherapist.profile_id,
                        type: 'schedule',
                        title: '🚀 매주 반복 일정 등록',
                        message: `${formData.date}부터 ${RECURRING_WEEKS}주간 매주 반복 일정이 등록되었습니다.`,
                        is_read: false
                    }]);
                }

                alert(`${RECURRING_WEEKS}주(약 6개월) 매주 반복 일정이 등록되었습니다.`);
            } else {
                const payload = {
                    ...basePayload,
                    date: formData.date,
                    start_time: makeIsoString(formData.date, formData.start_time),
                    end_time: makeIsoString(formData.date, formData.end_time)
                };

                if (scheduleId) {
                    // ✨ [시간 변경 감지] 원래 시간과 비교
                    const timeChanged = originalTime.start_time !== formData.start_time || originalTime.end_time !== formData.end_time;

                    // ⭐ [이월 크레딧 연동] 상태 변경 시 크레딧 자동 처리
                    const { data: prevSchedule } = await supabase
                        .from('schedules')
                        .select('status, program_id, child_id, parent_schedule_id, is_recurring')
                        .eq('id', scheduleId)
                        .single();

                    // 현재 일정 수정
                    const { error: updateError } = await supabase.from('schedules').update(payload).eq('id', scheduleId);
                    if (updateError) throw updateError;

                    // 이전 상태와 새 상태 비교 (크레딧 처리)
                    const prevStatus = prevSchedule?.status as string;
                    if (prevSchedule && prevStatus !== formData.status) {
                        const programPrice = programsList.find(p => p.id === (prevSchedule.program_id || formData.program_id))?.price || 0;
                        const childId = prevSchedule.child_id || formData.child_id;

                        if (programPrice > 0 && childId) {
                            if (formData.status === 'carried_over' && prevStatus !== 'carried_over') {
                                // ✨ [이월 전환] 기수납 여부 확인 → 수납됐으면 환불, 미수납이면 이월금 적립
                                const { data: existingItems } = await supabase.from('payment_items')
                                    .select('payment_id, amount')
                                    .eq('schedule_id', scheduleId)
                                    .gt('amount', 0);

                                const hasPaid = existingItems && existingItems.length > 0;

                                if (hasPaid) {
                                    // 기수납 세션 → 결제별로 환불 처리
                                    const paymentIds = [...new Set(existingItems!.map(i => i.payment_id).filter((id): id is string => !!id))];
                                    for (const pid of paymentIds) {
                                        const { data: origPay } = await supabase.from('payments')
                                            .select('amount, credit_used, center_id')
                                            .eq('id', pid).single();
                                        if (!origPay) continue;
                                        const cashPaid = Number(origPay.amount) || 0;
                                        const creditUsedInPay = Number(origPay.credit_used) || 0;

                                        // 현금 환불 기록
                                        if (cashPaid > 0) {
                                            const { data: refPay } = await supabase.from('payments').insert({
                                                child_id: childId, center_id: origPay.center_id || centerId,
                                                amount: -cashPaid, credit_used: 0,
                                                method: '환불(이월)', memo: '이월 전환 자동환불',
                                                payment_month: formData.date.slice(0, 7),
                                            } as any).select('id').single();
                                            if (refPay) {
                                                await supabase.from('payment_items').insert({
                                                    schedule_id: scheduleId, payment_id: refPay.id, amount: -cashPaid,
                                                } as any);
                                            }
                                        }

                                        // 이월금 결제분 복원
                                        if (creditUsedInPay > 0) {
                                            const { data: child } = await supabase.from('children').select('credit').eq('id', childId).single();
                                            await supabase.from('children').update({ credit: (child?.credit || 0) + creditUsedInPay }).eq('id', childId);
                                        }
                                    }
                                } else {
                                    // 미수납 세션 → 이월금 적립 (기존 로직)
                                    const { data: child } = await supabase.from('children').select('credit').eq('id', childId).single();
                                    const newCredit = (child?.credit || 0) + programPrice;
                                    await supabase.from('children').update({ credit: newCredit }).eq('id', childId);
                                }
                            } else if (prevStatus === 'carried_over' && formData.status !== 'carried_over') {
                                // ✨ [안전장치] 자동환불된 세션인지 확인 → 자동환불 세션은 이월금 차감 불필요
                                const { data: refundCheck } = await supabase.from('payments')
                                    .select('id')
                                    .eq('child_id', childId)
                                    .eq('method', '환불(이월)')
                                    .limit(1);
                                const hasAutoRefund = (refundCheck?.length || 0) > 0;

                                // 기존 payment_items에 환불(음수) 기록이 있으면 자동환불된 세션
                                const { data: refundItems } = await supabase.from('payment_items')
                                    .select('amount')
                                    .eq('schedule_id', scheduleId)
                                    .lt('amount', 0)
                                    .limit(1);
                                const wasAutoRefunded = hasAutoRefund || (refundItems?.length || 0) > 0;

                                if (!wasAutoRefunded) {
                                    const { data: child } = await supabase.from('children').select('credit').eq('id', childId).single();
                                    const newCredit = Math.max(0, (child?.credit || 0) - programPrice);
                                    await supabase.from('children').update({ credit: newCredit }).eq('id', childId);
                                }
                            }
                        }
                    }

                    // ✨ [시간 변경 시] 커스텀 모달로 선택지 제공 — onSuccess는 모달 닫힌 후 호출
                    if (timeChanged) {
                        setPendingTimeChange({ prevSchedule, makeIsoString });
                        setShowTimeChangeModal(true);
                        setLoading(false);
                        return; // ⛔ onSuccess() 호출하지 않음!
                    }
                } else {
                    const { error } = await supabase.from('schedules').insert([payload]).select().single();
                    if (error) throw error;

                    // ✨ [Notification] 치료사에게 알림 생성
                    const targetTherapist = therapistsList.find(t => t.id === formData.therapist_id);
                    const { data: { user: currentUser } } = await supabase.auth.getUser();

                    if (targetTherapist?.profile_id && targetTherapist.profile_id !== currentUser?.id) {
                        await supabase.from('admin_notifications').insert([{
                            center_id: centerId,
                            user_id: targetTherapist.profile_id,
                            type: 'schedule',
                            title: '📅 새 일정이 등록되었습니다',
                            message: `${formData.date} ${formData.start_time} 일정을 확인해주세요.`,
                            is_read: false
                        }]);
                    }
                }
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('저장 실패: ' + ((error as Error).message || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (forceFuture = false) => {
        setLoading(true);
        try {
            const deleteFuture = forceFuture;

            // 결제 여부 확인 (Ghost Credit 방지)
            const { data: payItems } = await supabase.from('payment_items').select('id, payment_id').eq('schedule_id', scheduleId!);

            if (payItems && payItems.length > 0) {
                if (!confirm(
                    '⚠️ 경고: 이 일정은 이미 수납(결제) 처리가 되었습니다.\n\n' +
                    '일정을 삭제하면 결제 내역은 남지만, 연결된 수업이 사라져 "잔액(Credit)"으로 잡히게 됩니다.\n' +
                    '정말 삭제하시겠습니까?'
                )) {
                    setLoading(false);
                    return;
                }
            } else {
                if (!confirm(deleteFuture ? '이 일정과 이후 모든 반복 일정을 삭제하시겠습니까?' : '이 일정만 삭제하시겠습니까?')) {
                    setLoading(false);
                    return;
                }
            }

            if (deleteFuture) {
                // ✨ [반복 그룹 삭제] parent_schedule_id 기반 + 날짜 기반 하이브리드
                // 현재 일정의 반복 그룹 정보 확인
                const { data: currentSchedule } = await supabase
                    .from('schedules')
                    .select('id, parent_schedule_id, is_recurring, date')
                    .eq('id', scheduleId!)
                    .single();

                // 반복 그룹 ID 결정 (자신이 parent이면 자신의 ID, 아니면 parent_schedule_id)
                const groupId = currentSchedule?.parent_schedule_id || currentSchedule?.id;

                let futureIds: string[] = [];

                if (currentSchedule?.is_recurring && groupId) {
                    // ✨ [방법 1] parent_schedule_id 기반 정확한 그룹 삭제
                    const { data: groupSchedules } = await supabase
                        .from('schedules')
                        .select('id')
                        .eq('center_id', centerId!)
                        .gte('date', formData.date)
                        .or(`id.eq.${groupId},parent_schedule_id.eq.${groupId}`);

                    futureIds = (groupSchedules || []).map((s: any) => s.id);
                } else {
                    // ✨ [방법 2] 레거시 호환: 아동+프로그램+치료사+날짜 기반 매칭
                    let query = supabase
                        .from('schedules')
                        .select('id')
                        .eq('center_id', centerId!)
                        .eq('child_id', formData.child_id)
                        .eq('program_id', formData.program_id)
                        .gte('date', formData.date);

                    if (formData.therapist_id) {
                        query = query.eq('therapist_id', formData.therapist_id);
                    } else {
                        query = query.is('therapist_id', null);
                    }

                    const { data: futureSchedules } = await query;
                    futureIds = (futureSchedules || []).map((s: any) => s.id);
                }

                if (futureIds.length > 0) {
                    // ✨ [이월금 정합성] 삭제 전 이월 상태 일정 확인
                    const { data: carriedSchedules } = await supabase.from('schedules')
                        .select('id, status, child_id, program_id')
                        .in('id', futureIds)
                        .eq('status', 'carried_over');

                    // 하위 참조 데이터 삭제
                    const { data: logs } = await supabase
                        .from('counseling_logs')
                        .select('id')
                        .in('schedule_id', futureIds);

                    if (logs && logs.length > 0) {
                        const logIds = logs.map((l: any) => l.id);
                        await supabase.from('development_assessments').delete().in('log_id', logIds);
                    }

                    await supabase.from('consultations').delete().in('schedule_id', futureIds);
                    await supabase.from('payment_items').delete().in('schedule_id', futureIds);
                    await supabase.from('counseling_logs').delete().in('schedule_id', futureIds);

                    const { error } = await supabase.from('schedules').delete().in('id', futureIds);
                    if (error) throw error;

                    // ✨ 이월 상태였던 일정들의 이월금 차감
                    if (carriedSchedules && carriedSchedules.length > 0) {
                        const childId = carriedSchedules[0].child_id;
                        const totalCreditToRemove = carriedSchedules.reduce((sum, s) => {
                            const prog = programsList.find(p => p.id === s.program_id);
                            return sum + (prog?.price || 0);
                        }, 0);
                        if (totalCreditToRemove > 0 && childId) {
                            const { data: child } = await supabase.from('children').select('credit').eq('id', childId).single();
                            await supabase.from('children').update({ credit: Math.max(0, (child?.credit || 0) - totalCreditToRemove) }).eq('id', childId);
                        }
                    }

                    alert(`이후 ${futureIds.length}개의 일정이 삭제되었습니다.`);
                }
            } else {
                // 단일 삭제
                // ✨ [이월금 정합성] 이월 상태 일정 삭제 시 이월금 차감
                const { data: delSchedule } = await supabase.from('schedules')
                    .select('status, child_id, program_id')
                    .eq('id', scheduleId!).single();

                const { data: logs } = await supabase
                    .from('counseling_logs')
                    .select('id')
                    .eq('schedule_id', scheduleId!);

                if (logs && logs.length > 0) {
                    const logIds = logs.map((l: any) => l.id);
                    await supabase.from('development_assessments').delete().in('log_id', logIds);
                }

                await supabase.from('consultations').delete().eq('schedule_id', scheduleId!);
                await supabase.from('payment_items').delete().eq('schedule_id', scheduleId!);
                await supabase.from('counseling_logs').delete().eq('schedule_id', scheduleId!);

                const { error } = await supabase.from('schedules').delete().eq('id', scheduleId!);
                if (error) throw error;

                // ✨ 이월 상태였던 일정 삭제 → 이월금 차감
                if (delSchedule?.status === 'carried_over' && delSchedule.child_id && delSchedule.program_id) {
                    const prog = programsList.find(p => p.id === delSchedule.program_id);
                    const price = prog?.price || 0;
                    if (price > 0) {
                        const { data: child } = await supabase.from('children').select('credit').eq('id', delSchedule.child_id).single();
                        await supabase.from('children').update({ credit: Math.max(0, (child?.credit || 0) - price) }).eq('id', delSchedule.child_id);
                    }
                }
            }

            onSuccess();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('일정 삭제 중 오류가 발생했습니다.\n' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };
    const handleProgramChange = (pid: string) => {
        const p = programsList.find(x => x.id === pid);
        setFormData(prev => ({
            ...prev,
            program_id: pid,
            service_type: p?.category || 'therapy',
            end_time: p ? calculateEndTime(prev.start_time, p.duration) : prev.end_time
        }));
    };

    const handleStartTimeChange = (sTime: string) => {
        const p = programsList.find(x => x.id === formData.program_id);
        // ✨ [Fix] 프로그램 미선택 시에도 기본 40분으로 end_time 자동 계산
        const duration = p?.duration || 40;
        const eTime = calculateEndTime(sTime, duration);
        setFormData(prev => ({ ...prev, start_time: sTime, end_time: eTime }));
    };

    const getStatusStyle = (s: string) => {
        if (s === 'completed') return { icon: <CheckCircle2 className="w-4" />, label: '완료', activeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        if (s === 'cancelled') return { icon: <XCircle className="w-4" />, label: '취소', activeClass: 'bg-rose-50 text-rose-600 border-rose-200' };
        if (s === 'carried_over') return { icon: <ArrowRightCircle className="w-4" />, label: '이월', activeClass: 'bg-purple-50 text-purple-600 border-purple-200' };
        return { icon: <CalendarClock className="w-4" />, label: '예정', activeClass: 'bg-blue-50 text-blue-600 border-blue-200' };
    }

    if (!isOpen) return null;

    // ✨ [이후 수업 시간 일괄 변경]
    const handleApplyFutureTimeChange = async () => {
        if (!pendingTimeChange || !centerId || !scheduleId) return;
        setLoading(true);
        try {
            const { prevSchedule, makeIsoString } = pendingTimeChange;
            const groupId = prevSchedule?.parent_schedule_id || scheduleId;
            const isRecurringGroup = prevSchedule?.is_recurring;

            // ✨ date가 null일 수 있으므로 start_time 기반으로도 검색
            const futureThreshold = `${formData.date}T23:59:59+09:00`;

            let futureQuery = supabase
                .from('schedules')
                .select('id, date, start_time, status')
                .eq('center_id', centerId)
                .gt('start_time', futureThreshold)
                .neq('id', scheduleId); // 현재 일정 제외

            if (isRecurringGroup && groupId) {
                futureQuery = futureQuery.or(`id.eq.${groupId},parent_schedule_id.eq.${groupId}`);
            } else {
                futureQuery = futureQuery
                    .eq('child_id', formData.child_id)
                    .eq('therapist_id', formData.therapist_id);
                if (formData.program_id) {
                    futureQuery = futureQuery.eq('program_id', formData.program_id);
                }
            }

            const { data: allFuture, error: futureError } = await futureQuery;
            if (futureError) console.error('[TimeChange] query error:', futureError);

            // 예정(scheduled)된 것만 시간 변경 (완료/취소는 건드리지 않음)
            const futureSchedules = (allFuture || []).filter((s: any) =>
                !s.status || s.status === 'scheduled'
            );

            console.log('[TimeChange] found:', { total: allFuture?.length, scheduled: futureSchedules.length, futureError });

            if (futureSchedules.length > 0) {
                for (const fs of futureSchedules) {
                    // date 또는 start_time에서 날짜 추출
                    const fsDate = (fs as any).date || (fs.start_time ? fs.start_time.split('T')[0] : formData.date);
                    await supabase.from('schedules').update({
                        start_time: makeIsoString(fsDate, formData.start_time),
                        end_time: makeIsoString(fsDate, formData.end_time),
                    }).eq('id', fs.id);
                }
                alert(`이후 ${futureSchedules.length}개 수업의 시간도 함께 변경되었습니다.`);
            } else {
                alert('이후 예정된 수업이 없습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('이후 수업 시간 변경 중 오류가 발생했습니다.');
        } finally {
            setShowTimeChangeModal(false);
            setPendingTimeChange(null);
            setLoading(false);
            onSuccess();
        }
    };

    return (
        <>
            {/* ✨ 시간 변경 범위 선택 모달 */}
            {showTimeChangeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-5 border-b dark:border-slate-700">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">⏰ 수업 시간 변경</h3>
                            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                                    <span className="line-through">{originalTime.start_time} ~ {originalTime.end_time}</span>
                                    <span className="text-indigo-500">→</span>
                                    <span className="text-indigo-700 dark:text-indigo-300 font-black">{formData.start_time} ~ {formData.end_time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <button
                                onClick={() => { setShowTimeChangeModal(false); setPendingTimeChange(null); onSuccess(); }}
                                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                        <CalendarClock className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 dark:text-white text-sm">이 수업만 변경</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">오늘 이 수업만 시간이 바뀝니다</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={handleApplyFutureTimeChange}
                                disabled={loading}
                                className="w-full p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-400 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                                        <Repeat className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-indigo-700 dark:text-indigo-300 text-sm">이후 수업도 전부 변경</p>
                                        <p className="text-xs text-indigo-400 font-medium mt-0.5">앞으로 예정된 같은 수업 전체에 적용</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">{readOnly ? '일정 상세' : scheduleId ? '일정 수정' : '새 일정 등록'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
                    </div>
                    {fetching ? (
                        <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
                            <p className="text-xs text-slate-400 font-bold">데이터 불러오는 중...</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <form onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit} className="p-4 md:p-6 pb-4">
                                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                    {/* 왼쪽: 일정 정보 */}
                                    <fieldset disabled={readOnly} className={cn("flex-1 space-y-4 md:space-y-5 min-w-0", readOnly && 'opacity-70 pointer-events-none')}>
                                        <SearchableSelect
                                            label="아동 선택"
                                            placeholder="아동을 선택하세요"
                                            options={childrenList}
                                            value={formData.child_id}
                                            onChange={val => setFormData({ ...formData, child_id: val })}
                                        />
                                        <SearchableSelect
                                            label="담당 선생님"
                                            placeholder="선생님을 선택하세요"
                                            options={therapistsList}
                                            value={formData.therapist_id}
                                            onChange={val => setFormData({ ...formData, therapist_id: val })}
                                        />
                                        <SearchableSelect
                                            label="치료 프로그램"
                                            placeholder="프로그램을 선택하세요"
                                            options={programsList.map(p => ({ id: p.id, name: `${p.name} (${p.duration}분)` }))}
                                            value={formData.program_id}
                                            onChange={val => handleProgramChange(val)}
                                        />
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">날짜</label>
                                            <input type="date" required className="w-full p-3 border dark:border-slate-700 rounded-xl font-bold mb-3 md:mb-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none dark:[color-scheme:dark]" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />

                                            <div className="flex items-start gap-3 mb-3">
                                                <TimeComboBox
                                                    label="시작시간"
                                                    value={formData.start_time}
                                                    onChange={handleStartTimeChange}
                                                />
                                                <TimeComboBox
                                                    label="종료시간"
                                                    value={formData.end_time}
                                                    onChange={(v: string) => setFormData(prev => ({ ...prev, end_time: v }))}
                                                />
                                            </div>

                                            {!scheduleId && (
                                                <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Repeat className={cn("w-4 h-4", isRecurring ? "text-indigo-600" : "text-slate-400")} />
                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">매주 반복 등록</span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                                                            checked={isRecurring}
                                                            onChange={e => setIsRecurring(e.target.checked)}
                                                        />
                                                    </div>
                                                    {isRecurring && (
                                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg">
                                                            <Repeat className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                                선택한 요일에 6개월간({RECURRING_WEEKS}주) 자동 반복 등록됩니다.
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['scheduled', 'completed', 'cancelled', 'carried_over'].map(s => (
                                                <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })} className={`py-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${formData.status === s ? getStatusStyle(s).activeClass : 'border-transparent text-slate-400 hover:bg-slate-50'}`}>
                                                    {getStatusStyle(s).icon}<span className="text-[10px] font-bold">{getStatusStyle(s).label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>

                                    {/* 오른쪽: 메모 (모바일에서는 하단) */}
                                    <div className="w-full md:w-64 md:shrink-0 flex flex-col">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            메모
                                        </label>
                                        <textarea
                                            disabled={readOnly}
                                            className={cn(
                                                "flex-1 min-h-[120px] md:min-h-[320px] p-3.5 border dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed",
                                                readOnly && "opacity-70 cursor-not-allowed"
                                            )}
                                            placeholder="수업 관련 메모, 주의사항, 특이사항 등을 기록하세요..."
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                        {formData.notes && (
                                            <p className="text-[10px] text-slate-400 mt-1.5 text-right">{formData.notes.length}자</p>
                                        )}
                                    </div>
                                </div>

                                {/* 하단 버튼 */}
                                <div className="flex gap-2 pt-4 md:pt-5 mt-4 md:mt-5 border-t dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                                    {readOnly ? (
                                        <button type="button" onClick={onClose} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600">
                                            닫기
                                        </button>
                                    ) : (
                                        <>
                                            {scheduleId && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(false)}
                                                        className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50"
                                                        title="이 일정만 삭제"
                                                    >
                                                        <Trash2 className="w-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(true)}
                                                        className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 flex items-center gap-2 text-xs font-black"
                                                        title="이후 모든 일정 삭제"
                                                    >
                                                        <CalendarClock className="w-5" /> 이후 삭제
                                                    </button>
                                                </>
                                            )}
                                            <button type="submit" disabled={loading} className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-md">
                                                {loading ? <Loader2 className="animate-spin w-5" /> : <Save className="w-5" />} {scheduleId ? '수정 저장' : '일정 등록'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}