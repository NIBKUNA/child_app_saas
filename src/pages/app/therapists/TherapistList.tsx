// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus, Search, Phone, Mail, Edit2, Trash2, X, Check,
    Shield, Stethoscope, UserCog, UserCheck, AlertCircle, UserMinus, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from '@/config/superAdmin';
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
            const { data: therapistData } = await supabase.from('therapists').select('*').order('created_at', { ascending: false });
            // ✨ [Fix] status 필드도 가져와서 승인 대기 여부 확인
            const { data: profileData } = await supabase.from('user_profiles').select('id, role, email, status, name');

            const mergedData = therapistData?.map(t => {
                const profile = profileData?.find(p => p.id === t.id);
                return {
                    ...t,
                    system_role: profile?.role || 'therapist',
                    // ✨ [Fix] 프로필이 없으면(직접 등록) 'invited', 있으면 실제 상태 사용
                    system_status: profile ? profile.status : 'invited'
                };
            });

            setStaffs(mergedData || []);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (staff) => {
        if (!confirm(`${staff.name}님을 치료사로 승인하시겠습니까?`)) return;

        console.log('Starting approval process for:', staff.id, staff.email);

        try {
            // 1. ✨ [Check] 실제 가입된 유저인지 확인 (ID 매핑을 위해)
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, email')
                .eq('email', staff.email)
                .maybeSingle();

            if (!profile) {
                alert('⚠️ 승인 불가: 해당 이메일로 가입된 계정이 없습니다.\n사용자가 먼저 회원가입을 완료해야 합니다.');
                return;
            }

            console.log('Found matching profile:', profile.id);

            // 2. ✨ [Migration] Case A: 수동 등록 ID != 실제 가입 ID -> 통합 필요
            if (staff.id !== profile.id) {
                console.log('ID Mismatch detected. Executing Merge & Approve...');

                const { data: mergeRes, error: mergeError } = await supabase
                    .rpc('merge_and_approve_therapist', {
                        old_therapist_id: staff.id,
                        real_user_id: profile.id,
                        user_email: staff.email,
                        user_name: staff.name
                    });

                if (mergeError) {
                    throw mergeError;
                }

                if (mergeRes && !mergeRes.success) {
                    alert('❌ 통합 승인 실패: ' + mergeRes.message);
                    return;
                }

                alert('✅ 계정이 통합되어 승인되었습니다!\n(기존 수동 등록 데이터가 실제 계정으로 이관됨)');
            }
            // 3. ✨ [Standard] Case B: ID 일치 (일반적인 승인)
            else {
                console.log('ID Match. Executing Standard Approve...');

                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('update_user_role_safe', {
                        target_user_id: staff.id,
                        new_role: 'therapist',
                        new_status: 'active',
                        user_email: staff.email,
                        user_name: staff.name
                    });

                if (rpcError) throw rpcError;
                if (rpcData && !rpcData.success) {
                    alert('❌ 승인 실패: ' + rpcData.message);
                    return;
                }

                // therapists 테이블 업데이트 (색상 등)
                await supabase.from('therapists').update({ color: '#3b82f6' }).eq('id', staff.id);

                alert('✅ 승인이 완료되었습니다!');
            }

            // 4. 알림 삭제 (공통)
            try {
                await supabase.from('admin_notifications').delete().eq('user_id', profile.id).eq('type', 'new_user');
            } catch (e) {
                console.warn('Ignore notify delete error');
            }

            // 5. 화면 갱신
            await fetchStaffs();

        } catch (error: any) {
            console.error('Approval error:', error);
            alert(`❌ 승인 오류 발생: ${error.message}`);
        }
    };

    // ✨ [거절 처리] 가입 신청 거절
    // ✨ [거절 처리] 데이터 완전 삭제 (목록에서 제거)
    const handleReject = async (staff) => {
        if (!confirm(`⚠️ ${staff.name}님의 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            // 목록에서 사라지게 하기 위해 therapists 테이블에서 삭제
            await supabase.from('therapists').delete().eq('id', staff.id);
            // 프로필 상태도 거절로 변경 (선택 사항)
            await supabase.from('user_profiles').update({ status: 'rejected' }).eq('id', staff.id);

            // 3. ✨ [Fix] 거절 시에도 알림 삭제
            await supabase
                .from('admin_notifications')
                .delete()
                .eq('user_id', staff.id)
                .eq('type', 'new_user');

            alert('데이터가 삭제되었습니다.');
            fetchStaffs();
        } catch (error) {
            console.error(error);
            alert('삭제 오류: ' + (error as any).message);
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
                color: formData.color
            };

            if (editingId) {
                // 1. therapists 테이블 업데이트
                const { error: therapistError } = await supabase
                    .from('therapists')
                    .update(therapistPayload)
                    .eq('id', editingId);

                if (therapistError) {
                    console.error('Therapist update error:', therapistError);
                    throw therapistError;
                }

                // 2. user_profiles 테이블 업데이트 (권한 변경)
                // ✨ [중요] role 매핑: admin, therapist, staff, retired -> parent (비활성화)
                let dbRole = formData.system_role;
                let dbStatus = 'active';

                if (formData.system_role === 'retired') {
                    dbStatus = 'inactive';
                    dbRole = 'therapist'; // DB에서는 therapist로 유지하되 status로 구분
                }

                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('update_user_role_safe', {
                        target_user_id: editingId,
                        new_role: dbRole,
                        new_status: dbStatus,
                        user_email: formData.email,
                        user_name: formData.name
                    });

                if (rpcError) {
                    console.error('Role update RPC error:', rpcError);
                    alert('권한 변경 실패 (RPC): ' + rpcError.message);
                } else if (rpcData && !rpcData.success) {
                    // 실패했다면 프로필이 아예 없는 경우일 수 있음 -> 수동 Insert 시도
                    const { error: manualInsertError } = await supabase.from('user_profiles').upsert({
                        id: editingId,
                        email: formData.email,
                        name: formData.name,
                        role: dbRole,
                        status: dbStatus
                    });

                    if (manualInsertError) {
                        alert('권한 변경 실패: ' + rpcData.message);
                    } else {
                        alert('✅ 권한 변경 및 프로필 생성 완료');
                    }
                } else {
                    alert('✅ 권한이 성공적으로 변경되었습니다.');
                }
            } else {
                // ✨ [직접 등록] 새 직원 등록 시 therapists에만 추가 (user_profiles는 회원가입 시 생성됨)
                await supabase.from('therapists').insert([therapistPayload]);
                alert('✅ 직원이 등록되었습니다.');
            }

            setIsModalOpen(false);
            setEditingId(null);
            fetchStaffs();
        } catch (error) {
            console.error('Save error:', error);
            alert('❌ 저장 실패: ' + error.message);
        }
    };

    const handleEdit = (staff) => {
        // ✨ [Refactor] Allowed editing even for Super Admin (to change name)
        setEditingId(staff.id);
        setFormData({
            name: staff.name,
            contact: staff.contact || '',
            email: staff.email || '',
            hire_type: staff.hire_type || 'freelancer',
            system_role: staff.system_role || 'therapist',
            remarks: staff.remarks || '',
            color: staff.color || '#3b82f6'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id, email) => {
        // ✨ [Super Admin 보호] 삭제 불가
        if (isSuperAdmin(email)) {
            alert('⚠️ 최상위 관리자 계정은 삭제할 수 없습니다.');
            return;
        }

        if (!confirm('직원 목록에서 완전히 삭제하시겠습니까?\n(계정도 함께 삭제되어 재가입이 가능해집니다)')) return;

        try {
            // ✨ [Fix] RPC를 사용하여 auth.users까지 완전 삭제
            const { error } = await supabase.rpc('delete_user_completely', { target_user_id: id });

            if (error) {
                console.error('Delete RPC Error:', error);
                // RPC가 없거나 실패하면 기존 방식(테이블 삭제) 시도 (Fallback)
                await supabase.from('therapists').delete().eq('id', id);
                await supabase.from('user_profiles').delete().eq('id', id);
                throw error;
            }

            alert('✅ 직원이 완전히 삭제되었습니다.');
            fetchStaffs();
        } catch (error) {
            console.error("Deletion error:", error);
            // alert('삭제 중 오류가 발생했습니다 (새로고침 후 확인해주세요).');
            // 에러가 나도 화면 갱신 시도
            fetchStaffs();
        }
    };

    // ✨ [Fix] status 기준으로 승인 대기/완료 구분 (role이 아니라 status로!)
    // invited: 직접 등록됨 (승인 불필요, 가입 대기중)
    // pending: 가입함 (승인 필요)
    // active: 승인됨
    // rejected: 거절됨 (숨김)
    const pendingStaffs = staffs.filter(s => s.system_status === 'pending');
    const approvedStaffs = staffs.filter(s => s.system_status !== 'pending' && s.system_status !== 'rejected').filter(s => s.name.includes(searchTerm));

    return (
        <div className="space-y-6 pb-20 p-8 bg-slate-50/50 min-h-screen">
            <Helmet>
                <title>직원 및 권한 관리 - 자라다 Admin</title>
            </Helmet>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">직원 및 권한 관리</h1>
                    <p className="text-slate-500 font-bold mt-2">사용자 승인 및 퇴사 처리를 통합 관리합니다.</p>
                </div>
                <button onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', contact: '', email: '', hire_type: 'freelancer', system_role: 'therapist', remarks: '', color: '#64748b' });
                    setIsModalOpen(true);
                }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-slate-200">
                    <Plus className="w-5 h-5" /> 직원 직접 등록
                </button>
            </div>

            {/* 승인 대기 섹션 */}
            {pendingStaffs.length > 0 && (
                <div className="bg-white border-2 border-amber-200 rounded-[40px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                        <h2 className="text-xl font-black text-slate-900">승인 대기 중인 가입자 ({pendingStaffs.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingStaffs.map(staff => (
                            <div key={staff.id} className="bg-slate-50 p-5 rounded-3xl flex justify-between items-center border border-slate-100">
                                <div>
                                    <p className="font-black text-slate-900 text-sm">{staff.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{staff.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleReject(staff)}
                                        className="border-2 border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600 px-4 py-2 rounded-xl text-xs font-black transition-all"
                                    >
                                        거절
                                    </button>
                                    <button
                                        onClick={() => handleApprove(staff)}
                                        className="bg-amber-500 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                                    >
                                        승인하기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text" placeholder="이름으로 검색..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 font-bold transition-all shadow-sm"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* 직원 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedStaffs.map((staff) => (
                    <div key={staff.id} className={cn(
                        "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all group",
                        staff.system_role === 'retired' && "opacity-60 grayscale bg-slate-50"
                    )}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg" style={{ backgroundColor: staff.system_role === 'retired' ? '#cbd5e1' : staff.color }}>
                                    {staff.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                                        {staff.name}
                                        {staff.system_role === 'admin' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 font-black">Admin</span>}
                                        {staff.system_role === 'therapist' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 font-black">치료사</span>}
                                        {staff.system_role === 'staff' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 font-black">일반직원</span>}
                                        {staff.system_role === 'retired' && <span className="text-[10px] bg-slate-500 text-white px-2 py-0.5 rounded-full font-black">퇴사자</span>}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1">{staff.system_role === 'retired' ? '접속 권한 없음' : staff.remarks}</p>
                                </div>
                            </div>
                            {/* ✨ [Super Admin 보호] 본인만 수정 가능, 삭제는 절대 불가 */}
                            <div className="flex gap-1">
                                {isSuperAdmin(staff.email) && user?.email !== staff.email ? (
                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl" title="수정 불가 (권한 없음)">
                                        <Lock className="w-4 h-4 text-slate-400" />
                                    </div>
                                ) : (
                                    <button onClick={() => handleEdit(staff)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors" title="정보 수정">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}

                                {isSuperAdmin(staff.email) ? (
                                    <div className="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-xl" title="삭제 불가 (최상위 관리자)">
                                        <Lock className="w-4 h-4 text-amber-500" />
                                    </div>
                                ) : (
                                    <button onClick={() => handleDelete(staff.id, staff.email)} className="p-2.5 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500 transition-colors" title="삭제">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-5 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 truncate"><Phone className="w-3.5 h-3.5 text-slate-300" /> {staff.contact || '미등록'}</div>
                            <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 truncate"><Mail className="w-3.5 h-3.5 text-slate-300" /> {staff.email}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 수정 및 등록 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="font-black text-xl text-slate-900">{editingId ? '권한 및 정보 수정' : '직원 등록'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <label className="block text-xs font-black text-slate-500 mb-4 px-1 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> 앱 접근 권한 설정
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'admin', label: '관리자', icon: Shield },
                                        { id: 'therapist', label: '치료사', icon: Stethoscope },
                                        { id: 'staff', label: '일반직원', icon: UserCog },
                                        { id: 'retired', label: '퇴사자', icon: UserMinus }
                                    ].map(role => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, system_role: role.id })}
                                            className={cn(
                                                "py-4 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 transition-all border-2",
                                                formData.system_role === role.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-100'
                                            )}
                                        >
                                            <role.icon className="w-4 h-4" /> {role.label}
                                        </button>
                                    ))}
                                </div>
                                {formData.system_role === 'retired' && (
                                    <p className="text-[10px] text-red-500 font-black text-center mt-3 animate-pulse">※ 퇴사 처리 시 모든 서비스 이용이 제한됩니다.</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-xs font-black text-slate-500 mb-2 px-1 block">이름</label><input required className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div><label className="text-xs font-black text-slate-500 mb-2 px-1 block">이메일</label><input type="email" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-black text-slate-500 mb-2 px-1 block">연락처</label><input className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="010-0000-0000" /></div>
                                    <div><label className="text-xs font-black text-slate-500 mb-2 px-1 block">비고</label><input className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="직책 등" /></div>
                                </div>
                            </div>
                            {/* ✨ [캘린더 색상] 색상 선택 UI */}
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-3 px-1 block">캘린더 색상</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: c })}
                                            className={cn(
                                                "w-10 h-10 rounded-2xl border-4 transition-all",
                                                formData.color === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 px-1">※ 선택한 색상이 캘린더 일정에 표시됩니다.</p>
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-base shadow-xl hover:bg-slate-800 transition-all">저장 완료</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}