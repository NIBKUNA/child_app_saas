// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Modified by: Gemini AI (for An Uk-bin)
 * 📅 Date: 2026-01-13
 * 🖋️ Description: "이메일 기반 UI-백엔드 완전 동기화 패치"
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus, Search, Phone, Mail, Edit2, X, Check,
    Shield, Stethoscope, UserCog, UserCheck, AlertCircle, UserMinus, Lock, RotateCcw
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

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        hire_type: 'freelancer',
        system_role: 'therapist',
        remarks: '',
        color: '#3b82f6'
    });

    useEffect(() => { fetchStaffs(); }, []);

    const fetchStaffs = async () => {
        setLoading(true);
        try {
            // 1. 치료사 목록과 유저 프로필 목록을 가져옵니다.
            const { data: therapistData } = await supabase.from('therapists').select('*').order('created_at', { ascending: false });
            const { data: profileData } = await supabase.from('user_profiles').select('id, role, email, status');

            const mergedData = therapistData?.map(t => {
                // ✨ [핵심] 이메일을 기준으로 실제 가입된 프로필을 강제 매칭합니다.
                const profile = profileData?.find(p => p.email === t.email);

                // ✨ [백엔드 동기화] UI 배지에 표시할 역할은 무조건 DB(user_profiles)의 role 값을 따릅니다.
                let dbRole = profile?.role || 'therapist';
                let dbStatus = profile?.status || 'invited';

                return {
                    ...t,
                    system_role: dbRole,    // 이제 DB가 'admin'이면 배지도 빨간색 Admin으로 뜹니다.
                    system_status: dbStatus
                };
            });

            setStaffs(mergedData || []);
        } catch (error) {
            console.error("데이터 동기화 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (staff) => {
        const isRetired = staff.system_status === 'retired' || staff.system_status === 'inactive';
        const confirmMsg = isRetired
            ? `${staff.name}님을 다시 '재직' 상태로 복구하시겠습니까?`
            : `${staff.name}님을 '퇴사' 처리하시겠습니까?\n(로그인 및 서비스 이용이 즉시 제한됩니다.)`;

        if (!confirm(confirmMsg)) return;

        try {
            const newStatus = isRetired ? 'active' : 'retired';
            // 백엔드 상태를 물리적으로 변경
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: newStatus })
                .eq('email', staff.email);

            if (error) throw error;
            alert(isRetired ? '✅ 복구되었습니다.' : '✅ 퇴사 처리가 완료되었습니다.');
            fetchStaffs();
        } catch (error) {
            alert('처리 실패: ' + error.message);
        }
    };

    const handleApprove = async (staff) => {
        if (!confirm(`${staff.name}님을 치료사로 승인하시겠습니까?`)) return;
        try {
            const { data: profile } = await supabase.from('user_profiles').select('id, email').eq('email', staff.email).maybeSingle();
            if (!profile) return alert('⚠️ 사용자가 먼저 회원가입을 완료해야 합니다.');

            const { error: rpcError } = await supabase.rpc('approve_therapist', { target_user_id: profile.id });
            if (rpcError) throw rpcError;

            await supabase.from('therapists').update({ id: profile.id }).eq('email', staff.email);
            alert('✅ 승인이 완료되었습니다!');
            fetchStaffs();
        } catch (error) {
            alert(`❌ 오류: ${error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const therapistPayload = {
                name: formData.name,
                contact: formData.contact,
                email: formData.email,
                hire_type: formData.hire_type,
                remarks: formData.remarks,
                color: formData.color,
                center_id: 'd327993a-e558-4442-bac5-1469306c35bb'
            };

            if (editingId) {
                // 1. [핵심] user_profiles의 실제 role을 관리자가 선택한 대로 강제 변경합니다.
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update({
                        role: formData.system_role,
                        status: (formData.system_role === 'retired') ? 'retired' : 'active'
                    })
                    .eq('email', formData.email); // 이메일 기준 업데이트로 유실 방지

                if (profileError) throw profileError;

                // 2. 치료사 부가 정보 업데이트
                await supabase.from('therapists').update(therapistPayload).eq('email', formData.email);

                alert(`✅ ${formData.name}님의 권한이 [${formData.system_role}] (으)로 실시간 변경되었습니다.`);
            } else {
                await supabase.from('therapists').insert([therapistPayload]);
                alert('✅ 직원이 등록되었습니다.');
            }

            setIsModalOpen(false);
            setEditingId(null);
            fetchStaffs(); // ✨ 변경된 백엔드 값을 즉시 다시 불러와 UI를 갱신
        } catch (error) {
            alert('❌ 저장 및 권한 변경 실패: ' + error.message);
        }
    };

    const handleEdit = (staff) => {
        setEditingId(staff.id);
        setFormData({
            name: staff.name,
            contact: staff.contact || '',
            email: staff.email || '',
            hire_type: staff.hire_type || 'freelancer',
            system_role: staff.system_role || 'therapist', // DB에서 가져온 값이 이미 반영됨
            remarks: staff.remarks || '',
            color: staff.color || '#3b82f6'
        });
        setIsModalOpen(true);
    };

    const pendingStaffs = staffs.filter(s => s.system_status === 'pending');
    const approvedStaffs = staffs.filter(s => s.system_status !== 'pending' && s.system_status !== 'rejected').filter(s => s.name.includes(searchTerm));

    return (
        <div className="space-y-6 pb-20 p-8 bg-slate-50/50 min-h-screen">
            <Helmet><title>직원 관리 - 자라다</title></Helmet>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">직원 및 권한 관리</h1>
                    <p className="text-slate-500 font-bold">권한 변경 사항은 DB와 즉시 동기화됩니다.</p>
                </div>
                <button onClick={() => { setEditingId(null); setFormData({ name: '', contact: '', email: '', hire_type: 'freelancer', system_role: 'therapist', remarks: '', color: '#3b82f6' }); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-slate-200">
                    <Plus className="w-5 h-5" /> 직원 직접 등록
                </button>
            </div>

            {/* 승인 대기 목록 */}
            {pendingStaffs.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[32px] p-6 animate-in slide-in-from-top duration-500">
                    <h2 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> 신규 승인 대기 ({pendingStaffs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingStaffs.map(staff => (
                            <div key={staff.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900">{staff.name}</p>
                                    <p className="text-xs text-slate-500">{staff.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleToggleStatus(staff)} className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl">거절</button>
                                    <button onClick={() => handleApprove(staff)} className="px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md">승인하기</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="직원 이름으로 검색..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedStaffs.map((staff) => (
                    <div key={staff.id} className={cn(
                        "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md",
                        (staff.system_status === 'retired' || staff.system_status === 'inactive') && "opacity-60 grayscale bg-slate-50"
                    )}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-inner" style={{ backgroundColor: staff.color }}>
                                    {staff.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                                        {staff.name}
                                        {/* ✨ [UI 렌더링 직결] DB role 값에 따라 배지 색상을 즉각 결정합니다. */}
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                                            staff.system_status === 'retired' ? "bg-slate-200 text-slate-500" :
                                                staff.system_role === 'admin' ? "bg-rose-100 text-rose-600 border border-rose-200" :
                                                    "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                        )}>
                                            {staff.system_status === 'retired' ? '퇴사' : (staff.system_role === 'admin' ? 'Admin' : '치료사')}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {staff.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(staff)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors" title="수정"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                                <button
                                    onClick={() => handleToggleStatus(staff)}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        (staff.system_status === 'retired' || staff.system_status === 'inactive')
                                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                                            : "bg-rose-50 hover:bg-rose-100 text-rose-400"
                                    )}
                                    title={staff.system_status === 'retired' ? "복구" : "퇴사 처리"}
                                >
                                    {(staff.system_status === 'retired' || staff.system_status === 'inactive') ? <RotateCcw className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 모달 구조는 동일하되 데이터는 system_role과 연동됨 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900">{editingId ? '직원 정보 및 권한 수정' : '새 직원 등록'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 ml-1">이름</label>
                                <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 ml-1">시스템 권한</label>
                                    {/* ✨ 여기서 변경한 값이 handleSubmit을 통해 user_profiles.role을 직접 바꿉니다. */}
                                    <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-slate-900" value={formData.system_role} onChange={e => setFormData({ ...formData, system_role: e.target.value })}>
                                        <option value="therapist">치료사 (일반)</option>
                                        <option value="admin">관리자 (Admin)</option>
                                        <option value="retired">퇴사/중지</option>
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