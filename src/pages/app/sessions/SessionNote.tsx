/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 수업 일지 작성 - 발달 평가 연동 및 치료사 피드백 기능 추가
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Save, ClipboardCheck, MessageSquare } from 'lucide-react';
import { AssessmentFormModal } from '@/pages/app/children/AssessmentFormModal';

import { useCenter } from '@/contexts/CenterContext'; // ✨ Import

export default function SessionNote() {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const { center } = useCenter(); // ✨ Use Context
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Session Info
    const [sessionInfo, setSessionInfo] = useState<any>(null);

    // Note Fields
    const [activities, setActivities] = useState('');
    const [childResponse, setChildResponse] = useState('');
    const [nextPlan, setNextPlan] = useState('');
    // ✨ [NEW] Therapist Feedback for Parents (부모님 확인용)
    const [parentFeedback, setParentFeedback] = useState('');

    // Existing Note ID if updating
    const [noteId, setNoteId] = useState<string | null>(null);
    const [sessionDate, setSessionDate] = useState('');

    // ✨ [NEW] Assessment Modal State
    const [showAssessment, setShowAssessment] = useState(false);

    const fetchSessionData = async (id: string) => {
        setLoading(true);
        const centerId = center?.id;
        if (!centerId) {
            alert('센터 정보를 불러오는 중입니다.');
            return;
        }
        // 1. Fetch Schedule Info (Center-Scoped)
        const { data: schedule, error: startError } = await supabase
            .from('schedules')
            .select(`
                *,
                children ( id, name, birth_date ),
                therapists ( name )
            `)
            .eq('id', id)
            .eq('center_id', centerId) // 🔒 [Security] 센터 격리 필수
            .maybeSingle();

        if (startError || !schedule) {
            alert('일정을 찾을 수 없습니다.');
            navigate('/app/sessions');
            return;
        }

        setSessionInfo(schedule);
        // Default session date to schedule start time if not yet set
        setSessionDate(schedule.start_time.slice(0, 10));

        // 2. Fetch Existing Note if any
        const { data: note } = await supabase
            .from('counseling_logs')
            .select('*')
            .eq('schedule_id', id)
            .maybeSingle();

        if (note) {
            setNoteId(note.id);
            if (note.session_date) setSessionDate(note.session_date);
            setActivities(note.activities || '');
            setChildResponse(note.child_response || '');
            setNextPlan(note.next_plan || '');
            setParentFeedback(note.parent_feedback || '');
        }

        setLoading(false);
    };

    useEffect(() => {
        if (scheduleId) {
            fetchSessionData(scheduleId);
        }
    }, [scheduleId]);

    // ✨ [Refactor] Save Logic Separated from Navigation
    const saveSessionLog = async (silent = false) => {
        if (!sessionInfo) return null;
        setSaving(true);
        try {
            // ✨ [Safety] Ensure Therapist ID exists. If missing in schedule, find mine.
            let effectiveTherapistId = sessionInfo.therapist_id;

            if (!effectiveTherapistId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: myTherapist } = await supabase
                        .from('therapists')
                        .select('id')
                        .eq('profile_id', user.id)
                        .maybeSingle();

                    if (myTherapist) {
                        effectiveTherapistId = myTherapist.id;
                    }
                }
            }

            const payload = {
                center_id: center?.id, // ✨ Inject Center ID context
                schedule_id: sessionInfo.id,
                child_id: sessionInfo.child_id,
                therapist_id: effectiveTherapistId, // Validated ID
                session_date: sessionDate,
                activities,
                child_response: childResponse,
                next_plan: nextPlan,
                parent_feedback: parentFeedback
            };

            let result;
            let savedId = noteId;

            if (noteId) {
                result = await supabase.from('counseling_logs')
                    .update(payload)
                    .eq('id', noteId)
                    .select()
                    .single();
            } else {
                result = await supabase.from('counseling_logs')
                    .insert([payload])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            if (result.data) {
                savedId = result.data.id;
                setNoteId(savedId);
            }

            // Update Schedule Status to completed
            await supabase.from('schedules').update({ status: 'completed' }).eq('id', sessionInfo.id);

            if (!silent) alert('저장되었습니다.');
            return savedId;

        } catch (error: any) {
            console.error('Save Error:', error);
            alert('저장 실패: ' + error.message);
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndExit = async () => {
        const id = await saveSessionLog();
        if (id) navigate('/app/sessions');
    };

    // ✨ [State] Active Session Log ID for Modal (Bypasses stale state issues)
    const [activeLogId, setActiveLogId] = useState<string | null>(null);

    const handleAssessmentClick = async () => {
        // ✨ Auto-save if note doesn't exist yet
        if (!noteId) {
            if (confirm('발달 평가를 작성하려면 먼저 일지를 저장해야 합니다.\n저장 후 계속하시겠습니까?')) {
                const id = await saveSessionLog(true); // Silent alert, but we show confirm
                if (id) {
                    setActiveLogId(id); // Set explicit ID for modal
                    setShowAssessment(true);
                }
            }
        } else {
            setActiveLogId(noteId);
            setShowAssessment(true);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/sessions')} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">수업 일지 작성</h1>
            </div>

            {/* Session Info Card */}
            <div className="bg-slate-50 p-4 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center text-sm gap-2 md:gap-0">
                <div>
                    <span className="font-bold text-lg mr-2">{sessionInfo?.children?.name}</span>
                    <span className="text-slate-500">({sessionInfo?.service_type})</span>
                </div>
                <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0 mt-1 md:mt-0 border-slate-200">
                    <div className="font-medium">
                        {new Date(sessionInfo?.start_time).toLocaleDateString()}
                    </div>
                    <div className="text-slate-500">
                        {new Date(sessionInfo?.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~
                        {new Date(sessionInfo?.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">수업 일자 (Actual Session Date)</label>
                    <input
                        type="date"
                        className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">* 실제 수업을 진행한 날짜를 선택해주세요.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">진행 활동 (Activities)</label>
                    <textarea
                        className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="오늘 진행한 주요 활동 내용을 기록해주세요."
                        value={activities}
                        onChange={(e) => setActivities(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">아동 반응 (Child Response)</label>
                    <textarea
                        className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="활동에 대한 아동의 반응, 수행도, 특이사항 등을 기록해주세요."
                        value={childResponse}
                        onChange={(e) => setChildResponse(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">다음 계획 (Next Plan)</label>
                    <textarea
                        className="w-full min-h-[80px] rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="다음 회차에 진행할 활동이나 목표를 기록해주세요."
                        value={nextPlan}
                        onChange={(e) => setNextPlan(e.target.value)}
                    />
                </div>

                {/* ✨ [NEW] Therapist Feedback for Parents */}
                <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <label className="block text-sm font-medium text-slate-700">부모님께 전달 메시지</label>
                        <span className="text-xs text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">부모님 앱에서 확인</span>
                    </div>
                    <textarea
                        className="w-full min-h-[100px] rounded-md border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="부모님께 전달하고 싶은 수업 피드백, 관찰 내용, 가정에서의 연습 권장 사항 등을 작성해주세요. 이 내용은 부모님 앱에서 확인하실 수 있습니다."
                        value={parentFeedback}
                        onChange={(e) => setParentFeedback(e.target.value)}
                    />
                </div>

                {/* ✨ [NEW] Assessment Integration Button */}
                <div className="border-t pt-6">
                    <button
                        type="button"
                        onClick={handleAssessmentClick}
                        className="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                        <ClipboardCheck className="w-5 h-5" />
                        발달 평가 작성하기 (선택)
                    </button>
                    <p className="text-xs text-slate-400 mt-2 text-center">수업 완료 후 발달 평가를 바로 작성할 수 있습니다.</p>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button
                        onClick={handleSaveAndExit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary text-white rounded-md font-medium text-sm hover:bg-primary/90 flex items-center shadow-sm"
                    >
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        일지 저장하기
                    </button>
                </div>
            </div>

            {/* Assessment Modal */}
            {showAssessment && sessionInfo?.children?.id && (
                <AssessmentFormModal
                    isOpen={showAssessment}
                    childId={sessionInfo.children.id}
                    childName={sessionInfo.children.name}
                    logId={activeLogId || noteId} // ✨ Use explicit active ID first
                    onClose={() => setShowAssessment(false)}
                    onSuccess={() => {
                        setShowAssessment(false);
                        alert('발달 평가가 저장되었습니다.');
                    }}
                />
            )}
        </div>
    );
}
