// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 부모님 발달 리포트 - 인터랙티브 체크 및 저장 추이 기능
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, BarChart3, Users, ChevronDown, Printer } from 'lucide-react';
import { ParentDevelopmentChart } from '@/components/app/parent/ParentDevelopmentChart';
import { useCenter } from '@/contexts/CenterContext';

export function ParentStatsPage() {
    const navigate = useNavigate();
    const { center } = useCenter();
    const [loading, setLoading] = useState(true);
    const [devData, setDevData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string>('parent');

    // 관리자용 상태
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildName, setSelectedChildName] = useState<string>('');
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

            // ✨ user_profiles 테이블에서 역할 확인 (parents 테이블과 별개)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            setRole(profile?.role || 'parent');

            if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'manager') {
                if (!center?.id) { setLoading(false); return; }
                const { data: childList } = await supabase.from('children').select('id, name').eq('center_id', center.id);
                setChildren(childList || []);
                if (childList?.[0]) {
                    setSelectedChildId(childList[0].id);
                    setSelectedChildName(childList[0].name);
                    await loadChildStats(childList[0].id);
                }
            } else {
                // 부모 권한일 때 연결된 자녀 찾기
                let childId = null;
                const { data: parentRecord } = await supabase.from('parents').select('id').eq('profile_id', user.id).maybeSingle();
                if (parentRecord) {
                    const { data: directChild } = await supabase.from('children').select('id, name').eq('parent_id', (parentRecord as any).id).maybeSingle();
                    if (directChild) {
                        childId = (directChild as any).id;
                        setSelectedChildName((directChild as any).name);
                    }
                }
                if (!childId) {
                    const { data: rel } = await supabase.from('family_relationships').select('child_id, children(name)').eq('parent_id', user.id).maybeSingle();
                    if (rel) {
                        childId = (rel as any).child_id;
                        setSelectedChildName((rel as any).children?.name);
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

    const loadChildStats = async (childId: string) => {
        if (!childId) return;
        const { data } = await supabase
            .from('development_assessments')
            .select('*')
            .eq('child_id', childId)
            .order('evaluation_date', { ascending: false })
            .limit(10); // 추이 확인을 위해 10개까지 로드

        setDevData(data || []);

        // ✨ 최신 리포트의 체크 항목을 부모 체크 상태로 초기화 (로드 시점)
        if (data && data[0]) {
            const latestDetails = data[0].assessment_details || {};
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

            const payload = {
                center_id: center.id,
                child_id: selectedChildId,
                evaluation_date: new Date().toISOString().split('T')[0],
                score_communication: (parentChecks.communication?.length || 0),
                score_social: (parentChecks.social?.length || 0),
                score_cognitive: (parentChecks.cognitive?.length || 0),
                score_motor: (parentChecks.motor?.length || 0),
                score_adaptive: (parentChecks.adaptive?.length || 0),
                assessment_details: parentChecks,
                summary: '부모님 자가진단 기록',
                therapist_notes: '부모님이 앱에서 직접 체크하여 저장한 발달 데이터입니다. 상담 시 참고하세요.'
            };

            const { error } = await supabase.from('development_assessments').insert(payload);
            if (error) throw error;

            alert("✅ 자가진단 결과가 성공적으로 저장되었습니다.\n성장 추이 그래프에서 변화를 확인해보세요!");
            await loadChildStats(selectedChildId);
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
    const combinedData = [activeAssessment, ...(devData || [])];

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
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
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
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '💾 저장하여 기록 남기기'}
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
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

                        {/* 상담 준비 가이드 */}
                        {role === 'parent' && (
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>

                                <div className="relative z-10">
                                    <h3 className="text-lg font-black mb-3 flex items-center gap-2">
                                        💡 상담 준비 팁
                                    </h3>
                                    <p className="text-sm opacity-95 font-medium leading-relaxed mb-4">
                                        상단의 <strong>'상세 평가 근거'</strong> 탭에서 아이가 현재 할 수 있는 항목들을 체크해 보세요.
                                        우측 상단의 <strong>[저장하여 기록 남기기]</strong> 버튼을 누르면 오늘의 체크 결과가 누적되어 우리 아이의 성장 그래프를 만들 수 있습니다.
                                    </p>
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                                        <p className="text-[11px] font-bold leading-relaxed">
                                            🌟 이렇게 활용해 보세요!<br />
                                            체크된 리스트를 보며 "집에서는 이런 행동을 보이는데 센터에서는 어떤가요?" 라고 치료사 선생님과 상담 시 질문해 보세요. 더욱 풍성한 상담이 가능해집니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
