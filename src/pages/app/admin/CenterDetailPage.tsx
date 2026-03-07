import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, Users, Baby, ArrowLeft, MoreHorizontal, ExternalLink, Pencil, Save, ShieldAlert, X, Trash2, Globe } from 'lucide-react';
import { useCenter } from '@/contexts/CenterContext';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Center = Database['public']['Tables']['centers']['Row'];

export function CenterDetailPage() {
    const { centerId } = useParams();
    const navigate = useNavigate();
    const { setCenter } = useCenter();
    const { user, role, loading: authLoading } = useAuth();
    const [centerData, setCenterData] = useState<Center | null>(null);
    const [stats, setStats] = useState({ teachers: 0, children: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ✨ Super Admin Security Check
    const isSuper = role === 'super_admin' || checkSuperAdmin(user?.email);

    useEffect(() => {
        if (!authLoading && !isSuper) {
            alert('접근 권한이 없습니다. (Super Admin Only)');
            navigate('/');
        }
    }, [authLoading, isSuper, navigate]);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        slug: '',
        is_active: true,
        address: '',
        phone: '',
        business_number: '',
        email: '',
        custom_domain: ''
    });

    useEffect(() => {
        if (centerId) {
            fetchCenterDetails();
        }
    }, [centerId]);

    const fetchCenterDetails = async () => {
        try {
            const { data, error: centerError } = await supabase
                .from('centers')
                .select('*')
                .eq('id', centerId as string)
                .single();

            if (centerError) throw centerError;

            const { count: teacherCount } = await supabase
                .from('user_profiles')
                .select('id', { count: 'exact', head: true })
                .eq('center_id', centerId as string)
                .in('role', ['therapist', 'manager', 'admin']);


            // ✨ [FIX] active 아동만 카운트 (status='active' 또는 null)
            const { data: childrenData } = await supabase
                .from('children')
                .select('status')
                .eq('center_id', centerId as string);
            const childCount = (childrenData || []).filter((c: any) =>
                c.status === 'active' || !c.status
            ).length;

            setCenterData(data);
            setEditForm({
                name: data.name || '',
                slug: data.slug || '',
                is_active: data.is_active ?? true,
                address: data.address || '',
                phone: data.phone || '',
                business_number: data.business_number || '',
                email: data.email || '',
                custom_domain: data.custom_domain || ''
            });
            setStats({ teachers: teacherCount || 0, children: childCount || 0 });
        } catch (error) {
            console.error('Error loading center details:', error);
            alert('센터 정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId || !centerData) return;

        setSaving(true);
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        // ✨ [Robust Comparison] 필드별 변경 사항 정밀 체크
        const hasChanged = (newVal: any, oldVal: any) => {
            const normalizedNew = newVal === '' ? null : newVal;
            const normalizedOld = oldVal === '' ? null : oldVal;
            return normalizedNew !== normalizedOld;
        };

        if (hasChanged(editForm.name, centerData.name)) updateData.name = editForm.name;
        if (hasChanged(editForm.slug, centerData.slug)) updateData.slug = editForm.slug.toLowerCase().trim();
        if (editForm.is_active !== centerData.is_active) updateData.is_active = editForm.is_active;
        if (hasChanged(editForm.address, centerData.address)) updateData.address = editForm.address;
        if (hasChanged(editForm.phone, centerData.phone)) updateData.phone = editForm.phone;
        if (hasChanged(editForm.business_number, centerData.business_number)) updateData.business_number = editForm.business_number;
        if (hasChanged(editForm.email, centerData.email)) updateData.email = editForm.email;
        if (hasChanged(editForm.custom_domain, centerData.custom_domain)) updateData.custom_domain = editForm.custom_domain || null;

        // 변경된 사항이 없으면 바로 종료
        if (Object.keys(updateData).length <= 1) {
            setIsEditModalOpen(false);
            setSaving(false);
            return;
        }

        try {
            // ✨ [FIX] .select() 제거 → UPDATE만 수행하여 RLS SELECT 충돌 방지
            const { error } = await supabase
                .from('centers')
                .update(updateData)
                .eq('id', centerId as string);

            if (error) {
                console.error('❌ Supabase 업데이트 오류:', error);
                // RLS 정책 관련 에러 안내
                if (error.message?.includes('policy') || error.code === '42501') {
                    throw new Error('RLS 권한 오류: centers 테이블의 UPDATE 정책을 확인하세요. FIX_CENTER_UPDATE_RLS.sql을 실행해야 할 수 있습니다.');
                }
                throw error;
            }

            // ✨ [Nuclear Option] 성공 시 즉시 새로고침하여 DB 상태 강제 반영
            alert('✅ 지점 정보가 성공적으로 수정되었습니다. 화면을 갱신합니다.');
            window.location.reload();
        } catch (error: any) {
            console.error('Update Error:', error);
            alert('❌ 수정 실패: ' + (error.message || '알 수 없는 오류'));
        } finally {
            setSaving(false);
        }
    };

    const handleJumpToCenter = () => {
        if (!centerData) return;
        // ✨ [Fix] 전체 centerData 전달 (불완전 객체 방지 — custom_domain 등 누락 문제)
        setCenter(centerData);
        navigate('/app/dashboard');
    };

    if (loading) return <div className="p-8 text-center animate-pulse py-40">상세 정보 로딩 중...</div>;
    if (!centerData) return <div className="p-8 text-center text-slate-500 py-40">센터를 찾을 수 없습니다.</div>;

    return (
        <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto p-4 md:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                    <button
                        onClick={() => navigate('/master/centers')}
                        className="p-2 md:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{centerData.name}</h1>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                                centerData.is_active ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                                {centerData.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold text-xs md:text-sm">센터 ID: <span className="hidden md:inline">{centerData.id}</span><span className="md:hidden">{centerData.id.slice(0, 12)}...</span></p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={async () => {
                            if (!confirm('🚨 경고: 이 지점의 모든 데이터(직원, 아동, 상담 로그, 결제, 파일)를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
                            const confirmSlug = prompt('삭제를 확인하려면 지점 이름 또는 Slug를 입력하세요:', '');
                            if (confirmSlug !== centerData.slug && confirmSlug !== centerData.name) {
                                alert('일치하지 않습니다. 삭제가 취소되었습니다.');
                                return;
                            }
                            try {
                                const { error } = await supabase.rpc('admin_delete_center', { target_center_id: centerId } as any);

                                if (error) throw error;
                                alert('지점이 완전히 삭제되었습니다.');
                                navigate('/master/centers');
                            } catch (e: any) {
                                alert('삭제 실패: ' + e.message);
                            }
                        }}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl md:rounded-2xl font-black hover:bg-rose-100 transition-all active:scale-95 text-xs md:text-sm"
                    >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">지점 영구 폐쇄</span>
                        <span className="md:hidden">폐쇄</span>
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl md:rounded-2xl font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-xs md:text-sm"
                    >
                        <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">지점 정보 수정</span>
                        <span className="md:hidden">수정</span>
                    </button>
                    <button
                        onClick={handleJumpToCenter}
                        className="flex items-center gap-1.5 md:gap-3 px-4 md:px-8 py-2.5 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 text-xs md:text-sm"
                    >
                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">지점 포털 접속하기</span>
                        <span className="md:hidden">접속</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[
                    { label: '등록된 직원(어드민 포함)', value: `${stats.teachers}명`, icon: Users, color: 'indigo' },
                    { label: '등록된 아동', value: `${stats.children}명`, icon: Baby, color: 'amber' },
                    { label: '고유 슬러그', value: centerData.slug || 'slug-none', icon: Building2, color: 'emerald' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-2xl md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 md:gap-6 hover:shadow-lg transition-shadow">
                        <div className={cn(
                            "p-3 md:p-4 rounded-xl md:rounded-2xl",
                            item.color === 'indigo' && "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
                            item.color === 'amber' && "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                            item.color === 'emerald' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                        )}>
                            <item.icon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate max-w-[150px]">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Details Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">센터 관리 정보</h2>
                    {/* ✨ [FIX] onClick 핸들러 추가 - 수정 모달 열기 */}
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        title="센터 정보 수정"
                    >
                        <MoreHorizontal className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">지점 주소</p>
                            <p className="font-bold text-slate-900 dark:text-slate-200 text-xl leading-relaxed">{centerData.address || '미등록'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">대표 연락처</p>
                            <p className="font-bold text-slate-900 dark:text-slate-200 text-xl">{centerData.phone || '미등록'}</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">사업자 번호</p>
                            <p className="font-bold text-slate-900 dark:text-slate-200 text-xl">{centerData.business_number || '미등록'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">공식 이메일</p>
                            <p className="font-bold text-slate-900 dark:text-slate-200 text-xl">{centerData.email || '미등록'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">커스텀 도메인</p>
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-500" />
                                <p className="font-bold text-slate-900 dark:text-slate-200 text-xl">{centerData.custom_domain || '미등록'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Center Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden my-8">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-indigo-500" />

                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">지점 정보 수정</h2>
                                <p className="text-slate-400 font-bold text-sm">지점의 모든 공개 및 운영 정보를 관리합니다.</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCenter} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">센터 이름</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">고유 주소 (Slug)</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                        value={editForm.slug}
                                        onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">지점 주소</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">대표 연락처</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">공식 이메일</label>
                                    <input
                                        type="email"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">사업자 번호</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                        value={editForm.business_number}
                                        onChange={e => setEditForm({ ...editForm, business_number: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">커스텀 도메인</label>
                                    <div className="relative">
                                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="예: jamsil-center.co.kr (http 제외)"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                                            value={editForm.custom_domain}
                                            onChange={e => setEditForm({ ...editForm, custom_domain: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold ml-2">DNS 설정: CNAME → cname.vercel-dns.com / A레코드 → 76.76.21.21 (Vercel에도 도메인 추가 필요)</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">운영 상태</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: true, label: '운영', color: 'emerald' },
                                            { id: false, label: '중지', color: 'rose' }
                                        ].map(opt => (
                                            <button
                                                key={String(opt.id)}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, is_active: opt.id })}
                                                className={cn(
                                                    "flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2",
                                                    editForm.is_active === opt.id
                                                        ? opt.id
                                                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30"
                                                            : "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/30"
                                                        : "bg-slate-50 border-transparent text-slate-400 dark:bg-slate-800"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {editForm.slug !== centerData.slug && (
                                <div className="flex gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                                    <p className="text-xs text-rose-700 dark:text-rose-400 font-bold leading-relaxed">
                                        주의: 고유 주소(Slug)를 변경하면 기존 홈페이지 링크가 끊어집니다. 신중하게 결정하세요.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl font-black text-xl transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-slate-200 dark:shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-6 h-6" /> 변경사항 저장
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
