// @ts-nocheck
/* eslint-disable */
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
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, Loader2, MessageSquare, Calendar,
    User, Activity, Quote, ChevronRight
} from 'lucide-react';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import

export function ParentLogsPage() {
    const navigate = useNavigate();
    const { center } = useCenter(); // ✨ Context
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [latestSummary, setLatestSummary] = useState<string | null>(null);
    const [parentObservations, setParentObservations] = useState<any[]>([]);  // ✨ 부모 관찰 일기

    useEffect(() => {
        if (loading) fetchLogs();
    }, [center]); // ✨ Refetch on center change if needed, but mainly initial mount

    // Trigger initial fetch
    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return setError("로그인이 필요합니다.");

            // 1. 유저 프로필 및 권한 확인
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            // ✨ 본인 자녀 ID 찾기
            let targetChildId = null;

            // 1. parents 테이블에서 실제 ID 찾기
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
                if (directChild) targetChildId = directChild.id;
            }

            if (!targetChildId) {
                // 2. family_relationships 테이블에서 체크
                const { data: rel } = await supabase
                    .from('family_relationships')
                    .select('child_id')
                    .eq('parent_id', user.id)
                    .maybeSingle();
                targetChildId = rel?.child_id;
            }

            // 2. 상담 일지 조회 (치료사 및 발달 평가 데이터 포함)
            let query = supabase
                .from('counseling_logs')
                .select(`
                    *,
                    therapists:therapist_id (name),
                    development_assessments (summary),
                    children!inner(center_id)
                `)
                .order('session_date', { ascending: false });

            // 관리자가 아니면 본인 아이 정보만 필터링
            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                if (!center?.id) {
                    setError("센터 정보가 없습니다.");
                    setLoading(false);
                    return;
                }
                // ✨ [Admin] Filter by Center
                query = query.eq('children.center_id', center.id);
            } else {
                if (!targetChildId) {
                    setError("연결된 아이 정보가 없습니다.");
                    setLoading(false);
                    return;
                }
                query = query.eq('child_id', targetChildId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setLogs(data || []);

            // ✨ 부모 관찰 일기 가져오기
            if (targetChildId) {
                const { data: observations } = await supabase
                    .from('parent_observations')
                    .select('*')
                    .eq('child_id', targetChildId)
                    .order('created_at', { ascending: false })
                    .limit(10);
                setParentObservations(observations || []);
            }

        } catch (e: any) {
            console.error("Logs fetch error:", e);
            setError("기록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] p-6 pb-20 font-sans">
            <div className="max-w-2xl mx-auto">
                {/* 상단 네비게이션 */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-8 font-black text-slate-400 hover:text-primary transition-all group"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    뒤로가기
                </button>

                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-[24px]">
                            <MessageSquare className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">성장 기록 일지</h2>
                            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest">Growth Diary</p>
                        </div>
                    </div>
                </div>



                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-slate-400 font-black">아이의 소중한 시간을 찾는 중...</p>
                    </div>
                ) : logs.length > 0 ? (
                    <div className="space-y-10">
                        {logs.map((log) => (
                            <div key={log.id} className="bg-white rounded-[48px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden group hover:border-primary/20 transition-all duration-500">
                                {/* 카드 헤더 */}
                                <div className="p-8 bg-slate-50/50 flex justify-between items-center border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Calendar className="w-5 h-5 text-primary" />
                                        </div>
                                        {/* ✨ 수업 일자 표시 */}
                                        <span className="font-black text-slate-900 text-lg">
                                            {log.session_date} 수업 기록
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-black text-slate-600">{log.therapists?.name} 선생님</span>
                                    </div>
                                </div>

                                {/* 상세 글 내용 */}
                                <div className="p-8 space-y-8">
                                    {/* Activities */}
                                    <div className="relative">
                                        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> 진행 활동
                                        </h4>
                                        <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap pl-1">
                                            {log.activities || '작성된 활동 내용이 없습니다.'}
                                        </p>
                                    </div>

                                    {/* Child Response */}
                                    {log.child_response && (
                                        <div className="relative">
                                            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Quote className="w-4 h-4" /> 아동 반응
                                            </h4>
                                            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap pl-1">
                                                {log.child_response}
                                            </p>
                                        </div>
                                    )}

                                    {/* ✨ 선생님 소견 및 향후 계획 (통합) */}
                                    {(log.next_plan || log.development_assessments?.[0]?.summary) && (
                                        <div className="relative pt-4 border-t border-slate-100">
                                            <h4 className="font-bold text-primary text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <ChevronRight className="w-4 h-4" /> 선생님 소견 및 향후 계획
                                            </h4>
                                            {/* ✨ [정밀 연동] 해당 상담일지와 연결된 발달 평가 소견만 정확히 표시 */}
                                            {log.development_assessments?.[0]?.summary && (
                                                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap pl-1 mb-3 italic bg-indigo-50/50 p-3 rounded-xl">
                                                    "📝 {log.development_assessments[0].summary}"
                                                </p>
                                            )}
                                            {log.next_plan && (
                                                <p className="text-slate-900 font-bold leading-relaxed whitespace-pre-wrap pl-1">
                                                    📅 {log.next_plan}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[56px] p-32 text-center border-2 border-dashed border-slate-100 shadow-sm">
                        <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <p className="text-slate-400 font-black text-lg italic">기록된 상담 내용이 없습니다.</p>
                    </div>
                )}
            </div>

            {/* ✨ 부모 관찰 일기 기록함 */}
            {parentObservations.length > 0 && (
                <div className="max-w-2xl mx-auto mt-12 px-6">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <span>📝</span> 내가 쓴 관찰 일기
                    </h3>
                    <div className="space-y-4">
                        {parentObservations.map((obs) => (
                            <div key={obs.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 mb-2">
                                    {new Date(obs.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                    {obs.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}