import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react';

import { ParentDevelopmentChart } from '@/components/app/parent/ParentDevelopmentChart';
import { useCenter } from '@/contexts/CenterContext';
import type { Database } from '@/types/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

interface DevelopmentAssessment extends TableRow<'development_assessments'> { }
interface ChildBasic extends Pick<TableRow<'children'>, 'id' | 'name'> { }


export function ParentStatsPage() {
    const navigate = useNavigate();
    const { center } = useCenter();
    const [loading, setLoading] = useState(true);
    const [devData, setDevData] = useState<DevelopmentAssessment[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string>('parent');

    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildName, setSelectedChildName] = useState<string>('');



    const [therapistId, setTherapistId] = useState<string | null>(null);
    const [parentChecks, setParentChecks] = useState<Record<string, string[]>>({
        communication: [], social: [], cognitive: [], motor: [], adaptive: []
    });
    const [saving, setSaving] = useState(false);


    useEffect(() => {
        initializePage();
    }, [center]);

    const initializePage = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return setError("로그인이 필요합니다.");

            // ✨ user_profiles 테이블에서 역할 확인
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            const userRole = profile?.role || 'parent';
            setRole(userRole);

            if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {

                if (!center?.id) { setLoading(false); return; }
                const { data: childList } = await supabase.from('children').select('id, name').eq('center_id', center.id);
                const childrenData = (childList || []) as ChildBasic[];
                // setChildren(childrenData); // Remove if state not needed, or add back
                if (childrenData[0]) {
                    setSelectedChildId(childrenData[0].id);
                    setSelectedChildName(childrenData[0].name);
                    await loadChildStats(childrenData[0].id);
                }
            } else {



                // 부모 권한일 때 연결된 자녀 찾기
                let childId = null;
                const { data: parentRecord } = await supabase.from('parents').select('id').eq('profile_id', user.id).maybeSingle();
                if (parentRecord) {
                    const { data: directChild } = await supabase.from('children').select('id, name').eq('parent_id', parentRecord.id).maybeSingle();
                    if (directChild) {
                        childId = directChild.id;
                        setSelectedChildName(directChild.name);
                    }
                }
                if (!childId) {
                    const { data: rel } = await supabase.from('family_relationships').select('child_id, children(name)').eq('parent_id', user.id).maybeSingle();
                    if (rel) {
                        childId = rel.child_id;
                        const childData = rel.children as unknown as { name: string } | null;
                        setSelectedChildName(childData?.name || '');
                    }
                }
                if (childId) {
                    setSelectedChildId(childId);
                    await loadChildStats(childId);
                } else {
                    setError("연결된 아이 정보가 없습니다.");
                }
            }
        } catch (e) {
            console.error(e);
            setError("초기화 중 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    const loadChildStats = async (childId: string, shouldInitChecks = true) => {
        if (!childId) return;
        const { data } = await supabase
            .from('development_assessments')
            .select('*')
            .eq('child_id', childId)
            .order('evaluation_date', { ascending: false })
            .limit(10); // 추이 확인을 위해 10개까지 로드

        const assessments = data as DevelopmentAssessment[];
        setDevData(assessments || []);

        // ✨ 배정 치료사 정보를 child_therapist 테이블에서 가져오기
        const { data: ctInfo } = await supabase
            .from('child_therapist')
            .select('therapist_id')
            .eq('child_id', childId)
            .eq('is_primary', true)
            .maybeSingle();

        if (ctInfo) setTherapistId(ctInfo.therapist_id);


        // ✨ 최신 리포트의 체크 항목을 부모 체크 상태로 초기화 (로드 시점)
        if (shouldInitChecks && assessments && assessments[0]) {
            const latestDetails = (assessments[0].assessment_details as Record<string, string[]>) || {};
            setParentChecks(latestDetails);
        }
    };


    const handleToggleCheck = (domain: string, itemId: string) => {
        setParentChecks(prev => {
            const current = prev[domain] || [];
            const next = current.includes(itemId)
                ? current.filter(id => id !== itemId)
                : [...current, itemId];
            return { ...prev, [domain]: next };
        });
    };

    const handleSaveSelfAssessment = async () => {
        if (!selectedChildId || !center?.id) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            const today = new Date().toISOString().split('T')[0];

            const payload: TableInsert<'development_assessments'> = {
                center_id: center.id,
                child_id: selectedChildId,
                therapist_id: therapistId, // ✨ 배정된 치료사 ID 연동
                evaluation_date: today,
                score_communication: (parentChecks.communication?.length || 0),
                score_social: (parentChecks.social?.length || 0),
                score_cognitive: (parentChecks.cognitive?.length || 0),
                score_motor: (parentChecks.motor?.length || 0),
                score_adaptive: (parentChecks.adaptive?.length || 0),
                assessment_details: parentChecks as unknown as Database['public']['Tables']['development_assessments']['Insert']['assessment_details'], // Json type
                summary: '부모님 자가진단 기록',
                therapist_notes: '부모님이 앱에서 직접 체크하여 저장한 발달 데이터입니다. 상담 시 참고하세요.'
            };

            // ✨ 같은 날짜에 같은 아이의 부모 자가진단이 이미 있으면 업데이트
            const { data: existing } = await supabase
                .from('development_assessments')
                .select('id')
                .eq('child_id', selectedChildId)
                .eq('evaluation_date', today)
                .eq('summary', '부모님 자가진단 기록')
                .maybeSingle();

            let error;
            if (existing) {
                // 기존 레코드 업데이트
                ({ error } = await supabase
                    .from('development_assessments')
                    .update({
                        score_communication: payload.score_communication,
                        score_social: payload.score_social,
                        score_cognitive: payload.score_cognitive,
                        score_motor: payload.score_motor,
                        score_adaptive: payload.score_adaptive,
                        assessment_details: payload.assessment_details,
                    })
                    .eq('id', existing.id));
            } else {
                // 새 레코드 삽입
                ({ error } = await supabase.from('development_assessments').insert(payload));
            }

            if (error) throw error;

            alert("✅ 자가진단 결과가 성공적으로 저장되었습니다.\n성장 추이 그래프에서 변화를 확인해보세요!");

            // ✨ [Fix] 저장 후 체크 상태 유지
            // 기존: 체크를 전부 리셋 → 차트가 0으로 표시, 재체크 시 처음부터 다시 클릭 필요
            // 변경: 현재 체크 상태 그대로 유지 → 차트에서 방금 저장한 점수 표시, 수정도 이어서 가능
            // DB 데이터만 새로고침 (shouldInitChecks=false → 체크 상태를 DB 값으로 덮어쓰지 않음)
            await loadChildStats(selectedChildId, false);
        } catch (e: any) {
            console.error(e);
            alert("저장 실패: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    // ✨ [Calculated] 부모님이 체크한 내용을 기반으로 실시간 가상 발달 지표 생성
    const activeAssessment = {
        evaluation_date: '실시간 자가진단',
        score_communication: (parentChecks.communication?.length || 0),
        score_social: (parentChecks.social?.length || 0),
        score_cognitive: (parentChecks.cognitive?.length || 0),
        score_motor: (parentChecks.motor?.length || 0),
        score_adaptive: (parentChecks.adaptive?.length || 0),
        assessment_details: parentChecks
    };

    // 차트에 전달할 데이터 조합 (최신은 부모 체크, 나머지는 히스토리)
    // Note: Supabase Json type is wider than Assessment['assessment_details'],
    // but runtime data is always a Record object, so the cast is safe.
    const combinedData = [activeAssessment, ...(devData || [])] as Parameters<typeof ParentDevelopmentChart>[0]['assessments'];

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border text-center space-y-4">
                    <p className="font-black text-rose-500">{error}</p>
                    <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-100 rounded-xl font-bold">뒤로가기</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] px-3 py-4 md:p-6">
            <div className="max-w-2xl mx-auto print-container pb-20">
                <div className="flex justify-between items-center mb-6 no-print">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-black text-slate-400">
                        <ArrowLeft className="w-4 h-4" /> 뒤로가기
                    </button>
                    {role === 'parent' && (
                        <button
                            onClick={handleSaveSelfAssessment}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>💾 <span className="hidden md:inline">저장하여 기록 남기기</span><span className="md:hidden">저장</span></span>}
                        </button>
                    )}
                </div>

                <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 mb-4 md:mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">발달 리포트</h2>
                            <p className="text-xs text-slate-500 font-bold">{selectedChildName} 아동 • 인터랙티브 성장 추이</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-6">
                        {/* 차트 영역 - 항상 표시됨 (부모 체크 기반) */}
                        <ParentDevelopmentChart
                            assessments={combinedData}
                            isInteractive={role === 'parent'}
                            onToggleCheck={handleToggleCheck}
                            parentChecks={parentChecks}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
