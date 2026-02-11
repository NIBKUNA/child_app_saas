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
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import {
    X, Loader2, Save, Trash2,
    CheckCircle2, XCircle, ArrowRightCircle, CalendarClock, Repeat, Search, ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { isSuperAdmin } from '@/config/superAdmin';

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
}

export function ScheduleModal({ isOpen, onClose, scheduleId, initialDate, onSuccess }: ScheduleModalProps) {
    const { center } = useCenter();
    const centerId = center?.id;
    const { role, therapistId: authTherapistId } = useAuth(); // ✨ Role & Therapist ID

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [childrenList, setChildrenList] = useState<any[]>([]);
    const [programsList, setProgramsList] = useState<any[]>([]);
    const [therapistsList, setTherapistsList] = useState<any[]>([]);


    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatWeeks, setRepeatWeeks] = useState(4);

    const [formData, setFormData] = useState({
        child_id: '',
        program_id: '',
        therapist_id: '',
        date: '',
        start_time: '10:00',
        end_time: '10:40',
        status: 'scheduled',
        service_type: 'therapy'
    });

    // ✨ [ScheduleModal] Initialization
    useEffect(() => {
        if (isOpen && centerId && centerId.length >= 32) {
            loadInitialData(centerId);
            setIsRecurring(false);
            setRepeatWeeks(4);
        }
    }, [isOpen, scheduleId, initialDate, centerId]);

    const loadInitialData = async (targetId: string) => {
        if (!targetId || targetId.length < 32) return;

        setFetching(true);
        try {
            const [childRes, progRes, therRes, profileRes] = await Promise.all([
                supabase.from('children').select('*').eq('center_id', targetId).order('name'),
                supabase.from('programs').select('*').eq('center_id', targetId).order('name'),
                supabase.from('therapists').select('*').eq('center_id', targetId).order('name'),
                supabase.from('user_profiles').select('*')
            ]);

            setChildrenList(childRes.data || []);
            setProgramsList(progRes.data || []);

            // ✨ [Filter] 슈퍼 어드민 제외 및 권한별 치료사 목록 필터링
            const profiles = profileRes.data || [];
            const rawTherapists = therRes.data || [];

            let filteredTherapists = rawTherapists.filter((t: { email: string; profile_id?: string; id: string }) => {
                if (isSuperAdmin(t.email)) return false;
                if (t.profile_id) {
                    const profile = profiles.find((p: { id: string; role?: string }) => p.id === t.profile_id);
                    if (profile?.role === 'super_admin') return false;
                }
                return true;
            });

            // ✨ [권한 분리] 치료사는 본인만 선택 가능하도록 제한
            if (role === 'therapist' && authTherapistId) {
                filteredTherapists = filteredTherapists.filter((t: { id: string }) => t.id === authTherapistId);
            }

            setTherapistsList(filteredTherapists);

            if (scheduleId) {
                // ✨ [성능 개선] 부모로부터 데이터가 넘어왔다면 DB 조회 스킵
                if (initialDate && typeof initialDate === 'object' && initialDate.child_id) {
                    const data = initialDate;
                    let sTime = data.start_time;
                    if (sTime && sTime.includes('T')) sTime = sTime.split('T')[1].slice(0, 5);

                    let eTime = data.end_time;
                    if (eTime && eTime.includes('T')) eTime = eTime.split('T')[1].slice(0, 5);

                    setFormData({
                        child_id: data.child_id,
                        program_id: data.program_id,
                        therapist_id: data.therapist_id,
                        date: data.date || (data.start_time ? data.start_time.split('T')[0] : ''),
                        start_time: sTime || '10:00',
                        end_time: eTime || '10:40',
                        status: data.status,
                        service_type: data.service_type || 'therapy'
                    });
                } else {
                    const { data } = await supabase.from('schedules').select('*').eq('id', scheduleId).single();
                    if (data) {
                        let sTime = data.start_time;
                        if (sTime && sTime.includes('T')) sTime = sTime.split('T')[1].slice(0, 5);

                        let eTime = data.end_time;
                        if (eTime && eTime.includes('T')) eTime = eTime.split('T')[1].slice(0, 5);

                        setFormData({
                            child_id: data.child_id,
                            program_id: data.program_id,
                            therapist_id: data.therapist_id,
                            date: data.date || (data.start_time ? data.start_time.split('T')[0] : ''),
                            start_time: sTime || '10:00',
                            end_time: eTime || '10:40',
                            status: data.status,
                            service_type: data.service_type || 'therapy'
                        });
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
                    therapist_id: (role === 'therapist' && authTherapistId) ? authTherapistId : (therRes.data?.[0]?.id || ''),
                    date: `${year}-${month}-${day}`,
                    start_time: timeStr === '00:00' ? '10:00' : timeStr,
                    end_time: timeStr === '00:00' ? '10:40' : calculateEndTime(timeStr, 40),
                    status: 'scheduled',
                    service_type: 'therapy'
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

            const basePayload = {
                center_id: centerId,
                child_id: formData.child_id || null,
                program_id: formData.program_id || null,
                therapist_id: formData.therapist_id || null,
                status: formData.status as any,
                service_type: formData.service_type
            };

            // ✨ [핵심 수정] 타임존 계산 없이 문자열 결합 ("2026-01-07" + "T" + "10:00" + ":00")
            const makeIsoString = (date: string, time: string) => `${date}T${time}:00`;

            if (!scheduleId && isRecurring && repeatWeeks > 1) {
                const schedulesToInsert = [];
                const [y, m, d] = formData.date.split('-').map(Number);
                for (let i = 0; i < repeatWeeks; i++) {
                    const nextDate = new Date(y, m - 1, d + (i * 7));
                    const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
                    schedulesToInsert.push({
                        ...basePayload,
                        date: nextDateStr,
                        start_time: makeIsoString(nextDateStr, formData.start_time),
                        end_time: makeIsoString(nextDateStr, formData.end_time)
                    });
                }
                const { data: _insertedData, error } = await supabase.from('schedules').insert(schedulesToInsert).select();
                if (error) throw error;

                // ✨ [Notification] 치료사에게 알림 생성
                const targetTherapist = therapistsList.find(t => t.id === formData.therapist_id);
                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (targetTherapist?.profile_id && targetTherapist.profile_id !== currentUser?.id) {
                    await supabase.from('admin_notifications').insert([{
                        user_id: targetTherapist.profile_id,
                        type: 'schedule',
                        title: '🚀 새로운 일정 등록',
                        message: `${formData.date}부터 시작되는 ${repeatWeeks}주 반복 일정이 등록되었습니다.`,
                        is_read: false
                    }]);
                }

                alert(`${repeatWeeks}주 반복 일정이 등록되었습니다.`);
            } else {
                const payload = {
                    ...basePayload,
                    date: formData.date,
                    start_time: makeIsoString(formData.date, formData.start_time),
                    end_time: makeIsoString(formData.date, formData.end_time)
                };

                if (scheduleId) {
                    // ⭐ [이월 크레딧 연동] 상태 변경 시 크레딧 자동 처리
                    const { data: prevSchedule } = await supabase
                        .from('schedules')
                        .select('status, program_id, child_id')
                        .eq('id', scheduleId)
                        .single();

                    await supabase.from('schedules').update(payload).eq('id', scheduleId);

                    // 이전 상태와 새 상태 비교
                    const prevStatus = prevSchedule?.status as string;
                    if (prevSchedule && prevStatus !== formData.status) {
                        const programPrice = programsList.find(p => p.id === (prevSchedule.program_id || formData.program_id))?.price || 0;
                        const childId = prevSchedule.child_id || formData.child_id;

                        if (programPrice > 0 && childId) {
                            // 새로 이월된 경우 → 크레딧 적립
                            if (formData.status === 'carried_over' && prevStatus !== 'carried_over') {
                                const { data: child } = await supabase.from('children').select('credit').eq('id', childId).single();
                                const newCredit = (child?.credit || 0) + programPrice;
                                await supabase.from('children').update({ credit: newCredit }).eq('id', childId);
                            }
                            // 이월에서 다른 상태로 변경 → 크레딧 차감
                            else if (prevStatus === 'carried_over' && formData.status !== 'carried_over') {
                                const { data: child } = await supabase.from('children').select('credit').eq('id', childId).single();
                                const newCredit = Math.max(0, (child?.credit || 0) - programPrice);
                                await supabase.from('children').update({ credit: newCredit }).eq('id', childId);
                            }
                        }
                    }
                } else {
                    const { data: _inserted, error } = await supabase.from('schedules').insert([payload]).select().single();
                    if (error) throw error;

                    // ✨ [Notification] 치료사에게 알림 생성
                    const targetTherapist = therapistsList.find(t => t.id === formData.therapist_id);
                    const { data: { user: currentUser } } = await supabase.auth.getUser();

                    if (targetTherapist?.profile_id && targetTherapist.profile_id !== currentUser?.id) {
                        await supabase.from('admin_notifications').insert([{
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
            // ✨ [Request #1] 뒷일정 삭제 기능 포함 확인창
            let deleteFuture = forceFuture;

            // 결제 여부 확인 (Ghost Credit 방지)
            const { data: payItems } = await supabase.from('payment_items').select('id, payment_id').eq('schedule_id', scheduleId);

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
                let query = supabase
                    .from('schedules')
                    .select('id')
                    .eq('child_id', formData.child_id)
                    .eq('program_id', formData.program_id)
                    .gte('date', formData.date);

                // ✨ [Fix] therapist_id가 null이거나 비어있는 경우(치료사 정보가 삭제된 경우) 대응
                if (formData.therapist_id) {
                    query = query.eq('therapist_id', formData.therapist_id);
                } else {
                    query = query.is('therapist_id', null);
                }

                const { data: futureSchedules } = await query;

                if (futureSchedules && futureSchedules.length > 0) {
                    const ids = futureSchedules.map((s: any) => s.id);

                    // ✨ [핵심 수정] 하위 참조 데이터(development_assessments) 삭제를 위해 일지 ID 먼저 확보
                    const { data: logs } = await supabase
                        .from('counseling_logs')
                        .select('id')
                        .in('schedule_id', ids);

                    if (logs && logs.length > 0) {
                        const logIds = logs.map((l: any) => l.id);
                        await supabase.from('development_assessments').delete().in('log_id', logIds);
                    }

                    // 참조 데이터 일괄 삭제
                    await supabase.from('consultations').delete().in('schedule_id', ids);
                    await supabase.from('payment_items').delete().in('schedule_id', ids);
                    await supabase.from('counseling_logs').delete().in('schedule_id', ids);

                    // 본 일정 일괄 삭제
                    const { error } = await supabase.from('schedules').delete().in('id', ids);
                    if (error) throw error;
                    alert('해당 일자 이후의 모든 관련 일정이 삭제되었습니다.');
                }
            } else {
                // 기존 단일 삭제 로직
                // ✨ [핵심 수정] 하위 참조 데이터 먼저 삭제
                const { data: logs } = await supabase
                    .from('counseling_logs')
                    .select('id')
                    .eq('schedule_id', scheduleId);

                if (logs && logs.length > 0) {
                    const logIds = logs.map((l: any) => l.id);
                    await supabase.from('development_assessments').delete().in('log_id', logIds);
                }

                // 1. 참조 데이터 수동 삭제
                await supabase.from('consultations').delete().eq('schedule_id', scheduleId);
                await supabase.from('payment_items').delete().eq('schedule_id', scheduleId);
                await supabase.from('counseling_logs').delete().eq('schedule_id', scheduleId);

                // 2. 본 일정 삭제
                const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
                if (error) throw error;
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
        const eTime = p ? calculateEndTime(sTime, p.duration) : formData.end_time;
        setFormData(prev => ({ ...prev, start_time: sTime, end_time: eTime }));
    };

    const getStatusStyle = (s: string) => {
        if (s === 'completed') return { icon: <CheckCircle2 className="w-4" />, label: '완료', activeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        if (s === 'cancelled') return { icon: <XCircle className="w-4" />, label: '취소', activeClass: 'bg-rose-50 text-rose-600 border-rose-200' };
        if (s === 'carried_over') return { icon: <ArrowRightCircle className="w-4" />, label: '이월', activeClass: 'bg-purple-50 text-purple-600 border-purple-200' };
        return { icon: <CalendarClock className="w-4" />, label: '예정', activeClass: 'bg-blue-50 text-blue-600 border-blue-200' };
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">{scheduleId ? '일정 수정' : '새 일정 등록'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
                </div>
                {fetching ? (
                    <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
                        <p className="text-xs text-slate-400 font-bold">데이터 불러오는 중...</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 pb-32">
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
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">프로그램</label>
                                <select required className="w-full p-3 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.program_id} onChange={e => handleProgramChange(e.target.value)}>
                                    <option value="">프로그램을 선택하세요</option>
                                    {programsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">일시</label>
                                <input type="date" required className="w-full p-3 border dark:border-slate-700 rounded-xl font-bold mb-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none dark:[color-scheme:dark]" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                <div className="flex gap-2 mb-3">
                                    <input type="time" required className="flex-1 p-3 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none dark:[color-scheme:dark]" value={formData.start_time} onChange={e => handleStartTimeChange(e.target.value)} />
                                    <span className="self-center text-slate-400">~</span>
                                    <input type="time" required className="flex-1 p-3 border dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none dark:[color-scheme:dark]" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                                </div>

                                {!scheduleId && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
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
                                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                                <input
                                                    type="number"
                                                    min="2"
                                                    max="52"
                                                    className="w-20 p-2 border dark:border-slate-600 rounded-lg text-sm font-bold bg-white dark:bg-slate-900"
                                                    value={repeatWeeks}
                                                    onChange={e => setRepeatWeeks(parseInt(e.target.value) || 0)}
                                                />
                                                <span className="text-xs font-bold text-slate-500">주 동안 반복 등록합니다.</span>
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
                            <div className="flex gap-2 pt-4">
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
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}