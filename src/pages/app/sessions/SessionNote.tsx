import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export default function SessionNote() {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Session Info
    const [sessionInfo, setSessionInfo] = useState<any>(null);

    // Note Fields
    // const [mood, setMood] = useState('good');
    const [activities, setActivities] = useState('');
    const [childResponse, setChildResponse] = useState('');
    const [nextPlan, setNextPlan] = useState('');

    // Existing Note ID if updating
    const [noteId, setNoteId] = useState<string | null>(null);

    useEffect(() => {
        if (scheduleId) {
            fetchSessionData(scheduleId);
        }
    }, [scheduleId]);

    const fetchSessionData = async (id: string) => {
        setLoading(true);
        // 1. Fetch Schedule Info
        const { data: schedule, error: startError } = await (supabase
            .from('schedules') as any)
            .select(`
                *,
                children ( name, birth_date ),
                therapists ( name )
            `)
            .eq('id', id)
            .single();

        if (startError || !schedule) {
            alert('일정을 찾을 수 없습니다.');
            navigate('/app/sessions');
            return;
        }

        setSessionInfo(schedule);

        // 2. Fetch Existing Note if any
        const { data: note } = await (supabase
            .from('counseling_logs') as any)
            .select('*')
            .eq('schedule_id', id)
            .single();

        if (note) {
            setNoteId(note.id);
            // setMood(note.mood || 'good');
            // Using textarea fields
            setActivities(note.activities || '');
            setChildResponse(note.child_response || '');
            setNextPlan(note.next_plan || '');
        }

        setLoading(false);
    };

    const handleSave = async () => {
        if (!sessionInfo) return;
        setSaving(true);

        const payload = {
            schedule_id: sessionInfo.id,
            child_id: sessionInfo.child_id,
            therapist_id: sessionInfo.therapist_id,
            session_date: sessionInfo.start_time.slice(0, 10), // Record the session date
            // mood, 
            activities,
            child_response: childResponse,
            next_plan: nextPlan
        };

        let result;
        if (noteId) {
            // Update
            result = await (supabase.from('counseling_logs') as any).update(payload).eq('id', noteId);
        } else {
            // Insert
            result = await (supabase.from('counseling_logs') as any).insert([payload]);
        }

        if (result.error) {
            alert('저장 실패: ' + result.error.message);
            setSaving(false);
            return;
        }

        // Update Schedule Status to completed
        await (supabase.from('schedules') as any).update({ status: 'completed' }).eq('id', sessionInfo.id);

        setSaving(false);
        alert('저장되었습니다.');
        navigate('/app/sessions');
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
                <h1 className="text-2xl font-bold tracking-tight">상담 일지 작성</h1>
            </div>

            {/* Session Info Card */}
            <div className="bg-slate-50 p-4 rounded-lg border flex justify-between items-center text-sm">
                <div>
                    <span className="font-bold text-lg mr-2">{sessionInfo?.children?.name}</span>
                    <span className="text-slate-500">({sessionInfo?.service_type})</span>
                </div>
                <div className="text-right">
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

                <div className="pt-4 border-t flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary text-white rounded-md font-medium text-sm hover:bg-primary/90 flex items-center shadow-sm"
                    >
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        일지 저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
