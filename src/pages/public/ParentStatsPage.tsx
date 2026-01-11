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

// ✨ [Print CSS] 인쇄 전용 스타일
const printStyles = `
@media print {
    .no-print {
        display: none !important;
    }
    body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    .print-container {
        max-width: 100% !important;
        padding: 0 !important;
    }
}
`;

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
        // Inject print styles
        const style = document.createElement('style');
        style.innerHTML = printStyles;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const initializePage = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return setError("로그인이 필요합니다.");

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role, child_id')
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
            } else if (profile?.child_id) {
                // ✨ 부모님이라면: 내 아이 정보 즉시 로드
                setSelectedChildId(profile.child_id);
                // Get child name
                const { data: childData } = await supabase.from('children').select('name').eq('id', profile.child_id).single();
                setSelectedChildName(childData?.name || '아동');
                await loadChildStats(profile.child_id);
            } else {
                setError("연결된 아이 정보가 없습니다.");
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

    // ✨ [Print] 인쇄하기 버튼 클릭
    const handlePrint = () => {
        window.print();
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

                    {/* 인쇄하기 버튼 */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-2xl transition-colors no-print"
                    >
                        <Printer className="w-4 h-4" />
                        인쇄하기
                    </button>
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
