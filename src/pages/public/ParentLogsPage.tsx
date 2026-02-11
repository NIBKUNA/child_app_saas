import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    ChevronLeft, MessageSquare,
    User, ChevronRight, X
} from 'lucide-react';

import { useCenter } from '@/contexts/CenterContext';

interface Log {
    id: string;
    session_date: string;
    content: string;
    therapists?: { name: string };
    evaluation_date?: string;
    summary?: string;
    [key: string]: unknown; // Safe fallback for other props
}

interface Observation {
    id: string;
    created_at: string | null;
    content: string;
    child_id?: string | null;
}

export function ParentLogsPage() {
    const navigate = useNavigate();
    const { center } = useCenter();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [parentObservations, setParentObservations] = useState<Observation[]>([]);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [center]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            let targetChildId: string | null = null;
            const { data: parentRecord } = await supabase
                .from('parents')
                .select('id')
                .eq('profile_id', user.id)
                .maybeSingle();

            if (parentRecord) {
                const { data: directChild } = await supabase
                    .from('children')
                    .select('id')
                    .eq('parent_id', parentRecord.id)
                    .maybeSingle();
                targetChildId = directChild?.id || null;
            }

            if (!targetChildId) {
                const { data: rel } = await supabase
                    .from('family_relationships')
                    .select('child_id')
                    .eq('parent_id', user.id)
                    .maybeSingle();
                targetChildId = rel?.child_id || null;
            }

            if (!targetChildId) {
                setLoading(false);
                return;
            }

            let query = supabase
                .from('development_assessments')
                .select(`
                    *,
                    therapists:therapist_id (name, id),
                    children!inner (id, name, center_id)
                `)
            query = query
                .eq('child_id', targetChildId)
                .not('summary', 'eq', '부모님 자가진단 기록')
                .order('evaluation_date', { ascending: false });

            const userRole = profile?.role;
            if (userRole === 'admin' || userRole === 'super_admin') {
                if (center?.id) {
                    query = query.eq('children.center_id', center.id);
                }
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const formattedLogs: Log[] = (data || []).map((assessment: Record<string, unknown>) => ({
                ...assessment,
                id: assessment.id as string,
                session_date: assessment.evaluation_date as string,
                content: assessment.summary as string,
                therapists: assessment.therapists as { name: string } | undefined,
            }));

            setLogs(formattedLogs || []);

            if (targetChildId) {
                const { data: observations } = await supabase
                    .from('parent_observations')
                    .select('*')
                    .eq('child_id', targetChildId)
                    .order('created_at', { ascending: false })
                    .limit(10);
                setParentObservations(observations || []);
            }

        } catch (e) {
            console.error("Logs fetch error:", e);
        } finally {
            setLoading(false);
        }
    };


    // 월별 그룹화
    const groupedLogs = logs.reduce((acc: Record<string, Log[]>, log) => {
        const month = new Date(log.session_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(log);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black animate-pulse">아이의 성장을 정리 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-32 font-sans overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex justify-between items-center shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                    <ChevronLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h1 className="text-lg font-black text-slate-900 tracking-tight text-center flex-1">성장 기록 갤러리</h1>
                <div className="w-10"></div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-12">
                {Object.keys(groupedLogs).length > 0 ? (
                    Object.entries(groupedLogs).map(([month, monthLogs]: [string, Log[]]) => (
                        <section key={month} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black text-slate-900 whitespace-nowrap">{month}</h2>
                                <div className="h-px flex-1 bg-slate-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {monthLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="group bg-white rounded-[40px] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700"></div>

                                        <div className="relative z-10 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[11px] font-black">
                                                    {new Date(log.session_date).toLocaleDateString('ko-KR', { day: 'numeric', weekday: 'short' })}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{log.therapists?.name} 선생님</span>
                                            </div>

                                            <h3 className="text-slate-900 font-black text-lg line-clamp-1 group-hover:text-primary transition-colors pr-4">
                                                {log.content || "기록된 일지가 없습니다."}
                                            </h3>

                                            <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 italic opacity-80">
                                                {log.content ? `"${log.content.slice(0, 60)}..."` : '터치하여 상세 내용을 확인하세요.'}
                                            </p>

                                            <div className="pt-2 flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-tighter">
                                                자세히 보기 <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-4xl">🌱</div>
                        <p className="text-slate-400 font-black text-lg">아직 기록된 성장의 순간이 없습니다.</p>
                    </div>
                )}

                {/* 내가 쓴 관찰 일기 섹션 */}
                {parentObservations.length > 0 && (
                    <section className="pt-12 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl">📝</div>
                            <h2 className="text-xl font-black text-slate-900">우리 아이 관찰 노트</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {parentObservations.map((obs) => (
                                <div key={obs.id} className="bg-amber-50/30 p-6 rounded-[32px] border border-amber-100/30">
                                    <p className="text-[10px] font-black text-amber-400 mb-3 tracking-widest uppercase">
                                        {new Date(obs.created_at || '').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed">"{obs.content}"</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* --- 상세 로그 & 인터랙티브 발달 리포트 모달 --- */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 md:p-6 animate-in fade-in duration-300">
                    <div
                        className="bg-white w-full max-w-2xl h-[92vh] md:h-auto md:max-h-[85vh] rounded-t-[48px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500"
                    >
                        {/* Modal Header */}
                        <div className="px-8 py-7 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedLog.session_date} 수업 리포트</h2>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> {selectedLog.therapists?.name} 선생님의 전문 기록
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all active:scale-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                            {/* 1. 상담 일지 */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-[0.2em]">
                                    <MessageSquare className="w-4 h-4" /> 회기 요약 일지
                                </div>
                                <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10">
                                    <p className="text-slate-800 font-bold leading-relaxed text-[17px] whitespace-pre-wrap tracking-tight">
                                        {selectedLog.content || '작성된 내용이 없습니다.'}
                                    </p>
                                </div>
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-white border-t border-slate-50 shrink-0">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm active:scale-95 transition-all shadow-xl hover:bg-black"
                            >
                                리포트 확인 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
