
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
    Plus, Mail, Edit2, X, Check,
    Shield, UserCog, Trash2, Archive, ArchiveRestore
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isSuperAdmin } from '@/config/superAdmin';
import { Helmet } from 'react-helmet-async';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#64748b', '#71717a'
];

// ✨ 고용 형태 타입
export type HireType = 'freelancer' | 'fulltime' | 'parttime' | 'regular';

// ✨ 시스템 역할 타입 (단순화: admin, manager, therapist)
export type SystemRole = 'therapist' | 'manager' | 'admin' | 'parent' | 'super_admin';

// ✨ 시스템 상태 타입 (active: 근무중, retired: 퇴사, rejected: 승인거절)
export type SystemStatus = 'active' | 'retired' | 'rejected';

// ✨ 치료사/직원 데이터 인터페이스 (정산 및 스케줄 모듈과 호환)
export interface Therapist {
    id: string;
    name: string;
    email: string;
    contact: string | null;
    hire_type: HireType;
    system_role: SystemRole;
    system_status: SystemStatus;
    center_id: string;
    color: string;
    remarks: string | null;

    // 정산 정보
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    base_salary: number;
    required_sessions: number;
    session_price_weekday: number;
    session_price_weekend: number;
    incentive_price: number;
    evaluation_price: number;

    // 프로필 정보 (선택)
    userId?: string | null;   // user_profiles 연결 ID
    profile_image?: string | null;
    bio?: string | null;
    career?: string | null;
    specialties?: string | null;
    website_visible?: boolean;
}

// ✨ 폼 데이터 타입
interface TherapistFormData {
    name: string;
    contact: string;
    email: string;
    hire_type: HireType;
    system_role: SystemRole;
    system_status: SystemStatus;
    remarks: string;
    color: string;
    bank_name: string;
    account_number: string;
    account_holder: string;
    base_salary: number;
    required_sessions: number;
    session_price_weekday: number;
    session_price_weekend: number;
    incentive_price: number;
    evaluation_price: number;

    // 추가 필드 (초기화 편의성)
    bio?: string;
    career?: string;
    specialties?: string;
    profile_image?: string;
    website_visible?: boolean;
}

