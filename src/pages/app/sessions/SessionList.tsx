import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { Loader2, FileText, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Schedule = Database['public']['Tables']['schedules']['Row'] & {
    children: { name: string } | null;
    therapists: { name: string } | null;
};

export default function SessionList() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Schedule[]>([]);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);

        // 1. Auto-Complete Logic
        const now = new Date().toISOString();
        const { data: pastSessions } = await supabase
            .from('schedules')
            .select('id')
            .eq('status', 'scheduled')
            .lt('end_time', now);

        if (pastSessions && pastSessions.length > 0) {
            const idsToUpdate = pastSessions.map(s => s.id);
            await supabase
                .from('schedules')
                .update({ status: 'completed' })
                .in('id', idsToUpdate);

            console.log(`Auto-completed ${idsToUpdate.length} sessions.`);
        }

        // 2. Fetch all sessions
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                children ( name ),
                therapists ( name )
            `)
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Error fetching sessions:', error);
        } else {
            setSessions(data || []);
        }
        setLoading(false);
    };

    const handleWriteNote = (scheduleId: string) => {
        navigate(`/app/sessions/${scheduleId}/note`);
    };

    const handleDelete = async (scheduleId: string) => {
        if (!window.confirm('정말 이 상담 일정을 삭제하시겠습니까?')) {
            return;
        }

        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', scheduleId);

        if (error) {
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        } else {
            fetchSessions();
        }
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'completed':
                return <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" /> 완료</span>;
            case 'cancelled':
                return <span className="flex items-center text-red-500 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium">취소됨</span>;
            case 'carried_over':
                return <span className="flex items-center text-orange-500 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium">이월됨</span>;
            case 'scheduled':
            default:
                return <span className="flex items-center text-slate-500"><Calendar className="w-4 h-4 mr-1" /> 예정</span>;
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">상담 일지 관리</h1>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-slate-50 font-medium grid grid-cols-12 gap-4 text-sm text-slate-500">
                    <div className="col-span-2">날짜</div>
                    <div className="col-span-2">시간</div>
                    <div className="col-span-2">아동</div>
                    <div className="col-span-2">유형</div>
                    <div className="col-span-2">상태</div>
                    <div className="col-span-2 text-center">관리</div>
                </div>

                <div className="divide-y">
                    {sessions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            상담 내역이 없습니다.
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="p-4 grid grid-cols-12 gap-4 items-center text-sm hover:bg-slate-50 transition-colors">
                                <div className="col-span-2 font-medium text-slate-900">
                                    {new Date(session.start_time).toLocaleDateString()}
                                </div>
                                <div className="col-span-2">
                                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="col-span-2">
                                    {session.children?.name || '-'}
                                </div>
                                <div className="col-span-2">
                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">
                                        {session.service_type}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    {getStatusBadge(session.status)}
                                </div>
                                <div className="col-span-2 flex justify-center items-center gap-2">
                                    {session.status === 'completed' ? (
                                        <button
                                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                            onClick={() => handleWriteNote(session.id)}
                                        >
                                            수정하기
                                        </button>
                                    ) : session.status === 'cancelled' || session.status === 'carried_over' ? (
                                        <span className="text-xs text-slate-400">-</span>
                                    ) : (
                                        <button
                                            className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 flex items-center"
                                            onClick={() => handleWriteNote(session.id)}
                                        >
                                            <FileText className="w-3 h-3 mr-1" />
                                            일지작성
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(session.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
