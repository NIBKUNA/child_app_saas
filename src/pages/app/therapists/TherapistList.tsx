// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Modified by: Gemini AI (for An Uk-bin)
 * 📅 Date: 2026-01-13
 * 🖋️ Description: "UPSERT 로직 도입으로 데이터 자동 생성 및 권한 강제 동기화"
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import {
    Plus, Search, Phone, Mail, Edit2, X, Check,
    Shield, Stethoscope, UserCog, UserCheck, AlertCircle, UserMinus, Lock, RotateCcw, Trash2, Archive, ArchiveRestore
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isSuperAdmin, SUPER_ADMIN_EMAILS } from '@/config/superAdmin';
import { Helmet } from 'react-helmet-async';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#64748b', '#71717a'
];

export function TherapistList() {
    const { user } = useAuth();
    const { center } = useCenter(); // ✨ Use Center Context
    const centerId = center?.id;
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState<'active' | 'retired'>('active');

    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', hire_type: 'freelancer',
        system_role: 'therapist', remarks: '', color: '#3b82f6',
        bank_name: '', account_number: '', account_holder: '',
        bio: '', career: '', specialties: '', profile_image: '', website_visible: true
    });

    // ✨ [New] Success Modal State
    const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string }>({
        open: false, title: '', message: ''
    });

    useEffect(() => {
        if (centerId) fetchStaffs();
    }, [centerId]);

    const fetchStaffs = async () => {
        setLoading(true);
        try {
            const superAdminList = `("${SUPER_ADMIN_EMAILS.join('","')}")`;

            // 1. [Profiles First] 이 센터 소속의 모든 유저 프로필 조회
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('center_id', centerId)
                .filter('email', 'not.in', superAdminList);

            // 2. [Therapists Second] 상세 정보(은행, 연락처 등) 조회
            const { data: therapistData } = await supabase
                .from('therapists')
                .select('*')
                .eq('center_id', centerId);

            // 3. [Merge] 프로필 기준으로 합치기 (치료사 정보가 없어도 프로필이 있으면 노출)
            const mergedData = profileData?.map(p => {
                const detail = therapistData?.find(t => t.email === p.email);

                return {
                    userId: p.id,
                    id: detail?.id || p.id,
                    email: p.email,
                    ...detail, // 최신 상세 정보(색상 등)를 뒤에 배치하여 덮어씌우기
                    name: p.name || detail?.name, // 프로필 이름 우선
                    system_role: p.role,
                    system_status: p.status,
                    center_id: p.center_id,
                    hire_type: detail?.hire_type || (p.role === 'admin' ? 'fulltime' : 'freelancer')
                };
            }).filter(u => u.system_role !== 'parent' && !isSuperAdmin(u.email));

            setStaffs(mergedData || []);

        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!editingId) {
                // ✨ [New Registration] Use Edge Function for Secure Invitation
                const { data, error } = await supabase.functions.invoke('invite-user', {
                    body: {
                        email: formData.email,
                        name: formData.name,
                        role: formData.system_role,
                        hire_type: formData.hire_type,
                        color: formData.color,
                        bank_name: formData.bank_name,
                        account_number: formData.account_number,
                        account_holder: formData.account_holder,
                        center_id: centerId,
                        redirectTo: `${window.location.origin}/auth/update-password`
                    }
                });

                if (error) throw error;
                if (data && data.error) throw new Error(data.error);

                // ✨ Show Custom Success Modal instead of Alert
                setSuccessModal({
                    open: true,
                    title: '초대장 발송 완료!',
                    message: `${formData.name}님에게 이메일 초대가 발송되었습니다.\n수신함에서 스팸 메일함도 꼭 확인해주세요.`
                });
            } else {
                // ✨ [Edit Mode] Direct Update (As Admin)
                const { error: therapistError } = await supabase
                    .from('therapists')
                    .upsert({
                        email: formData.email,
                        name: formData.name,
                        hire_type: formData.hire_type,
                        color: formData.color,
                        bank_name: formData.bank_name,
                        account_holder: formData.account_holder,
                        system_role: formData.system_role,
                        system_status: 'active', // Ensure they are active
                        center_id: centerId,
                        bio: formData.bio,
                        career: formData.career,
                        specialties: formData.specialties,
                        profile_image: formData.profile_image,
                        website_visible: formData.website_visible
                    }, { onConflict: 'email' });

                if (therapistError) throw therapistError;

                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update({
                        name: formData.name,
                        role: formData.system_role
                    })
                    .eq('email', formData.email);

                if (profileError) throw profileError;

                setSuccessModal({
                    open: true,
                    title: '정보 수정 완료',
                    message: `${formData.name}님의 정보가 성공적으로 업데이트되었습니다.`
                });

                fetchStaffs();
                setIsModalOpen(false);
            }

        } catch (error) {
            console.error(error);
            alert('❌ 처리 실패: ' + (error.message || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (staff: any) => {
        const isRetired = staff.system_status === 'retired';
        const newStatus = isRetired ? 'active' : 'retired';
        const message = isRetired
            ? `${staff.name}님을 다시 근무중으로 복귀시키겠습니까?`
            : `${staff.name}님을 퇴사 처리하시겠습니까? (계정은 유지되며 보관됩니다)`;

        if (!confirm(message)) return;

        try {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ status: newStatus })
                .eq('email', staff.email);

            await supabase
                .from('therapists')
                .update({ system_status: newStatus })
                .eq('email', staff.email);

            if (profileError && !staff.userId) {
                // Ignore profile error if user doesn't exist yet
            } else if (profileError) {
                throw profileError;
            }

            alert('상태가 변경되었습니다.');
            fetchStaffs();
        } catch (error) {
            console.error(error);
            alert('상태 변경 실패');
        }
    };

    const handleHardReset = async (staff: any) => {
        const confirmMsg = `[⚠️ 중대 경고]\n\n${staff.name} 치료사 정보를 완전히 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 급여 기록 및 배정된 일정이 사라질 수 있습니다.`;
        if (!confirm(confirmMsg)) return;

        const doubleCheck = prompt(`삭제를 원하시면 다음 문구를 똑같이 입력하세요:\n\n${staff.email}`);
        if (doubleCheck !== staff.email) {
            alert('이메일이 일치하지 않아 취소합니다.');
            return;
        }

        try {
            if (staff.userId) {
                const { error } = await supabase.rpc('admin_delete_user', { target_user_id: staff.userId });
                if (error) throw error;
            } else {
                await supabase.from('therapists').delete().eq('id', staff.id);
            }

            alert('영구 삭제되었습니다.');
            fetchStaffs();
        } catch (error) {
            console.error(error);
            alert('삭제 실패: ' + (error as any).message);
        }
    };

    const handleEdit = (staff) => {
        setEditingId(staff.id);
        setFormData({
            name: staff.name,
            contact: staff.contact || '',
            email: staff.email || '',
            hire_type: staff.hire_type || 'freelancer',
            system_role: staff.system_role || 'therapist',
            remarks: staff.remarks || '',
            color: staff.color || '#3b82f6',
            bank_name: staff.bank_name || '',
            account_number: staff.account_number || '',
            account_holder: staff.account_holder || '',
            base_salary: staff.base_salary || 0,
            required_sessions: staff.required_sessions || 0,
            session_price_weekday: staff.session_price_weekday || 0,
            session_price_weekend: staff.session_price_weekend || 0,
            incentive_price: staff.incentive_price || 24000,
            evaluation_price: staff.evaluation_price || 50000,
            bio: staff.bio || '',
            career: staff.career || '',
            specialties: staff.specialties || '',
            profile_image: staff.profile_image || '',
            website_visible: staff.website_visible !== false // Default true for active
        });
        setIsModalOpen(true);
    };

    const filteredStaffs = staffs.filter(s => {
        if (viewMode === 'active') return s.system_status !== 'retired' && s.system_status !== 'rejected';
        if (viewMode === 'retired') return s.system_status === 'retired';
        return false;
    }).filter(s => s.name.includes(searchTerm));

    const isSuper = isSuperAdmin(user?.email);

    return (
        <div className="space-y-6 pb-20 p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            <Helmet><title>직원 관리 - 자라다</title></Helmet>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">직원 및 권한 관리</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">
                        {viewMode === 'active' ? '현재 근무 중인 직원 목록입니다.' : '퇴사 처리된 직원 보관소입니다.'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
                        <button
                            onClick={() => setViewMode('active')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                                viewMode === 'active' ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            근무중
                        </button>
                        <button
                            onClick={() => setViewMode('retired')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2",
                                viewMode === 'retired' ? "bg-rose-100 text-rose-600 shadow-md" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Archive className="w-4 h-4" />
                            퇴사자 창고
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                name: '', contact: '', email: '', hire_type: 'freelancer',
                                system_role: 'therapist', // Default
                                system_status: 'active',
                                remarks: '', color: '#3b82f6',
                                bank_name: '', account_number: '', account_holder: '',
                                base_salary: 0, required_sessions: 0, session_price_weekday: 0, session_price_weekend: 0, incentive_price: 24000, evaluation_price: 50000,
                                bio: '', career: '', specialties: '', profile_image: '', website_visible: true
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    >
                        <Plus className="w-5 h-5" /> 치료사 등록
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                name: '', contact: '', email: '', hire_type: 'fulltime',
                                system_role: 'admin', // Auto-set Admin
                                system_status: 'active',
                                remarks: '', color: '#ef4444', // Red for Admin
                                bank_name: '', account_number: '', account_holder: '',
                                base_salary: 0, required_sessions: 0, session_price_weekday: 0, session_price_weekend: 0, incentive_price: 0, evaluation_price: 0
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-rose-100 text-rose-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-rose-200 border border-rose-200"
                    >
                        <Shield className="w-5 h-5" /> 관리자 등록
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                name: '', contact: '', email: '', hire_type: 'parttime',
                                system_role: 'staff',
                                system_status: 'active',
                                remarks: '', color: '#f59e0b',
                                bank_name: '', account_number: '', account_holder: '',
                                base_salary: 0, required_sessions: 0, session_price_weekday: 0, session_price_weekend: 0, incentive_price: 0, evaluation_price: 0
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-amber-100 text-amber-700 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-amber-200 border border-amber-200"
                    >
                        <UserCog className="w-5 h-5" /> 행정직원 등록
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStaffs.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-40">
                        <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4 text-3xl">📭</div>
                        <p className="text-xl font-bold text-slate-400">해당 목록에 직원이 없습니다.</p>
                    </div>
                )}

                {filteredStaffs.map((staff) => (
                    <div key={staff.id} className={cn(
                        "bg-white dark:bg-slate-900 p-6 rounded-[32px] border transition-all hover:shadow-xl group",
                        staff.system_status === 'retired' ? "border-rose-100 bg-rose-50/30 dark:bg-rose-900/10 dark:border-rose-900/50" : "border-slate-100 dark:border-slate-800 shadow-sm"
                    )}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg transform group-hover:scale-110 transition-transform" style={{ backgroundColor: staff.system_status === 'retired' ? '#94a3b8' : staff.color }}>
                                    {staff.name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                        {staff.name}
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border",
                                            staff.system_status === 'retired' ? "bg-slate-200 text-slate-500 border-slate-300" :
                                                staff.system_role === 'admin' ? "bg-rose-100 text-rose-600 border-rose-200" :
                                                    "bg-emerald-100 text-emerald-600 border-emerald-200"
                                        )}>
                                            {staff.system_status === 'retired' ? 'RETIRED' : (
                                                { 'admin': 'ADMIN', 'staff': 'STAFF' }[staff.system_role] || 'THERAPIST'
                                            )}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {staff.email}</p>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                {staff.system_status !== 'retired' && (
                                    <button onClick={() => handleEdit(staff)} className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
                                )}
                                <button onClick={() => handleToggleStatus(staff)}
                                    className={cn("p-2.5 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95",
                                        staff.system_status === 'retired' ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-rose-50 text-rose-400 hover:bg-rose-100")}>
                                    {staff.system_status === 'retired' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                </button>
                                {isSuper && staff.system_status === 'retired' && (
                                    <button
                                        onClick={() => handleHardReset(staff)}
                                        className="p-2.5 rounded-xl bg-slate-900 text-red-500 hover:bg-black transition-all shadow-md ml-1"
                                        title="[Super Admin] 영구 삭제 및 리셋"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                {editingId
                                    ? ({ 'admin': '관리자 정보 수정', 'staff': '행정직원 정보 수정' }[formData.system_role] || '치료사 정보 수정')
                                    : ({ 'admin': '새 관리자 등록', 'staff': '새 행정직원 등록' }[formData.system_role] || '새 치료사 등록')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">이름</label>
                                        <input required
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="실명 입력"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">이메일 (계정 연동)</label>
                                        <input type="email" required
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all disabled:opacity-50 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="sample@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            disabled={!!editingId}
                                        />
                                        <p className="text-[11px] text-slate-400 font-medium px-1">⚠️ 이 주소로 초대 메일이 발송됩니다.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">고용 형태</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
                                                value={formData.hire_type}
                                                onChange={e => setFormData({ ...formData, hire_type: e.target.value })}
                                            >
                                                <option value="fulltime">💼 정규직 (Full-Time)</option>
                                                <option value="freelancer">🦄 프리랜서 (Freelancer)</option>
                                                <option value="parttime">⏱️ 파트타임 (Part-Time)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">부여 권한 (System Role)</label>
                                        <input
                                            readOnly
                                            className={cn(
                                                "w-full px-5 py-3.5 border rounded-2xl font-black outline-none transition-all cursor-not-allowed",
                                                formData.system_role === 'admin'
                                                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-400"
                                                    : "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-900/50 dark:text-indigo-400"
                                            )}
                                            value={
                                                {
                                                    'admin': '🛡️ 관리자 (Admin)',
                                                    'staff': '💼 행정직원 (Staff)',
                                                    'therapist': '🩺 치료사 (Therapist)'
                                                }[formData.system_role] || '🩺 치료사 (Therapist)'
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">프로필 색상</label>
                                    <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl justify-center">
                                        {COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={cn(
                                                    "w-9 h-9 rounded-full transition-all hover:scale-110",
                                                    formData.color === c && "scale-110 ring-4 ring-slate-200 shadow-xl"
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                            <span className="text-lg">💰</span>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">정산 계좌 정보</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 ml-1">은행명</label>
                                            <input
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                                placeholder="예: 국민"
                                                value={formData.bank_name || ''}
                                                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[11px] font-bold text-slate-400 ml-1">계좌번호</label>
                                            <input
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                                                placeholder="000-0000-0000"
                                                value={formData.account_number || ''}
                                                onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-3">
                                            <label className="text-[11px] font-bold text-slate-400 ml-1">예금주</label>
                                            <input
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                                placeholder="본인 명의가 아닐 경우 입력"
                                                value={formData.account_holder || ''}
                                                onChange={e => setFormData({ ...formData, account_holder: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ✨ Public Profile Section */}
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-900/50 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                <span className="text-lg">🌍</span>
                                            </div>
                                            <h3 className="text-sm font-black text-indigo-700 dark:text-indigo-400">웹사이트 프로필 설정</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">홈페이지 노출</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, website_visible: !formData.website_visible })}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative",
                                                    formData.website_visible ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                    formData.website_visible ? "left-6" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="shrink-0">
                                                <div className="w-20 h-28 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-sm group">
                                                    {formData.profile_image ? (
                                                        <img src={formData.profile_image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Plus className="w-6 h-6 text-slate-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-slate-400 ml-1">한줄 프로필 (Bio)</label>
                                                    <input
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                                        placeholder="예: 아이들의 꿈을 디자인합니다."
                                                        value={formData.bio || ''}
                                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-slate-400 ml-1">전문 분야 (Specialties)</label>
                                                    <input
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                                        placeholder="예: 언어치료, 인지치료"
                                                        value={formData.specialties || ''}
                                                        onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-400 ml-1">상세 약력 (Career)</label>
                                            <textarea
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white min-h-[100px] placeholder:text-slate-400"
                                                placeholder="한 줄에 하나씩 입력해주세요.&#10;- OO대학교 언어치료 전공&#10;- OO센터 수석 연구원"
                                                value={formData.career || ''}
                                                onChange={e => setFormData({ ...formData, career: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-400 ml-1">프로필 이미지 URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs outline-none focus:border-indigo-500 transition-all text-slate-500 dark:text-slate-400"
                                                    placeholder="https://..."
                                                    value={formData.profile_image || ''}
                                                    onChange={e => setFormData({ ...formData, profile_image: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const url = prompt('이미지 URL을 입력하시거나, 이미지를 업로드 후 URL을 붙여넣어주세요.');
                                                        if (url) setFormData({ ...formData, profile_image: url });
                                                    }}
                                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold"
                                                >
                                                    URL 입력
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.02] transition-all mt-4">
                                {editingId ? '변경사항 저장하기' : '직원 등록 완료'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ✨ Success Modal */}
            <AnimatePresence>
                {successModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-10 shadow-2xl text-center border border-white/20"
                        >
                            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="absolute inset-0 bg-emerald-100 dark:bg-emerald-800/20 rounded-full animate-ping"
                                    style={{ animationDuration: '3s' }}
                                />
                                <Check className="w-12 h-12 text-emerald-600 dark:text-emerald-400 relative z-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                {successModal.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold whitespace-pre-line mb-10 leading-relaxed">
                                {successModal.message}
                            </p>
                            <button
                                onClick={() => {
                                    setSuccessModal({ ...successModal, open: false });
                                    if (!editingId) setIsModalOpen(false);
                                    fetchStaffs();
                                }}
                                className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                                확인했습니다
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}