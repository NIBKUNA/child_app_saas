// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 부모님 발달 리포트 - 인쇄하기 기능 추가
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, BarChart3, Users, ChevronDown, Printer } from 'lucide-react';
import { ParentDevelopmentChart } from '@/components/app/parent/ParentDevelopmentChart';



export function ParentStatsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [devData, setDevData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string>('parent');

    // 관리자용 상태
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildName, setSelectedChildName] = useState<string>('');

    useEffect(() => {
        initializePage();
        return () => { };
    }, []);

    const initializePage = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return setError("로그인이 필요합니다.");

            const { data: profile } = await supabase
                .from('profiles')  // ✨ user_profiles -> profiles
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            setRole(profile?.role || 'parent');

            // ✨ 관리자 또는 슈퍼 어드민이라면: 전체 아동 목록 가져오기
            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                const { data: childList } = await supabase.from('children').select('id, name');
                setChildren(childList || []);

                if (childList && childList.length > 0) {
                    setSelectedChildId(childList[0].id);
                    setSelectedChildName(childList[0].name);
                    await loadChildStats(childList[0].id);
                }
            } else {
                // ✨ [FIX] 부모님: family_relationships 통해 연결된 자녀 조회
                let childId = null;

                // 1. children.parent_id로 직접 연결된 자녀 체크
                const { data: directChild } = await supabase
                    .from('children')
                    .select('id, name')
                    .eq('parent_id', user.id)
                    .maybeSingle();

                if (directChild) {
                    childId = directChild.id;
                    setSelectedChildName(directChild.name || '아동');
                } else {
                    // 2. family_relationships 테이블에서 체크
                    const { data: relationship } = await supabase
                        .from('family_relationships')
                        .select('child_id')
                        .eq('parent_id', user.id)
                        .maybeSingle();

                    if (relationship?.child_id) {
                        const { data: childData } = await supabase.from('children').select('id, name').eq('id', relationship.child_id).single();
                        childId = childData?.id;
                        setSelectedChildName(childData?.name || '아동');
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
            .limit(6); // 최근 6개월 데이터

        setDevData(data || []);
    };

    const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const child = children.find(c => c.id === id);
        setSelectedChildId(id);
        setSelectedChildName(child?.name || '');
        loadChildStats(id);
    };



    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6">
            <div className="max-w-2xl mx-auto print-container">
                {/* 상단 네비게이션 - 인쇄시 숨김 */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 font-black text-slate-400 no-print">
                    <ArrowLeft className="w-4 h-4" /> 뒤로가기
                </button>

                {/* 헤더 섹션 */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">발달 리포트</h2>
                            <p className="text-xs text-slate-500 font-bold">{selectedChildName} 아동 • 성장 지표 확인</p>
                        </div>
                    </div>
                </div>

                {/* ✨ 관리자용 아동 선택 셀렉트박스 - 인쇄시 숨김 */}
                {(role === 'admin' || role === 'super_admin') && (
                    <div className="relative mb-6 no-print">
                        <select
                            value={selectedChildId}
                            onChange={handleChildChange}
                            className="appearance-none w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none ring-2 ring-primary/5 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            {children.map(child => (
                                <option key={child.id} value={child.id}>{child.name} 아동</option>
                            ))}
                        </select>
                        <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                )}

                {/* 그래프 출력 영역 */}
                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    <ParentDevelopmentChart assessments={devData} />
                )}
            </div>
        </div>
    );
}