export function TherapistList() {
    const { user } = useAuth();
    const { center } = useCenter(); // ✨ Use Center Context
    const centerId = center?.id;
    const [staffs, setStaffs] = useState<Therapist[]>([]);
    const [, setLoading] = useState(true);
    const [searchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'active' | 'retired'>('active');

    const [formData, setFormData] = useState<TherapistFormData>({
        name: '', contact: '', email: '', hire_type: 'freelancer',
        system_role: 'therapist', system_status: 'active', remarks: '', color: '#3b82f6',
        bank_name: '', account_number: '', account_holder: '',
        base_salary: 0, required_sessions: 0, session_price_weekday: 0, session_price_weekend: 0, incentive_price: 24000, evaluation_price: 50000,
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
        if (!centerId) return;
        setLoading(true);
        try {
            // 1. [Therapists First] 상세 정보(은행, 연락처 등) 조회 (정산의 기준이 되는 테이블)
            const { data: therapistDataRaw } = await supabase
                .from('therapists')
                .select('*')
                .eq('center_id', centerId);
            const therapistData = therapistDataRaw as Therapist[] | null;

            // 2. [Profiles Second] 이 센터 소속의 유저 프로필 조회
            const { data: profileDataRaw } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('center_id', centerId);
            const profileData = profileDataRaw as { id: string; email: string; role: SystemRole }[] | null;

            // 3. [Merge] 정산 정보(Therapists)를 기준으로 계정(Profile) 정보를 붙이기
            // 이제 계정(user_profile)이 아직 없어도 직원 목록에 정상적으로 뜹니다.
            const mergedData = therapistData?.map(t => {
                const profile = profileData?.find(p => p.email === t.email);

                return {
                    ...t,
                    userId: profile?.id || null, // 계정 정보가 없을 수 있음
                    system_role: t.system_role || profile?.role || 'therapist',
                    // ✨ [Fix] UI상 상태는 고용 정보(Therapist)의 상태를 마스터로 사용
                    system_status: t.system_status || 'active',
                    hire_type: t.hire_type || (profile?.role === 'admin' ? 'fulltime' : 'freelancer')
                };
            }).filter(u => u.system_role !== 'parent' && u.system_role !== 'super_admin');

            setStaffs((mergedData || []) as Therapist[]);

        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!editingId) {
                // 🚀 [Security] JWT 갱신 시도 (Invalid JWT 방지)
                await supabase.auth.refreshSession();

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
                const { error: therapistError } = await supabase
                    .from('therapists')
                    .upsert({
                        email: formData.email,
                        name: formData.name,
                        hire_type: formData.hire_type,
                        color: formData.color,
                        bank_name: formData.bank_name,
                        account_number: formData.account_number,
                        account_holder: formData.account_holder,
                        system_role: formData.system_role,
                        system_status: 'active', // Ensure they are active
                        center_id: centerId,
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

        } catch (error: any) {
            console.error(error);
            alert('❌ 처리 실패: ' + (error.message || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (staff: Therapist) => {
        const isRetired = staff.system_status === 'retired';

        // ✨ [핵심 수정] 사용자 요청: "퇴사 시 계정(Auth)은 확실히 날리되, 일지 정보는 보관"
        const message = isRetired
            ? `${staff.name}님을 다시 근무중으로 복귀시키겠습니까?\n(계정이 삭제된 경우 관리자가 다시 초대해야 합니다)`
            : `${staff.name}님을 퇴사 처리하시겠습니까?\n(로그인 권한 및 계정 정보가 즉시 삭제되지만, 기존 일지/기록 데이터는 보존됩니다)`;

        if (!confirm(message)) return;

        try {
            setLoading(true);

            if (!isRetired) {
                // [퇴사 처리: Clean Account Removal]
                // 1. Therapists 마스터 상태를 'retired'로 변경 (일지 보존을 위해 레코드는 유지)
                const { error: therapistError } = await (supabase
                    .from('therapists') as any)
                    .update({ system_status: 'retired' })
                    .eq('id', staff.id);

                if (therapistError) throw therapistError;

                // 2. Auth 계정 및 프로필 삭제 (보안 및 DB 정리)
                if (staff.userId) {
                    // ※ 중요: DB에서 therapists.profile_id 가 'ON DELETE SET NULL'로 설정되어 있어야 함
                    // @ts-expect-error - RPC args mismatch
                    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: staff.userId });
                    if (error) console.warn('Account removal note:', error.message);
                }

                alert('퇴사 처리가 완료되었습니다. 직원의 로그인 계정은 삭제되었으며 정보는 보관함으로 이동했습니다.');
            } else {
                // [복귀 처리]
                const { error: therapistError } = await (supabase
                    .from('therapists') as any)
                    .update({ system_status: 'active' })
                    .eq('id', staff.id);

                if (therapistError) throw therapistError;

                alert('근무 중으로 복귀되었습니다. 로그인이 필요한 경우 다시 초대해 주세요.');
            }

            fetchStaffs();
        } catch (error: any) {
            console.error(error);
            alert('처리 실패: ' + (error.message || '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    const handleHardReset = async (staff: Therapist) => {
        if (staff.email === 'anukbin@gmail.com') {
            alert('최고관리자 계정은 시스템 보호를 위해 영구 삭제할 수 없습니다.');
            return;
        }
        const confirmMsg = `[🚨 FINAL WARNING]\n\n${staff.name}님의 정보를 DB에서 "영구 삭제" 하시겠습니까?\n\n이 작업은 퇴사가 아닌 '데이터 말소'입니다. 이 직원이 배정된 일지나 정산 기록에 문제가 생길 수 있습니다.`;
        if (!confirm(confirmMsg)) return;

        const doubleCheck = prompt(`삭제를 원하시면 해당 직원의 이메일을 입력하세요:\n${staff.email}`);
        if (doubleCheck !== staff.email) {
            alert('이메일 불일치로 중단합니다.');
            return;
        }

        try {
            setLoading(true);

            // 1. 활성 일정 확인 (데이터 무결성 보호)
            const { data: activeSchedules } = await supabase
                .from('schedules')
                .select('id')
                .eq('therapist_id', staff.id)
                .limit(1);

            if (activeSchedules && activeSchedules.length > 0) {
                alert('⚠️ 삭제 실패: 이 치료사에게 등록된 일정이 아직 존재합니다.\n일정을 모두 삭제하거나 다른 치료사로 변경한 후 삭제해 주세요.');
                return;
            }

            // 2. 계정 삭제 (있는 경우)
            if (staff.userId) {
                // @ts-expect-error - RPC args mismatch
                await supabase.rpc('admin_delete_user', { target_user_id: staff.userId });
            }

            // 3. 치료사 정보 완전 삭제 (DB에서 제거)
            const { error: deleteError } = await supabase
                .from('therapists')
                .delete()
                .eq('id', staff.id);

            if (deleteError) throw deleteError;

            alert('DB에서 해당 직원의 모든 정보가 완전히 삭제되었습니다.');
            fetchStaffs();
        } catch (error: any) {
            console.error(error);
            alert('영구 삭제 실패: ' + (error.message || '오류 발생'));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (staff: Therapist) => {
        setEditingId(staff.id);
        setFormData({
            name: staff.name,
            contact: staff.contact || '',
            email: staff.email || '',
            hire_type: staff.hire_type || 'freelancer',
            system_role: staff.system_role || 'therapist',
            system_status: staff.system_status || 'active',
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
                                system_role: 'manager',
                                system_status: 'active',
                                remarks: '', color: '#f59e0b',
                                bank_name: '', account_number: '', account_holder: '',
                                base_salary: 0, required_sessions: 0, session_price_weekday: 0, session_price_weekend: 0, incentive_price: 0, evaluation_price: 0
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-amber-100 text-amber-700 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-amber-200 border border-amber-200"
                    >
                        <UserCog className="w-5 h-5" /> 매니저/행정 등록
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
                                                { 'admin': 'ADMIN', 'manager': 'MANAGER', 'therapist': 'THERAPIST', 'parent': 'PARENT', 'super_admin': 'SUPER ADMIN' }[staff.system_role] || 'THERAPIST'
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
                                    ? ({ 'admin': '관리자 정보 수정', 'therapist': '치료사 정보 수정', 'parent': '부모 정보 수정', 'manager': '매니저 정보 수정', 'super_admin': '최고관리자 수정' }[formData.system_role] || '치료사 정보 수정')
                                    : ({ 'admin': '새 관리자 등록', 'therapist': '새 치료사 등록', 'parent': '새 부모 등록', 'manager': '새 매니저 등록', 'super_admin': '새 최고관리자 등록' }[formData.system_role] || '새 치료사 등록')}
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
                                                onChange={e => setFormData({ ...formData, hire_type: e.target.value as HireType })}
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
                                                    'manager': '📋 매니저/행정 (Manager)',
                                                    'therapist': '🩺 치료사 (Therapist)',
                                                    'parent': '👨‍👩‍👧‍👦 학부모 (Parent)',
                                                    'super_admin': '🔑 최고관리자 (Super Admin)'
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
                            </div>


                            <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.02] transition-all mt-4">
                                {editingId ? '변경사항 저장하기' : '직원 등록 완료'}
                            </button>
                        </form>
                    </div >
                </div >
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
        </div >
    );
}