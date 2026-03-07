
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 상담일지 및 발달 관리 — 아동별 4열 그리드 + 행별 확장 패널
 * - 아동 단위로 미작성 세션을 그룹핑
 * - 치료사 이름 표시
 * - 최근 평가도 아동별 그리드화
 * - 수업 상태 직관적 표시 (수업 완료 / 날짜 경과)
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { toLocalDateStr } from '@/utils/timezone';
import {
    Clock, CheckCircle2,
    Pencil, Trash2, BarChart3, Search, ChevronDown, ChevronRight
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

interface ChildGroup {
    childId: string;
    childName: string;
    therapistName: string;
    sessions: Session[];
    latestDate: string;
}

interface AssessChildGroup {
    childId: string;
    childName: string;
    therapistName: string;
    assessments: DevelopmentAssessment[];
    latestDate: string;
}

export function ConsultationList() {
    const { user, role: authRole } = useAuth();
    const { center } = useCenter();
    const centerId = center?.id;
    const [userRole, setUserRole] = useState(authRole || 'therapist');
    const [todoChildren, setTodoChildren] = useState<Session[]>([]);
    const [recentAssessments, setRecentAssessments] = useState<DevelopmentAssessment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [therapistMap, setTherapistMap] = useState<Record<string, string>>({});

    // 아코디언 상태 (하나만 펼침)
    const [expandedPendingId, setExpandedPendingId] = useState<string | null>(null);
    const [expandedAssessId, setExpandedAssessId] = useState<string | null>(null);

    const isDark = document.documentElement.classList.contains('dark');

    useEffect(() => {
        if (user && centerId) {
            fetchData();
        }
    }, [user, centerId, authRole]);

    const fetchData = async () => {
        if (!centerId || typeof centerId !== 'string' || centerId.length < 32) return;
        if (!user) return;
        setLoading(true);
        try {
            const role = authRole || 'therapist';
            setUserRole(role);

            const isSuperAdmin = role === 'super_admin' || checkSuperAdmin(user?.email || '');
            const isAdmin = role === 'admin' || role === 'manager' || isSuperAdmin;

            let currentTherapistId = null;
            if (!isAdmin) {
                const { data: therapist } = await (supabase
                    .from('therapists'))
                    .select('id')
                    .eq('profile_id', user.id)
                    .maybeSingle();
                currentTherapistId = therapist?.id;

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

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayEnd = yesterday.toISOString().split('T')[0] + 'T23:59:59';

            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 60);
            const minDate = limitDate.toISOString().split('T')[0];

            let sessionQuery = (supabase
                .from('schedules'))
                .select(`id, child_id, status, therapist_id, start_time, service_type, children!inner (id, name, center_id)`)
                .eq('children.center_id', centerId)
                .gte('start_time', minDate)
                .or(`status.eq.completed,start_time.lte.${yesterdayEnd}`);

            if (!isAdmin && currentTherapistId) {
                sessionQuery = sessionQuery.eq('therapist_id', currentTherapistId);
            }

            const [logsResult, sessionsResult] = await Promise.all([
                (supabase.from('counseling_logs'))
                    .select('schedule_id')
                    .eq('center_id', centerId)
                    .gte('created_at', minDate)
                    .not('schedule_id', 'is', null),
                sessionQuery.order('start_time', { ascending: false })
            ]);

            const writtenScheduleIds = new Set((logsResult.data as any[])?.map((l: any) => l.schedule_id));
            if (sessionsResult.error) console.error('[ConsultationList] sessions query error:', sessionsResult.error);

            const pending = (sessionsResult.data as any[])?.filter(s => s.children && !writtenScheduleIds.has(s.id)) || [];
            setTodoChildren(pending);

            const [childrenResult, therapistsResult] = await Promise.all([
                supabase.from('children').select('id, name, center_id').eq('center_id', centerId),
                supabase.from('therapists').select('id, name').eq('center_id', centerId)
            ]);

            const centerChildren = childrenResult.data;
            const childIds = (centerChildren || []).map((c: any) => c.id);
            const childMap: Record<string, any> = {};
            (centerChildren || []).forEach((c: any) => { childMap[c.id] = c; });

            const tMap: Record<string, string> = {};
            (therapistsResult.data || []).forEach((t: any) => { tMap[t.id] = t.name; });
            setTherapistMap(tMap);

            if (childIds.length > 0) {
                const ASSESS_BATCH = 200;
                const assessPromises = [];
                for (let i = 0; i < childIds.length; i += ASSESS_BATCH) {
                    let q = supabase
                        .from('development_assessments')
                        .select('*')
                        .in('child_id', childIds.slice(i, i + ASSESS_BATCH))
                        .not('summary', 'eq', '부모님 자가진단 기록')
                        .order('created_at', { ascending: false })
                        .limit(100);
                    if (!isAdmin && currentTherapistId) {
                        q = q.eq('therapist_id', currentTherapistId);
                    }
                    assessPromises.push(q);
                }
                const assessResults = await Promise.all(assessPromises);
                const allAssessments = assessResults
                    .flatMap(r => (r.data || []) as any[])
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                if (assessResults.some(r => r.error)) {
                    console.error('[ConsultationList] assessments error:', assessResults.find(r => r.error)?.error);
                }
                const merged = allAssessments.map((a: any) => ({
                    ...a,
                    children: childMap[a.child_id] || { id: a.child_id, name: '아동', center_id: centerId },
                    therapist_name: tMap[a.therapist_id] || null,
                }));
                setRecentAssessments(merged);
            } else {
                setRecentAssessments([]);
            }
        } catch (e) {
            console.error("데이터 로드 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssessment = async (session: Session) => {
        try {
            const { data: log } = await (supabase
                .from('counseling_logs'))
                .select('id')
                .eq('schedule_id', session.id)
                .maybeSingle();
            setSelectedSession({ ...session, realLogId: log?.id || null });
            setIsAssessModalOpen(true);
        } catch (error) {
            console.error("세션 확인 중 오류:", error);
        }
    };

    const handleAssessmentSuccess = () => {
        setIsAssessModalOpen(false);
        setSelectedSession(null);
        setEditingAssessmentId(null);
        fetchData();
    };

    const handleEdit = (assess: DevelopmentAssessment) => {
        setEditingAssessmentId(assess.id);
        setSelectedSession({
            id: '',
            child_id: assess.child_id,
            status: 'completed',
            start_time: assess.created_at,
            service_type: null,
            children: assess.children || { id: assess.child_id, name: '아동', center_id: centerId || null },
            realLogId: assess.log_id,
            therapist_id: assess.therapist_id || ''
        });
        setIsAssessModalOpen(true);
    };

    const handleDelete = async (assess: DevelopmentAssessment) => {
        if (!confirm("정말 이 발달 평가를 삭제하시겠습니까?\n삭제 후 해당 아동은 다시 평가 대기 목록에 나타납니다.")) return;
        try {
            const { error: assessError } = await (supabase.from('development_assessments')).delete().eq('id', assess.id);
            if (assessError) throw assessError;
            if (assess.log_id) {
                await (supabase.from('counseling_logs')).delete().eq('id', assess.log_id);
            }
            alert("삭제되었습니다. 해당 아동이 평가 대기 목록에 다시 나타납니다.");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const calcAvg = (a: DevelopmentAssessment) => {
        const scores = [a.score_communication, a.score_social, a.score_cognitive, a.score_motor, a.score_adaptive].filter(s => s !== null && s !== undefined);
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    };

    // ✨ 평가 대기 — 아동별 그룹핑
    const childGroups: ChildGroup[] = useMemo(() => {
        const filtered = todoChildren.filter(s =>
            s.children?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const groupMap = new Map<string, ChildGroup>();
        filtered.forEach(session => {
            const cid = session.child_id;
            if (!groupMap.has(cid)) {
                groupMap.set(cid, {
                    childId: cid,
                    childName: session.children?.name || '아동',
                    therapistName: therapistMap[session.therapist_id] || '',
                    sessions: [],
                    latestDate: session.start_time,
                });
            }
            const group = groupMap.get(cid)!;
            group.sessions.push(session);
            if (session.start_time > group.latestDate) group.latestDate = session.start_time;
        });
        return Array.from(groupMap.values()).sort((a, b) =>
            new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
        );
    }, [todoChildren, searchTerm, therapistMap]);

    // ✨ 최근 평가 — 아동별 그룹핑
    const assessChildGroups: AssessChildGroup[] = useMemo(() => {
        const groupMap = new Map<string, AssessChildGroup>();
        recentAssessments.forEach(assess => {
            const cid = assess.child_id;
            if (!groupMap.has(cid)) {
                groupMap.set(cid, {
                    childId: cid,
                    childName: assess.children?.name || '아동',
                    therapistName: (assess as any).therapist_name || '',
                    assessments: [],
                    latestDate: assess.evaluation_date || assess.created_at,
                });
            }
            groupMap.get(cid)!.assessments.push(assess);
        });
        return Array.from(groupMap.values()).sort((a, b) =>
            new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
        );
    }, [recentAssessments]);

    // 수업 상태 라벨
    const sessionStatusLabel = (session: Session) => {
        if (session.status === 'completed') return { text: '수업 완료', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-400' };
        return { text: '날짜 경과', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' };
    };

    const totalPendingSessions = todoChildren.filter(s => s.children?.name?.toLowerCase().includes(searchTerm.toLowerCase())).length;

    if (loading) return <div className="p-20 text-center font-black text-slate-300 dark:text-slate-500 animate-pulse">데이터 동기화 중...</div>;

    // 4열 기준 행 만들기 헬퍼
    const makeRows = <T extends { childId: string }>(items: T[], cols: number): T[][] => {
        const rows: T[][] = [];
        for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
        return rows;
    };

    const pendingRows = makeRows(childGroups, 4);
    const assessRows = makeRows(assessChildGroups, 4);

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

            {/* ═══════ 1. 평가 대기 목록 (4열 그리드) ═══════ */}
            <section>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-2 gap-4">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-2xl"><Clock className="w-5 h-5 md:w-6 md:h-6 text-rose-500" /></div>
                        평가 대기 목록
                        <div className="flex items-center gap-2 ml-1">
                            <span className="text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-xl text-sm font-black">{childGroups.length}명</span>
                            <span className="text-slate-400 text-xs font-bold">({totalPendingSessions}건)</span>
                        </div>
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="아동 이름 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
                        )}
                    </div>
                </div>

                {childGroups.length > 0 ? (
                    <div className="space-y-3">
                        {pendingRows.map((row, rowIdx) => {
                            const expandedInRow = row.find(g => g.childId === expandedPendingId);
                            return (
                                <div key={rowIdx}>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {row.map((group) => {
                                            const isActive = group.childId === expandedPendingId;
                                            return (
                                                <button key={group.childId} onClick={() => setExpandedPendingId(isActive ? null : group.childId)}
                                                    className={`relative p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 text-left transition-all ${
                                                        isActive
                                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 scale-[1.02]'
                                                            : isDark ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/40' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-500 dark:text-indigo-400'}`}>
                                                            {group.childName[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className={`text-sm md:text-base font-black truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{group.childName}</div>
                                                            <div className={`text-[10px] font-bold truncate ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                                                                {group.therapistName || group.sessions[0]?.service_type || 'therapy'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] md:text-xs font-black px-2.5 py-1 rounded-lg ${
                                                            isActive ? 'bg-white/20 text-white'
                                                            : group.sessions.length >= 5 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500'
                                                            : group.sessions.length >= 3 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
                                                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500'
                                                        }`}>미작성 {group.sessions.length}건</span>
                                                        {isActive ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {expandedInRow && (
                                        <div className={`mt-2 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-800 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-100'}`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black">{expandedInRow.childName[0]}</div>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{expandedInRow.childName}</span>
                                                {expandedInRow.therapistName && <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">{expandedInRow.therapistName}</span>}
                                                <span className="text-[10px] font-bold text-slate-400 ml-auto">미작성 {expandedInRow.sessions.length}건</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {expandedInRow.sessions
                                                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                                                    .map((session) => {
                                                        const sl = sessionStatusLabel(session);
                                                        return (
                                                            <div key={session.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDark ? 'bg-slate-900/60 border-slate-700 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sl.dot}`} />
                                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{toLocalDateStr(session.start_time)}</span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sl.color}`}>{sl.text}</span>
                                                                </div>
                                                                <button onClick={() => handleOpenAssessment(session)}
                                                                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-black text-[10px] hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 flex items-center gap-1">
                                                                    <BarChart3 className="w-3 h-3" />작성
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[40px] p-16 md:p-24 text-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-black text-lg">
                            {searchTerm ? `"${searchTerm}" 검색 결과가 없습니다.` : '모든 발달 평가 작성을 완료했습니다!'}
                        </p>
                    </div>
                )}
            </section>

            {/* ═══════ 2. 최근 평가 내역 (4열 그리드) ═══════ */}
            <section>
                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl"><CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" /></div>
                        최근 평가 내역
                        <div className="flex items-center gap-2 ml-1">
                            <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-xl text-sm font-black">{assessChildGroups.length}명</span>
                            <span className="text-slate-400 text-xs font-bold">({recentAssessments.length}건)</span>
                        </div>
                    </h2>
                </div>

                {assessChildGroups.length > 0 ? (
                    <div className="space-y-3">
                        {assessRows.map((row, rowIdx) => {
                            const expandedInRow = row.find(g => g.childId === expandedAssessId);
                            return (
                                <div key={rowIdx}>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {row.map((group) => {
                                            const isActive = group.childId === expandedAssessId;
                                            const latestScore = group.assessments[0] ? calcAvg(group.assessments[0]) : 0;
                                            return (
                                                <button key={group.childId} onClick={() => setExpandedAssessId(isActive ? null : group.childId)}
                                                    className={`relative p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 text-left transition-all ${
                                                        isActive
                                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40 scale-[1.02]'
                                                            : isDark ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/40' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-500 dark:text-emerald-400'}`}>
                                                            {group.childName[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className={`text-sm md:text-base font-black truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{group.childName}</div>
                                                            <div className={`text-[10px] font-bold truncate ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                                                                {group.therapistName || '치료사'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] md:text-xs font-black px-2.5 py-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                                {group.assessments.length}건 작성
                                                            </span>
                                                            {latestScore > 0 && (
                                                                <span className={`text-[10px] font-bold ${isActive ? 'text-white/60' : 'text-slate-400'}`}>최근 {latestScore}점</span>
                                                            )}
                                                        </div>
                                                        {isActive ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {expandedInRow && (
                                        <div className={`mt-2 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-800 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-black">{expandedInRow.childName[0]}</div>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{expandedInRow.childName}</span>
                                                {expandedInRow.therapistName && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">{expandedInRow.therapistName}</span>}
                                                <span className="text-[10px] font-bold text-slate-400 ml-auto">{expandedInRow.assessments.length}건 평가 완료</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {expandedInRow.assessments.map((assess) => (
                                                    <div key={assess.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[80px]">{assess.evaluation_date || assess.created_at?.split('T')[0]}</span>
                                                            {calcAvg(assess) > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg font-black text-indigo-700 dark:text-indigo-300 text-[10px]">
                                                                    <BarChart3 className="w-3 h-3" />평균 {calcAvg(assess)}점/5
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold italic">정기 상담</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button onClick={() => handleEdit(assess)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all" title="수정">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(assess)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all" title="삭제">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[40px] p-16 text-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-black text-lg">아직 작성된 발달 평가가 없습니다.</p>
                    </div>
                )}
            </section>

            {/* 발달 평가 모달 */}
            {isAssessModalOpen && selectedSession?.children && (
                <AssessmentFormModal
                    isOpen={isAssessModalOpen}
                    onClose={() => { setIsAssessModalOpen(false); setSelectedSession(null); setEditingAssessmentId(null); }}
                    childId={selectedSession.children.id}
                    childName={selectedSession.children.name}
                    logId={selectedSession.realLogId || null}
                    scheduleId={selectedSession.id || null}
                    sessionDate={toLocalDateStr(selectedSession.start_time) || null}
                    therapistId={selectedSession.therapist_id || null}
                    assessmentId={editingAssessmentId}
                    onSuccess={handleAssessmentSuccess}
                />
            )}
        </div>
    );
}