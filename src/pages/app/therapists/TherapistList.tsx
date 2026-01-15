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
import {
    Plus, Search, Phone, Mail, Edit2, X, Check,
    Shield, Stethoscope, UserCog, UserCheck, AlertCircle, UserMinus, Lock, RotateCcw, Trash2, Archive, ArchiveRestore
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSuperAdmin } from '@/config/superAdmin';
import { Helmet } from 'react-helmet-async';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#64748b', '#71717a'
];

export function TherapistList() {
    const { user } = useAuth();
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState<'active' | 'retired'>('active');

    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', hire_type: 'freelancer',
        system_role: 'therapist', remarks: '', color: '#3b82f6',
        bank_name: '', account_number: '', account_holder: ''
    });

    useEffect(() => { fetchStaffs(); }, []);

    const fetchStaffs = async () => {
        setLoading(true);
        try {
            // 🛡️ [Security] 원천 차단: DB 쿼리 단계에서 슈퍼 어드민 제외
            const { data: therapistData } = await supabase
                .from('therapists')
                .select('*')
                .neq('email', 'anukbin@gmail.com') // 🚫 Exclude Super Admin
                .order('created_at', { ascending: false });

            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('id, role, email, status')
                .neq('email', 'anukbin@gmail.com'); // 🚫 Exclude Super Admin

            const mergedData = therapistData?.map(t => {
                const profile = profileData?.find(p => p.email === t.email);
                let dbRole = profile?.role || 'therapist';
                let dbStatus = profile?.status || 'invited';

                return {
                    ...t,
                    userId: profile?.id, // Important for reset
                    system_role: dbRole,
                    system_status: dbStatus
                };
            }).filter(u => u.email !== 'anukbin@gmail.com');

            setStaffs(mergedData || []);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Therapists 테이블 우선 생성/수정
            const { error: therapistError } = await supabase
                .from('therapists')
                .upsert({
                    email: formData.email,
                    name: formData.name,
                    contact: formData.contact,
                    hire_type: formData.hire_type,
                    remarks: formData.remarks,
                    color: formData.color,
                    bank_name: formData.bank_name,
                    account_number: formData.account_number,
                    account_holder: formData.account_holder,
                    // ✨ Advanced Settlement Fields
                    base_salary: formData.base_salary,
                    required_sessions: formData.required_sessions,
                    session_price_weekday: formData.session_price_weekday,
                    session_price_weekend: formData.session_price_weekend,
                    incentive_price: formData.incentive_price,
                    evaluation_price: formData.evaluation_price,
                    center_id: import.meta.env.VITE_CENTER_ID
                }, { onConflict: 'email' });

            // ... rest of logic
            if (therapistError) throw therapistError;

            // 2. 프로필이 있으면 업데이트, 없으면 무시 (가입은 사용자가 직접 해야 함)
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('email', formData.email)
                .maybeSingle();

            if (existingProfile) {
                await supabase
                    .from('user_profiles')
                    .update({
                        role: formData.system_role,
                        name: formData.name
                    })
                    .eq('email', formData.email);
            }

            alert(`✅ [저장 완료] ${formData.name}님의 정보가 저장되었습니다.`);
            fetchStaffs(); // Reload properly instead of window.reload()
            setIsModalOpen(false); // Close modal

        } catch (error) {
            alert('❌ 처리 실패: ' + error.message);
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
            await supabase
                .from('user_profiles')
                .update({ status: newStatus })
                .eq('email', staff.email);

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
            // 1. Delete Therapist Record
            await supabase.from('therapists').delete().eq('id', staff.id);
            // 2. Delete Profile (If linked)
            if (staff.userId) {
                await supabase.from('user_profiles').delete().eq('id', staff.userId);
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
            // ✨ Advanced Mapping
            base_salary: staff.base_salary || 0,
            required_sessions: staff.required_sessions || 0,
            session_price_weekday: staff.session_price_weekday || 0,
            session_price_weekend: staff.session_price_weekend || 0,
            incentive_price: staff.incentive_price || 24000,
            evaluation_price: staff.evaluation_price || 50000
        });
        setIsModalOpen(true);
    };

    // Filter Logic
    const filteredStaffs = staffs.filter(s => {
        if (viewMode === 'active') return s.system_status !== 'retired' && s.system_status !== 'rejected';
        if (viewMode === 'retired') return s.system_status === 'retired';
        return false;
    }).filter(s => s.name.includes(searchTerm));

    const isSuper = user?.email === 'anukbin@gmail.com';  // Fortress Check

    return (
        <div className="space-y-6 pb-20 p-8 bg-slate-50/50 min-h-screen">
            <Helmet><title>직원 관리 - 자라다</title></Helmet>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">직원 및 권한 관리</h1>
                    <p className="text-slate-500 font-bold mt-1">
                        {viewMode === 'active' ? '현재 근무 중인 직원 목록입니다.' : '퇴사 처리된 직원 보관소입니다.'}
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* View Mode Toggle */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
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

                    <button onClick={() => { setEditingId(null); setFormData({ name: '', contact: '', email: '', hire_type: 'freelancer', system_role: 'therapist', remarks: '', color: '#3b82f6' }); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                        <Plus className="w-5 h-5" /> 직원 등록
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
                        "bg-white p-6 rounded-[32px] border transition-all hover:shadow-xl group",
                        staff.system_status === 'retired' ? "border-rose-100 bg-rose-50/30" : "border-slate-100 shadow-sm"
                    )}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg transform group-hover:scale-110 transition-transform" style={{ backgroundColor: staff.system_status === 'retired' ? '#94a3b8' : staff.color }}>
                                    {staff.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                                        {staff.name}
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border",
                                            staff.system_status === 'retired' ? "bg-slate-200 text-slate-500 border-slate-300" :
                                                staff.system_role === 'admin' ? "bg-rose-100 text-rose-600 border-rose-200" :
                                                    "bg-emerald-100 text-emerald-600 border-emerald-200"
                                        )}>
                                            {staff.system_status === 'retired' ? 'RETIRED' : (staff.system_role === 'admin' ? 'ADMIN' : 'THERAPIST')}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {staff.email}</p>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                {staff.system_status !== 'retired' && (
                                    <button onClick={() => handleEdit(staff)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                                )}

                                {/* Status Toggle Button */}
                                <button onClick={() => handleToggleStatus(staff)}
                                    className={cn("p-2.5 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95",
                                        staff.system_status === 'retired' ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-rose-50 text-rose-400 hover:bg-rose-100")}>
                                    {staff.system_status === 'retired' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                </button>

                                {/* SUPER ADMIN ONLY: Hard Reset */}
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
                    <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900">{editingId ? '직원 정보 및 권한 수정' : '새 직원 등록'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 ml-1">이름</label>
                                <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-900" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 ml-1">시스템 권한</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-slate-900" value={formData.system_role} onChange={e => setFormData({ ...formData, system_role: e.target.value })}>
                                        <option value="therapist">치료사 (일반)</option>
                                        <option value="admin">관리자 (Admin)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 ml-1">고용 형태</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-slate-900" value={formData.hire_type} onChange={e => setFormData({ ...formData, hire_type: e.target.value })}>
                                        <option value="fulltime">정규직</option>
                                        <option value="freelancer">프리랜서</option>
                                        <option value="parttime">파트타임</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 ml-1">이메일 (계정연동)</label>
                                <input type="email" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingId} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 ml-1">프로필 색상</label>
                                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })} className={cn("w-8 h-8 rounded-full transition-transform", formData.color === c && "scale-125 ring-2 ring-white shadow-md")} style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-black text-slate-400">💰 정산 및 계좌 정보</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">은행명</label>
                                        <input className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm" placeholder="예: 국민은행" value={formData.bank_name || ''} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">계좌번호</label>
                                        <input className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm" placeholder="'-' 없이 입력" value={formData.account_number || ''} onChange={e => setFormData({ ...formData, account_number: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">예금주</label>
                                        <input className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm" placeholder="예금주명" value={formData.account_holder || ''} onChange={e => setFormData({ ...formData, account_holder: e.target.value })} />
                                    </div>
                                </div>

                                {/* ✨ Advanced Settlement Settings */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-black text-slate-400">📊 급여/정산 설정 (고도화 엔진)</h3>

                                    {/* Common Field */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 ml-1">평가 수당 (회당)</label>
                                            <input type="number" className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-sm" placeholder="기본 50000" value={formData.evaluation_price || 0} onChange={e => setFormData({ ...formData, evaluation_price: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>

                                    {/* Regular: Base Salary + Target */}
                                    {formData.hire_type === 'fulltime' && (
                                        <div className="bg-indigo-50/50 p-4 rounded-2xl space-y-3 border border-indigo-100">
                                            <p className="text-xs font-black text-indigo-500 mb-2">정규직 설정</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">기본급 (원)</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 font-bold text-sm" value={formData.base_salary || 0} onChange={e => setFormData({ ...formData, base_salary: parseInt(e.target.value) || 0 })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">필수 회기 (Target)</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 font-bold text-sm" value={formData.required_sessions || 0} onChange={e => setFormData({ ...formData, required_sessions: parseInt(e.target.value) || 0 })} />
                                                </div>
                                                <div className="space-y-2 col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">초과 인센티브 (회당)</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 font-bold text-sm" placeholder="기본 24000" value={formData.incentive_price || 0} onChange={e => setFormData({ ...formData, incentive_price: parseInt(e.target.value) || 0 })} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Freelancer: Ratio */}
                                    {(formData.hire_type === 'freelancer' || formData.hire_type === 'parttime') && (
                                        <div className="bg-emerald-50/50 p-4 rounded-2xl space-y-3 border border-emerald-100">
                                            <p className="text-xs font-black text-emerald-500 mb-2">프리랜서 단가 설정</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">평일 단가 (회당)</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-white rounded-xl border border-emerald-100 font-bold text-sm" value={formData.session_price_weekday || 0} onChange={e => setFormData({ ...formData, session_price_weekday: parseInt(e.target.value) || 0 })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">주말 단가 (회당)</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-white rounded-xl border border-emerald-100 font-bold text-sm" value={formData.session_price_weekend || 0} onChange={e => setFormData({ ...formData, session_price_weekend: parseInt(e.target.value) || 0 })} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.02] transition-all mt-4">
                                {editingId ? '변경사항 저장하기' : '직원 등록 완료'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}