
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 상담일지 및 발달 관리 - AssessmentFormModal 통합
 * - 슈퍼 어드민 예외 처리
 * - 상태 조건 완화 (완료 OR 날짜 지남)
 * - 발달 평가 기능 통합 (기존 4-슬라이더 제거)
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import { toLocalDateStr } from '@/utils/timezone';
import {
    Clock, CheckCircle2,
    Pencil, Trash2, BarChart3, Search
} from 'lucide-react';
import { AssessmentFormModal } from '@/pages/app/children/AssessmentFormModal';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';

interface Session {
    id: string;
    child_id: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null;
    therapist_id: string;
    start_time: string;
    service_type: string | null;
    children: {
        id: string;
        name: string;
        center_id: string | null;
    };
    realLogId?: string | null;
}

interface DevelopmentAssessment {
    id: string;
    evaluation_date?: string;
    created_at: string;
    child_id: string;
    log_id?: string;
    therapist_id?: string | null;
    score_communication?: number;
    score_social?: number;
    score_cognitive?: number;
    score_motor?: number;
    score_adaptive?: number;
    summary?: string;
    children?: {
        id: string;
        name: string;
        center_id: string | null;
    };
}

export function ConsultationList() {
    const { user } = useAuth();
    const { center } = useCenter(); // ✨ Use Center
    const centerId = center?.id;
    const [userRole, setUserRole] = useState('therapist');
    const [todoChildren, setTodoChildren] = useState<Session[]>([]);
    const [recentAssessments, setRecentAssessments] = useState<DevelopmentAssessment[]>([]);
    const [loading, setLoading] = useState(true);

    // 발달 평가 모달 상태
    const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);  // ✨ [수정 모드]
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user && centerId) {
            fetchData();
        }
    }, [user, centerId]);

    const fetchData = async () => {
        if (!centerId || typeof centerId !== 'string' || centerId.length < 32) return;
        if (!user) return; // ✨ Check user
        setLoading(true);
        try {
            const { data: profile } = await (supabase.from('user_profiles')).select('role').eq('id', user.id).maybeSingle();
            const role = (profile as any)?.role || 'therapist';
            setUserRole(role);

            // ✨ [Refactor] Using Centralized Super Admin Check
            const isSuperAdmin = role === 'super_admin' || checkSuperAdmin(user?.email || '');
            const isAdmin = role === 'admin' || isSuperAdmin;

            // ✨ [FIX] therapists 테이블에서 현재 유저의 therapist 레코드 조회
            // therapists.profile_id = profiles.id = auth.users.id 이므로 profile_id로 조회
            let currentTherapistId = null;
            if (!isAdmin) {
                // ✨ [Improved] Search by profile_id (Canonical Link)
                // 이메일 변경 시에도 연결이 유지되도록 profile_id를 우선 사용합니다.
                const { data: therapist } = await (supabase
                    .from('therapists'))
                    .select('id')
                    .eq('profile_id', user.id)
                    .maybeSingle();

                currentTherapistId = therapist?.id;

                // 🛡️ Fallback: 연결이 끊긴 경우 이메일로 재시도 (Legacy/Broken Link Support)
                if (!currentTherapistId && user.email) {
                    const { data: legacyTherapist } = await (supabase
                        .from('therapists'))
                        .select('id')
                        .eq('email', user.email)
                        .maybeSingle();
                    currentTherapistId = (legacyTherapist as any)?.id;
                }

                if (!currentTherapistId) {
                    setTodoChildren([]);
                    setRecentAssessments([]);
                    setLoading(false);
                    return;
                }
            }

            // 1. 이미 일지가 작성된 '스케줄 ID' 수집 (교차 검증)
            // counseling_logs 테이블에서 schedule_id를 가져와야 정확히 매칭됨
            const { data: writtenLogs } = await (supabase
                .from('counseling_logs'))
                .select('schedule_id')
                .eq('center_id', centerId) // 🔒 Security Filter
                .not('schedule_id', 'is', null);

            const writtenScheduleIds = new Set((writtenLogs as any[])?.map((l: any) => l.schedule_id));



            // ✨ [Optimization] Performance Guard: Limit to last 60 days
            // Prevents fetching thousands of old sessions for long-running centers
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 60);
            const minDate = limitDate.toISOString().split('T')[0];

            // ✨ [FIX] 오늘 수업은 completed만, 과거 수업은 상태 무관하게 포함
            // 기존: start_time < today 23:59:59 → 오늘 예정된 미완료 수업도 포함되는 버그
            // 수정: start_time < today 00:00:00 (어제까지만) OR status=completed
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayEnd = yesterday.toISOString().split('T')[0] + 'T23:59:59';

            let sessionQuery = (supabase
                .from('schedules'))
                .select(`id, child_id, status, therapist_id, start_time, service_type, children!inner (id, name, center_id)`)
                .eq('children.center_id', centerId)
                .gte('start_time', minDate) // 🛡️ Performance Filter
                .or(`status.eq.completed,start_time.lte.${yesterdayEnd}`);

            // ✨ [FIX] therapist 테이블의 ID로 필터 (user.id가 아님!)
            if (!isAdmin && currentTherapistId) {
                sessionQuery = sessionQuery.eq('therapist_id', currentTherapistId);
            }
            const { data: sessions } = await sessionQuery.order('start_time', { ascending: false });

            // 2. 일지가 없는(ID가 Set에 없는) 스케줄만 필터링
            const pending = (sessions as any[])?.filter(s => s.children && !writtenScheduleIds.has(s.id)) || [];
            setTodoChildren(pending);

            // 최근 작성된 발달 평가 (치료사/행정용 전문 일지)
            // ✨ [권한 분리] 부모님이 직접 작성한 '자가진단 기록'은 치료사 리스트에서 제외
            let assessQuery = (supabase
                .from('development_assessments'))
                .select('*, children!inner(id, name, center_id)')
                .eq('children.center_id', centerId)
                .not('summary', 'eq', '부모님 자가진단 기록') // ✨ [User Request] 부모 자가진단 제외
                .order('created_at', { ascending: false })
                .limit(20);

            // ✨ [FIX] therapist 테이블의 ID로 필터
            if (!isAdmin && currentTherapistId) {
                assessQuery = assessQuery.eq('therapist_id', currentTherapistId);
            }
            const { data: assessments } = await assessQuery;
            setRecentAssessments((assessments as any) || []);

        } catch (e) {
            console.error("데이터 로드 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    // ✨ [수정] 일지 ID 가져오기 로직 추가 (FK Violation 해결)
    const handleOpenAssessment = async (session: Session) => {
        try {
            // Find if there's an existing log for this session
            const { data: log } = await (supabase
                .from('counseling_logs'))
                .select('id')
                .eq('schedule_id', session.id)
                .maybeSingle();

            setSelectedSession({
                ...session,
                realLogId: log?.id || null // Pass existing ID if found, otherwise null
            });
            setIsAssessModalOpen(true);
        } catch (error) {
            console.error("세션 확인 중 오류:", error);
        }
    };

    const handleAssessmentSuccess = () => {
        setIsAssessModalOpen(false);
        setSelectedSession(null);
        setEditingAssessmentId(null);  // ✨ [수정 모드 초기화]
        fetchData(); // 목록 갱신
    };

    // ✨ [수정 기능] 기존 평가 수정 
    const handleEdit = (assess: DevelopmentAssessment) => {
        setEditingAssessmentId(assess.id);
        // 이미 log_id가 assessment에 들어있으므로 그것을 사용
        setSelectedSession({
            id: '', // Dummy ID required by type
            child_id: assess.child_id,
            status: 'completed', // Mock status
            start_time: assess.created_at,
            service_type: null,
            children: assess.children || { id: assess.child_id, name: '아동', center_id: centerId || null },
            realLogId: assess.log_id,
            therapist_id: assess.therapist_id || '' // ✨ [Fix] 원래 작성자 ID 전달
        });
        setIsAssessModalOpen(true);
    };

    const handleDelete = async (assess: DevelopmentAssessment) => {
        if (!confirm("정말 이 발달 평가를 삭제하시겠습니까?\n부모님 앱에서도 즉시 사라집니다.")) return;

        try {
            // 1. 평가 삭제
            const { error: assessError } = await (supabase.from('development_assessments')).delete().eq('id', assess.id);
            if (assessError) throw assessError;

            // 2. 연결된 일지가 '발달 평가용 자동 생성 일지'라면 일지도 함께 삭제하여 깨끗하게 정리
            if (assess.log_id) {
                const { data: log } = await (supabase.from('counseling_logs')).select('content').eq('id', assess.log_id).maybeSingle();
                if ((log as any)?.content?.includes('발달 평가 작성을 위해 자동 생성')) {
                    await (supabase.from('counseling_logs')).delete().eq('id', assess.log_id);
                }
            }

            alert("삭제되었습니다.");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    // 평균 점수 계산
    const calcAvg = (a: DevelopmentAssessment) => {
        const scores = [a.score_communication, a.score_social, a.score_cognitive, a.score_motor, a.score_adaptive].filter(s => s !== null && s !== undefined);
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 dark:text-slate-500 animate-pulse">데이터 동기화 중...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12 selection:bg-primary/10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-slate-800 p-6 md:p-10 rounded-3xl md:rounded-[48px] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">발달 평가 및 상담 관리</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-3 text-sm">
                        {userRole === 'admin' || userRole === 'super_admin'
                            ? '센터 전체 발달 평가 현황을 실시간으로 확인합니다.'
                            : '수업 완료 후 아동의 발달 상태를 평가해 주세요.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 px-6 py-3 rounded-3xl text-xs font-black uppercase">
                        {(userRole === 'super_admin' || checkSuperAdmin(user?.email)) ? 'SUPER ADMIN' : userRole === 'admin' ? 'ADMIN MODE' : 'THERAPIST'}
                    </div>
                </div>
            </header>

            {/* 작성 대기 목록 */}
            <section>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-4 gap-4">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-2xl"><Clock className="w-6 h-6 text-rose-500" /></div>
                        평가 대기 목록
                        <span className="ml-2 text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-xl text-lg">{todoChildren.filter(s => s.children?.name?.toLowerCase().includes(searchTerm.toLowerCase())).length}</span>
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="아동 이름 검색..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {(() => {
                    const filteredTodo = todoChildren.filter(s =>
                        s.children?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return filteredTodo.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTodo.map((session) => (
                                <div key={session.id} className="bg-white dark:bg-slate-800 p-10 rounded-[48px] border-2 border-slate-50 dark:border-slate-700 shadow-sm hover:border-primary/20 dark:hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">{toLocalDateStr(session.start_time)}</span>
                                    </div>
                                    <div className="mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[28px] flex items-center justify-center text-3xl font-black text-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white transition-all shadow-inner mb-6">
                                            {session.children?.name[0]}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{session.children?.name} 아동</h3>
                                        <p className="text-primary dark:text-indigo-400 text-xs font-black mt-2">{session.service_type || '치료 세션'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenAssessment(session)}
                                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[24px] font-black text-sm hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                        발달 평가 작성하기
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[56px] p-24 text-center">
                            <CheckCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-black text-lg">
                                {searchTerm ? `"${searchTerm}" 검색 결과가 없습니다.` : '모든 발달 평가 작성을 완료했습니다!'}
                            </p>
                        </div>
                    );
                })()}
            </section>

            {/* 최근 작성 내역 */}
            <section>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 px-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                    최근 평가 내역
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-[48px] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Child Name</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Avg Score</th>
                                <th className="p-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                            {recentAssessments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">아직 작성된 발달 평가가 없습니다.</td>
                                </tr>
                            ) : (
                                recentAssessments.map((assess) => (
                                    <tr key={assess.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-8 text-sm font-bold text-slate-500 dark:text-slate-400">{assess.evaluation_date || assess.created_at?.split('T')[0]}</td>
                                        <td className="p-8 text-base font-black text-slate-900 dark:text-white">{assess.children?.name || '아동'}</td>
                                        <td className="p-8 text-center">
                                            {calcAvg(assess) > 0 ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl font-black text-indigo-700 text-xs">
                                                    <BarChart3 className="w-3 h-3" />
                                                    평균 {calcAvg(assess)}점/5
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-bold italic">정기 상담 일지</span>
                                            )}
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(assess)}
                                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all"
                                                    title="수정"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(assess)}
                                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl transition-all"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 발달 평가 모달 */}
            {isAssessModalOpen && selectedSession?.children && (
                <AssessmentFormModal
                    isOpen={isAssessModalOpen}
                    onClose={() => { setIsAssessModalOpen(false); setSelectedSession(null); setEditingAssessmentId(null); }}
                    childId={selectedSession.children.id}
                    childName={selectedSession.children.name}
                    logId={selectedSession.realLogId || null}
                    scheduleId={selectedSession.id || null} // ✨ [Add]
                    sessionDate={toLocalDateStr(selectedSession.start_time) || null} // ✨ [Add]
                    therapistId={selectedSession.therapist_id || null}
                    assessmentId={editingAssessmentId}
                    onSuccess={handleAssessmentSuccess}
                />
            )}
        </div>
    );
}