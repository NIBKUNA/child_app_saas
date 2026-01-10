// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 상담일지 및 발달 관리 - AssessmentFormModal 통합
 * - 슈퍼 어드민 예외 처리 (anukbin@gmail.com)
 * - 상태 조건 완화 (완료 OR 날짜 지남)
 * - 발달 평가 기능 통합 (기존 4-슬라이더 제거)
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Clock, CheckCircle2, X,
    Pencil, Trash2, BarChart3
} from 'lucide-react';
import { AssessmentFormModal } from '@/pages/app/children/AssessmentFormModal';

export function ConsultationList() {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState('therapist');
    const [todoChildren, setTodoChildren] = useState([]);
    const [recentAssessments, setRecentAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    // 발달 평가 모달 상태
    const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

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

            // ✨ [FIX] 슈퍼 어드민 예외 처리 - anukbin@gmail.com 또는 super_admin 역할
            const isSuperAdmin = role === 'super_admin' || user.email === 'anukbin@gmail.com';
            const isAdmin = role === 'admin' || isSuperAdmin;

            // 이미 평가 작성된 일정의 ID 수집
            const { data: existingAssessments } = await supabase.from('development_assessments').select('log_id, child_id');
            const writtenChildIds = new Set(existingAssessments?.map(a => a.child_id).filter(id => id !== null));

            // ✨ [FIX] 상태 조건 완화 - 완료됐거나 OR 상담 당일이 지난 일정 모두 포함
            const today = new Date().toISOString().split('T')[0];

            let sessionQuery = supabase
                .from('schedules')
                .select(`id, child_id, status, therapist_id, start_time, children (id, name), programs (name)`)
                .or(`status.eq.completed,start_time.lt.${today}T23:59:59`);

            if (!isAdmin) sessionQuery = sessionQuery.eq('therapist_id', user.id);
            const { data: sessions } = await sessionQuery.order('start_time', { ascending: false });

            // 평가가 아직 작성되지 않은 아동의 세션만 표시
            const pending = sessions?.filter(s => s.children && !writtenChildIds.has(s.children.id)) || [];
            setTodoChildren(pending);

            // 최근 작성된 발달 평가 목록
            let assessQuery = supabase
                .from('development_assessments')
                .select('*, children(id, name)')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!isAdmin) assessQuery = assessQuery.eq('therapist_id', user.id);
            const { data: assessments } = await assessQuery;
            setRecentAssessments(assessments || []);

        } catch (e) {
            console.error("데이터 로드 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssessment = (session) => {
        setSelectedSession(session);
        setIsAssessModalOpen(true);
    };

    const handleAssessmentSuccess = () => {
        setIsAssessModalOpen(false);
        setSelectedSession(null);
        fetchData(); // 목록 갱신
    };

    const handleDelete = async (assessId) => {
        if (!confirm("정말 이 발달 평가를 삭제하시겠습니까?\n부모님 앱에서도 즉시 사라집니다.")) return;

        try {
            const { error } = await supabase.from('development_assessments').delete().eq('id', assessId);
            if (error) throw error;
            alert("삭제되었습니다.");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    // 평균 점수 계산
    const calcAvg = (a) => {
        const scores = [a.score_communication, a.score_social, a.score_cognitive, a.score_motor, a.score_adaptive].filter(s => s !== null && s !== undefined);
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse">데이터 동기화 중...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 selection:bg-primary/10">
            <header className="flex justify-between items-end bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">발달 평가 및 상담 관리</h1>
                    <p className="text-slate-500 font-bold mt-3 text-sm">
                        {userRole === 'admin' || userRole === 'super_admin'
                            ? '센터 전체 발달 평가 현황을 실시간으로 확인합니다.'
                            : '수업 완료 후 아동의 발달 상태를 평가해 주세요.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-50 text-slate-400 px-6 py-3 rounded-3xl text-xs font-black uppercase">
                        {userRole === 'super_admin' ? 'SUPER ADMIN' : userRole === 'admin' ? 'ADMIN MODE' : 'THERAPIST'}
                    </div>
                </div>
            </header>

            {/* 작성 대기 목록 */}
            <section>
                <div className="flex items-center justify-between mb-8 px-4">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-2xl"><Clock className="w-6 h-6 text-rose-500" /></div>
                        평가 대기 목록
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
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[28px] flex items-center justify-center text-3xl font-black text-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white transition-all shadow-inner mb-6">
                                        {session.children?.name[0]}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">{session.children?.name} 아동</h3>
                                    <p className="text-primary text-xs font-black mt-2">{session.programs?.name}</p>
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
                    <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[56px] p-24 text-center">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-black text-lg">모든 발달 평가 작성을 완료했습니다!</p>
                    </div>
                )}
            </section>

            {/* 최근 작성 내역 */}
            <section>
                <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 px-4">
                    <div className="p-2 bg-emerald-100 rounded-2xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                    최근 평가 내역
                </h2>
                <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm">
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
                            {recentAssessments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 font-bold">아직 작성된 발달 평가가 없습니다.</td>
                                </tr>
                            ) : (
                                recentAssessments.map((assess) => (
                                    <tr key={assess.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="p-8 text-sm font-bold text-slate-500">{assess.evaluation_date || assess.created_at?.split('T')[0]}</td>
                                        <td className="p-8 text-base font-black text-slate-900">{assess.children?.name || '아동'}</td>
                                        <td className="p-8 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl font-black text-indigo-700 text-xs">
                                                <BarChart3 className="w-3 h-3" />
                                                평균 {calcAvg(assess)}점/5
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button
                                                onClick={() => handleDelete(assess.id)}
                                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
                    onClose={() => { setIsAssessModalOpen(false); setSelectedSession(null); }}
                    childId={selectedSession.children.id}
                    childName={selectedSession.children.name}
                    logId={null}
                    onSuccess={handleAssessmentSuccess}
                />
            )}
        </div>
    );
}