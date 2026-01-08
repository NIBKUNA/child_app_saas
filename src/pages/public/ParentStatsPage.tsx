// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, BarChart3, Users, ChevronDown } from 'lucide-react';
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

    useEffect(() => {
        initializePage();
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
                .single();

            setRole(profile?.role || 'parent');

            if (profile?.role === 'admin') {
                // ✨ 관리자라면: 전체 아동 목록 가져오기
                const { data: childList } = await supabase.from('children').select('id, name');
                setChildren(childList || []);

                if (childList && childList.length > 0) {
                    setSelectedChildId(childList[0].id);
                    await loadChildStats(childList[0].id);
                }
            } else if (profile?.child_id) {
                // ✨ 부모님이라면: 내 아이 정보 즉시 로드
                setSelectedChildId(profile.child_id);
                await loadChildStats(profile.child_id);
            } else {
                setError("연결된 아이 정보가 없습니다.");
            }
        } catch (e) {
            setError("초기화 중 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    const loadChildStats = async (childId: string) => {
        if (!childId) return;
        const { data } = await supabase
            .from('consultations')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        setDevData(data || null);
    };

    const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedChildId(id);
        loadChildStats(id);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6">
            <div className="max-w-2xl mx-auto">
                {/* 상단 네비게이션 */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 font-black text-slate-400">
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
                            <p className="text-xs text-slate-500 font-bold">성장 지표를 확인하세요.</p>
                        </div>
                    </div>

                    {/* ✨ 관리자용 아동 선택 셀렉트박스 */}
                    {role === 'admin' && (
                        <div className="relative">
                            <select
                                value={selectedChildId}
                                onChange={handleChildChange}
                                className="appearance-none pl-10 pr-10 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none ring-2 ring-primary/5 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>{child.name} 아동</option>
                                ))}
                            </select>
                            <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* 그래프 출력 영역 */}
                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : devData ? (
                    <ParentDevelopmentChart scores={devData} lastDate={devData.created_at?.split('T')[0]} />
                ) : (
                    <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-black">해당 아동은 기록된 점수가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}