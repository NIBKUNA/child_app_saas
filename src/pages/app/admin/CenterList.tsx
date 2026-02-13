import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, Plus, MapPin, X, Globe, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';
import type { Database } from '@/types/database.types';

type Center = Database['public']['Tables']['centers']['Row'];

export function CenterList() {
    const { user, role, loading: authLoading } = useAuth();
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCenter, setNewCenter] = useState({ name: '', slug: '', custom_domain: '' });
    const navigate = useNavigate();

    // ✨ Super Admin Security Check
    const isSuper = role === 'super_admin' || checkSuperAdmin(user?.email);

    useEffect(() => {
        if (!authLoading && !isSuper) {
            alert('접근 권한이 없습니다. (Super Admin Only)');
            navigate('/');
        }
    }, [authLoading, isSuper, navigate]);

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchCenters = async () => {
        try {
            const { data, error } = await supabase
                .from('centers')
                .select('*')
                .order('name');

            if (error) throw error;
            setCenters(data || []);
        } catch (error) {
            console.error('Error fetching centers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalSlug = newCenter.slug.toLowerCase().trim().replace(/\s+/g, '-');
        if (!newCenter.name || !finalSlug) {
            alert('센터 이름과 Slug를 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            // 1. Create Center
            const { data: _centerData, error: centerError } = await supabase
                .from('centers')
                .insert({
                    name: newCenter.name,
                    slug: finalSlug,
                    custom_domain: newCenter.custom_domain || null,
                    is_active: true
                } as any) // ✨ Temporarily using any to bypass the strange inference issue while maintaining schema sync
                .select()
                .single();

            if (centerError) {
                if (centerError.code === '42501') throw new Error('데이터베이스 권한이 없습니다. 슈퍼 어드민 계정인지 확인해주세요.');
                if (centerError.code === '23505') throw new Error('이미 존재하는 Slug입니다. 다른 주소를 입력해주세요.');
                throw centerError;
            }

            alert('✅ 새로운 센터가 등록되었습니다!');
            setIsCreateModalOpen(false);
            setNewCenter({ name: '', slug: '', custom_domain: '' });
            fetchCenters(); // Refresh list
        } catch (error: any) {
            console.error('Create Error:', error);
            alert('❌ 센터 등록 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            <Helmet>
                <title>Zarada - 전체 센터 관리</title>
            </Helmet>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6 md:pb-8">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">전체 센터 관리</h1>
                    <p className="text-sm md:text-base text-slate-500 font-bold mt-1 md:mt-2">Zarada Multi-Center SaaS Control Tower</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5 md:w-6 md:h-6" /> 새 지점 개설
                </button>
            </div>

            <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {centers.map((center) => (
                    <div
                        key={center.id}
                        onClick={() => navigate(`/master/centers/${center.id}`)}
                        className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-2xl md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10">
                            <div className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl md:rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                <Building2 className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={cn(
                                    "text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider mb-2",
                                    center.is_active ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                )}>
                                    {center.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>

                                <span className="text-[10px] font-bold text-slate-400">
                                    ID: {center.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-3 md:mb-4 line-clamp-1">{center.name}</h3>

                        <div className="space-y-3 md:space-y-4 text-xs md:text-sm text-slate-500 font-bold mb-4 md:mb-6">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span className="text-indigo-600 truncate">/centers/{center.slug}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-300 shrink-0" />
                                <span className="line-clamp-1">{center.address || '주소 정보 없음'}</span>
                            </div>
                        </div>

                        <div className="pt-4 md:pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" />
                                ))}
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-50 text-[10px] font-bold flex items-center justify-center text-indigo-600">+12</div>
                            </div>
                            <span className="text-xs md:text-sm font-black text-indigo-600 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                DETAILS →
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Center Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl p-6 md:p-10 rounded-3xl md:rounded-[50px] shadow-2xl space-y-6 md:space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-blue-500" />

                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">새 지점 개설</h2>
                                <p className="text-slate-400 font-bold text-xs md:text-sm">새로운 센터의 기본 정보를 입력하세요.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2.5 md:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCenter} className="space-y-5 md:space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">센터 공식 명칭</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="예: 자라다 아동발달센터 잠실점"
                                        className="w-full px-4 md:px-6 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl md:rounded-3xl font-bold text-base md:text-lg outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 transition-all"
                                        value={newCenter.name}
                                        onChange={e => setNewCenter({ ...newCenter, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">고유 주소 (Slug)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm md:text-base">/centers/</div>
                                        <input
                                            required
                                            type="text"
                                            placeholder="jamsil"
                                            className="w-full pl-24 md:pl-28 pr-4 md:pr-6 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl md:rounded-3xl font-bold text-base md:text-lg outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 transition-all"
                                            value={newCenter.slug}
                                            onChange={e => setNewCenter({ ...newCenter, slug: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">커스텀 도메인 (선택)</label>
                                    <input
                                        type="text"
                                        placeholder="예: jamsil-center.co.kr (http 제외)"
                                        className="w-full px-4 md:px-6 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl md:rounded-3xl font-bold text-base md:text-lg outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 transition-all"
                                        value={newCenter.custom_domain}
                                        onChange={e => setNewCenter({ ...newCenter, custom_domain: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold ml-2">입력하지 않으면 기본 도메인만 사용합니다.</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 md:py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-xl shadow-slate-200 dark:shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 md:w-6 md:h-6" /> 지점 생성하기
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
