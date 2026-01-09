// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    X, Loader2, Save, Trash2, Calendar, Clock, User,
    CheckCircle2, XCircle, ArrowRightCircle, CalendarClock, Repeat
} from 'lucide-react';

export function ScheduleModal({ isOpen, onClose, scheduleId, initialDate, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [childrenList, setChildrenList] = useState([]);
    const [programsList, setProgramsList] = useState([]);
    const [therapistsList, setTherapistsList] = useState([]);
    const [childCreditMap, setChildCreditMap] = useState({});

    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatWeeks, setRepeatWeeks] = useState(4);

    const [formData, setFormData] = useState({
        child_id: '',
        program_id: '',
        therapist_id: '',
        date: '',
        start_time: '10:00',
        end_time: '10:40',
        status: 'scheduled'
    });

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            setIsRecurring(false);
            setRepeatWeeks(4);
        }
    }, [isOpen, scheduleId, initialDate]);

    const loadInitialData = async () => {
        setFetching(true);
        try {
            const [childRes, progRes, therRes] = await Promise.all([
                supabase.from('children').select('id, name, credit, guardian_name, contact').order('name'),
                supabase.from('programs').select('id, name, duration, price').order('name'),
                supabase.from('therapists').select('id, name').order('name')
            ]);

            setChildrenList(childRes.data || []);
            setProgramsList(progRes.data || []);
            setTherapistsList(therRes.data || []);

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
                        status: data.status
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
                            status: data.status
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
                    therapist_id: therRes.data?.[0]?.id || '',
                    date: `${year}-${month}-${day}`,
                    start_time: timeStr === '00:00' ? '10:00' : timeStr,
                    end_time: timeStr === '00:00' ? '10:40' : calculateEndTime(timeStr, 40),
                    status: 'scheduled'
                });
            }
        } finally {
            setFetching(false);
        }
    };

    const calculateEndTime = (start, duration) => {
        const [h, m] = start.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + duration);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: center } = await supabase.from('centers').select('id').limit(1).single();
            const basePayload = {
                center_id: center?.id,
                child_id: formData.child_id,
                program_id: formData.program_id,
                therapist_id: formData.therapist_id,
                status: formData.status
            };

            // ✨ [핵심 수정] 타임존 계산 없이 문자열 결합 ("2026-01-07" + "T" + "10:00" + ":00")
            const makeIsoString = (date, time) => `${date}T${time}:00`;

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
                await supabase.from('schedules').insert(schedulesToInsert);
                alert(`${repeatWeeks}주 반복 일정이 등록되었습니다.`);
            } else {
                const payload = {
                    ...basePayload,
                    date: formData.date,
                    start_time: makeIsoString(formData.date, formData.start_time),
                    end_time: makeIsoString(formData.date, formData.end_time)
                };

                if (scheduleId) await supabase.from('schedules').update(payload).eq('id', scheduleId);
                else await supabase.from('schedules').insert([payload]);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('저장 실패');
        } finally {
            setLoading(false);
        }
    };

    // UI 및 기능 유지
    // UI 및 기능 유지
    const handleDelete = async () => {
        setLoading(true);
        try {
            // 0. 결제 여부 확인 (Ghost Credit 방지)
            const { data: payItems } = await supabase.from('payment_items').select('id, payment_id').eq('schedule_id', scheduleId);

            if (payItems && payItems.length > 0) {
                // 이미 결제된 건이 존재하는 경우 경고
                if (!confirm(
                    '⚠️ 경고: 이 일정은 이미 수납(결제) 처리가 되었습니다.\n\n' +
                    '일정을 삭제하면 결제 내역은 남지만, 연결된 수업이 사라져 "잔액(Credit)"으로 잡히게 됩니다.\n' +
                    '(-110,000원과 같은 과납 상태가 될 수 있습니다.)\n\n' +
                    '정말 삭제하시겠습니까? (삭제 후 수납 관리에서 별도 정산이 필요합니다.)'
                )) {
                    setLoading(false);
                    return;
                }
            } else {
                // 결제 내역이 없더라도 일반 삭제 확인
                if (!confirm('정말 삭제하시겠습니까? \n(관련된 상담일지, 알림장이 함께 삭제됩니다.)')) {
                    setLoading(false);
                    return;
                }
            }

            // 1. 참조 데이터 수동 삭제 (Foreign Key 제약 조건 해결)
            // 에러: violates foreign key constraint 'consultations_schedule_id_fkey'
            const { error: consultError } = await supabase.from('consultations').delete().eq('schedule_id', scheduleId);
            if (consultError) console.error('상담 신청서(consultations) 삭제 실패:', consultError);

            const { error: pError } = await supabase.from('payment_items').delete().eq('schedule_id', scheduleId);
            if (pError) console.error('수납 상세 삭제 실패:', pError);

            const { error: cError } = await supabase.from('counseling_logs').delete().eq('schedule_id', scheduleId);
            if (cError) console.error('상담일지 삭제 실패:', cError);

            const { error: dError } = await supabase.from('daily_notes').delete().eq('schedule_id', scheduleId);
            if (dError) console.error('알림장 삭제 실패:', dError);

            // 2. 본 일정 삭제
            const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
            if (error) throw error;

            onSuccess();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('일정 삭제 중 오류가 발생했습니다.\n' + error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleProgramChange = (pid) => {
        const p = programsList.find(x => x.id === pid);
        setFormData(prev => ({ ...prev, program_id: pid, end_time: p ? calculateEndTime(prev.start_time, p.duration) : prev.end_time }));
    };
    const getStatusStyle = (s) => {
        if (s === 'completed') return { icon: <CheckCircle2 className="w-4" />, label: '완료', activeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        if (s === 'cancelled') return { icon: <XCircle className="w-4" />, label: '취소', activeClass: 'bg-rose-50 text-rose-600 border-rose-200' };
        if (s === 'carried_over') return { icon: <ArrowRightCircle className="w-4" />, label: '이월', activeClass: 'bg-purple-50 text-purple-600 border-purple-200' };
        return { icon: <CalendarClock className="w-4" />, label: '예정', activeClass: 'bg-blue-50 text-blue-600 border-blue-200' };
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-black text-slate-800">{scheduleId ? '일정 수정' : '새 일정 등록'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                {fetching ? (
                    <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
                        <p className="text-xs text-slate-400 font-bold">데이터 불러오는 중...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500">아동 선택</label>
                            <select required className="w-full p-3 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.child_id} onChange={e => setFormData({ ...formData, child_id: e.target.value })}>
                                <option value="">아동을 선택하세요</option>
                                {childrenList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">담당 선생님</label>
                            <select required className="w-full p-3 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.therapist_id} onChange={e => setFormData({ ...formData, therapist_id: e.target.value })}>
                                <option value="">선생님을 선택하세요</option>
                                {therapistsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">프로그램</label>
                            <select required className="w-full p-3 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.program_id} onChange={e => handleProgramChange(e.target.value)}>
                                <option value="">프로그램을 선택하세요</option>
                                {programsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">일시</label>
                            <input type="date" required className="w-full p-3 border rounded-xl font-bold mb-2 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            <div className="flex gap-2">
                                <input type="time" required className="flex-1 p-3 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                                <span className="self-center text-slate-400">~</span>
                                <input type="time" required className="flex-1 p-3 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['scheduled', 'completed', 'cancelled', 'carried_over'].map(s => (
                                <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })} className={`py-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${formData.status === s ? getStatusStyle(s).activeClass : 'border-transparent text-slate-400 hover:bg-slate-50'}`}>
                                    {getStatusStyle(s).icon}<span className="text-[10px] font-bold">{getStatusStyle(s).label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-4">
                            {scheduleId && <button type="button" onClick={handleDelete} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100"><Trash2 className="w-5" /></button>}
                            <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 shadow-md">
                                {loading ? <Loader2 className="animate-spin w-5" /> : <Save className="w-5" />} {scheduleId ? '수정 저장' : '일정 등록'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}