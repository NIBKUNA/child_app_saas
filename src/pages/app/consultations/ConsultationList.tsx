// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Clock, CheckCircle2, MessageSquare, X, Save,
    MessageCircle, Baby, Brain, Activity, FileText, ShieldCheck, User,
    Pencil, Trash2
} from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

function ScoreSlider({ label, icon, value, onChange, color }: any) {
    return (
        <div className="p-5 bg-white rounded-3xl border border-slate-100 space-y-4 shadow-sm hover:border-primary/20 transition-all">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[11px] font-black text-slate-500">{icon} {label}</div>
                <div className="px-3 py-1 bg-slate-50 rounded-lg text-sm font-black text-slate-900">{value}점</div>
            </div>
            <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className={cn("w-full h-2 rounded-lg appearance-none bg-slate-100 cursor-pointer", color)} />
        </div>
    );
}

export function ConsultationList() {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState('therapist');
    const [todoChildren, setTodoChildren] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editingLogId, setEditingLogId] = useState(null);

    const [content, setContent] = useState('');
    const [developmentNote, setDevelopmentNote] = useState('');
    const [scores, setScores] = useState({ language: 50, social: 50, cognition: 50, motor: 50 });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).maybeSingle();
            const role = profile?.role || 'therapist';
            setUserRole(role);
            const isAdmin = role === 'admin';

            const { data: existingLogs } = await supabase.from('consultations').select('schedule_id');
            const writtenScheduleIds = new Set(existingLogs?.map(log => log.schedule_id).filter(id => id !== null));

            let sessionQuery = supabase
                .from('schedules')
                .select(`id, child_id, status, therapist_id, start_time, children (id, name), programs (name)`)
                .eq('status', 'completed');

            if (!isAdmin) sessionQuery = sessionQuery.eq('therapist_id', user.id);
            const { data: sessions } = await sessionQuery.order('start_time', { ascending: false });

            const pending = sessions?.filter(s => s.children && !writtenScheduleIds.has(s.id)) || [];
            setTodoChildren(pending);

            let logsQuery = supabase
                .from('consultations')
                .select('*, children(id, name)')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!isAdmin) logsQuery = logsQuery.eq('therapist_id', user.id);
            const { data: logs } = await logsQuery;
            setConsultations(logs || []);

        } catch (e) {
            console.error("데이터 로드 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (log) => {
        setEditingLogId(log.id);
        setContent(log.content);
        setDevelopmentNote(log.development_note || '');
        setScores({
            language: log.score_language || 50,
            social: log.score_social || 50,
            cognition: log.score_cognition || 50,
            motor: log.score_motor || 50
        });

        setSelectedSession({
            id: log.schedule_id,
            children: log.children,
            programs: { name: '상담 수정' }
        });

        setIsModalOpen(true);
    };

    const handleDelete = async (logId, scheduleId) => {
        if (!confirm("정말 이 상담일지를 삭제하시겠습니까?\n부모님 앱에서도 즉시 사라집니다.")) return;

        try {
            const { error } = await supabase.from('consultations').delete().eq('id', logId);
            if (error) throw error;

            if (scheduleId) {
                await supabase.from('schedules').update({ session_note: null }).eq('id', scheduleId);
            }

            alert("삭제되었습니다.");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const handleSave = async () => {
        if (!content) return alert("상담 내용을 입력해주세요.");

        try {
            const commonData = {
                content: content,
                development_note: developmentNote,
                score_language: scores.language,
                score_social: scores.social,
                score_cognition: scores.cognition,
                score_motor: scores.motor,
                domain_scores: {
                    "언어발달": scores.language,
                    "사회성": scores.social,
                    "인지이해": scores.cognition,
                    "대/소근육": scores.motor
                }
            };

            if (editingLogId) {
                // ✨ [수정 해결] updated_at 컬럼을 제거하여 에러 방지
                const { error } = await supabase
                    .from('consultations')
                    .update(commonData)
                    .eq('id', editingLogId);

                if (error) throw error;
                alert("일지가 수정되었습니다.");
            } else {
                const { error } = await supabase.from('consultations').insert({
                    ...commonData,
                    child_id: selectedSession.children.id,
                    schedule_id: selectedSession.id,
                    therapist_id: user.id,
                    created_at: new Date().toISOString(),
                });

                if (error) throw error;
                alert("일지가 저장되었습니다.");
            }

            if (selectedSession?.id) {
                await supabase
                    .from('schedules')
                    .update({ session_note: content })
                    .eq('id', selectedSession.id);
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (e) {
            alert("저장 실패: " + e.message);
        }
    };

    const resetForm = () => {
        setContent('');
        setDevelopmentNote('');
        setScores({ language: 50, social: 50, cognition: 50, motor: 50 });
        setSelectedSession(null);
        setEditingLogId(null);
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse">데이터 동기화 중...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 selection:bg-primary/10">
            <header className="flex justify-between items-end bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">상담일지 및 발달 관리</h1>
                    <p className="text-slate-500 font-bold mt-3 text-sm">
                        {userRole === 'admin' ? '센터 전체 일지 작성 현황을 실시간으로 확인합니다.' : '수업 완료 후 24시간 이내에 일지를 작성해 주세요.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 text-slate-400 px-6 py-3 rounded-3xl text-xs font-black uppercase">
                        {userRole === 'admin' ? 'ADMIN MODE' : 'THERAPIST'}
                    </div>
                </div>
            </header>

            <section>
                <div className="flex items-center justify-between mb-8 px-4">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-2xl"><Clock className="w-6 h-6 text-rose-500" /></div>
                        작성 대기 목록
                        <span className="ml-2 text-rose-500 bg-rose-50 px-3 py-1 rounded-xl text-lg">{todoChildren.length}</span>
                    </h2>
                </div>

                {todoChildren.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {todoChildren.map((session) => (
                            <div key={session.id} className="bg-white p-10 rounded-[48px] border-2 border-slate-50 shadow-sm hover:border-primary/20 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{session.start_time.split('T')[0]}</span>
                                </div>
                                <div className="mb-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-3xl font-black text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner mb-6">
                                        {session.children?.name[0]}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">{session.children?.name} 아동</h3>
                                    <p className="text-primary text-xs font-black mt-2">{session.programs?.name}</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedSession(session); setIsModalOpen(true); }}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm hover:bg-primary transition-all active:scale-95 shadow-xl shadow-slate-100"
                                >
                                    일지 작성하기
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[56px] p-24 text-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-black text-lg">모든 일지 작성을 완료했습니다!</p>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 px-4">
                    <div className="p-2 bg-emerald-100 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                    최근 작성 내역
                </h2>
                <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm text-center">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Child Name</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Score</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {consultations.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="p-8 text-sm font-bold text-slate-500">{log.created_at.split('T')[0]}</td>
                                    <td className="p-8 text-base font-black text-slate-900">{log.children?.name}</td>
                                    <td className="p-8 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl font-black text-slate-700 text-xs">
                                            <Activity className="w-3 h-3 text-primary" />
                                            {Math.round((log.score_language + log.score_social + log.score_cognition + log.score_motor) / 4)}점
                                        </div>
                                    </td>
                                    <td className="p-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(log)}
                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                                title="수정"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(log.id, log.schedule_id)}
                                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-6xl rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-12 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">
                                    {selectedSession?.children?.name} 아동 상담 {editingLogId ? '수정' : '기록'}
                                </h3>
                                <p className="text-slate-400 font-bold mt-2">오늘 수업의 핵심 발달 사항과 관찰 내용을 기록해주세요.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-5 hover:bg-slate-100 rounded-full transition-all text-slate-300">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 overflow-y-auto">
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-primary" /> 01. 수업 및 상담 요약
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="어떤 활동을 했나요? 아이가 보여준 긍정적인 반응은 무엇인가요?"
                                        className="w-full h-48 bg-slate-50 border-none rounded-[40px] p-8 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none resize-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-500" /> 02. 전문가 소견 (치료사 전용)
                                    </label>
                                    <textarea
                                        value={developmentNote}
                                        onChange={(e) => setDevelopmentNote(e.target.value)}
                                        placeholder="부모님께는 공개되지 않는 치료사님의 전문적인 분석이나 다음 세션 계획을 기록하세요."
                                        className="w-full h-40 bg-emerald-50/20 border-none rounded-[40px] p-8 text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 outline-none resize-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 p-12 rounded-[50px] space-y-6">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 block">03. 4대 핵심 발달 지표 점수</label>
                                <ScoreSlider label="언어 및 표현" icon={<MessageCircle className="w-4 h-4 text-blue-500" />} value={scores.language} onChange={(v) => setScores({ ...scores, language: v })} color="accent-blue-500" />
                                <ScoreSlider label="사회적 상호작용" icon={<Baby className="w-4 h-4 text-rose-500" />} value={scores.social} onChange={(v) => setScores({ ...scores, social: v })} color="accent-rose-500" />
                                <ScoreSlider label="인지 및 이해" icon={<Brain className="w-4 h-4 text-purple-500" />} value={scores.cognition} onChange={(v) => setScores({ ...scores, cognition: v })} color="accent-purple-500" />
                                <ScoreSlider label="대/소근육 운동" icon={<Activity className="w-4 h-4 text-amber-500" />} value={scores.motor} onChange={(v) => setScores({ ...scores, motor: v })} color="accent-amber-500" />
                                <p className="text-[10px] text-slate-400 font-bold text-center mt-6">이 점수는 부모님 대시보드의 성장 그래프에 즉시 반영됩니다.</p>
                            </div>
                        </div>

                        <div className="p-12 bg-white border-t border-slate-50 flex gap-6">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-[30px] font-black hover:bg-slate-200 transition-all">취소</button>
                            <button onClick={handleSave} className="flex-[3] py-6 bg-slate-900 text-white rounded-[30px] font-black flex items-center justify-center gap-3 hover:bg-primary transition-all active:scale-95 shadow-2xl shadow-slate-200">
                                <Save className="w-6 h-6" /> {editingLogId ? '수정 내용 저장' : '상담 기록 저장 및 발송'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}