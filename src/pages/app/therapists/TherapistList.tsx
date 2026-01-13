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
        name: '', contact: '', email: '', hire_type: 'freelancer',
        system_role: 'therapist', remarks: '', color: '#3b82f6'
    });

    useEffect(() => { fetchStaffs(); }, []);

    const fetchStaffs = async () => {
        setLoading(true);
        try {
            const { data: therapistData } = await supabase.from('therapists').select('*').order('created_at', { ascending: false });
            const { data: profileData } = await supabase.from('user_profiles').select('id, role, email, status');

            const mergedData = therapistData?.map(t => {
                // ✨ 이메일을 기준으로 프로필 매칭 (ID가 달라도 이메일이 같으면 동일인)
                const profile = profileData?.find(p => p.email === t.email);

                let dbRole = profile?.role || 'therapist';
                let dbStatus = profile?.status || 'invited';

                return {
                    ...t,
                    system_role: dbRole,    // DB 값을 UI 배지에 직결
                    system_status: dbStatus
                };
            });

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
            // 🚨 [핵심 변경] UPSERT 로직: 데이터가 없으면 생성(Insert), 있으면 수정(Update)
            // 1. user_profiles 테이블 권한 강제 설정
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    email: formData.email,
                    name: formData.name,
                    role: formData.system_role, // 'admin' 또는 'therapist'
                    status: (formData.system_role === 'retired') ? 'retired' : 'active',
                    center_id: 'd327993a-e558-4442-bac5-1469306c35bb' // 잠실 센터 고정
                }, { onConflict: 'email' }); // 이메일 충돌 시 업데이트 수행

            if (profileError) throw profileError;

            // 2. therapists 테이블 정보 자동 생성/수정
            const { error: therapistError } = await supabase
                .from('therapists')
                .upsert({
                    email: formData.email,
                    name: formData.name,
                    contact: formData.contact,
                    hire_type: formData.hire_type,
                    remarks: formData.remarks,
                    color: formData.color,
                    center_id: 'd327993a-e558-4442-bac5-1469306c35bb'
                }, { onConflict: 'email' });

            if (therapistError) throw therapistError;

            alert(`✅ [동기화 성공] ${formData.name}님의 데이터가 생성/수정되었습니다.`);

            // ✨ [UI 강제 새로고침] DB 값을 화면에 즉각 반영하기 위함
            window.location.reload();

        } catch (error) {
            alert('❌ 처리 실패: ' + error.message);
        }
    };

    const handleToggleStatus = async (staff) => {
        const isRetired = staff.system_status === 'retired' || staff.system_status === 'inactive';
        if (!confirm(`${staff.name}님을 ${isRetired ? '복구' : '퇴사'} 처리하시겠습니까?`)) return;

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: isRetired ? 'active' : 'retired' })
                .eq('email', staff.email);

            if (error) throw error;
            fetchStaffs();
        } catch (error) {
            alert('실패: ' + error.message);
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
            color: staff.color || '#3b82f6'
        });
        setIsModalOpen(true);
    };

    const approvedStaffs = staffs.filter(s => s.system_status !== 'pending' && s.system_status !== 'rejected').filter(s => s.name.includes(searchTerm));

    return (
        <div className="space-y-6 pb-20 p-8 bg-slate-50/50 min-h-screen">
            <Helmet><title>직원 관리 - 자라다</title></Helmet>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">직원 및 권한 관리</h1>
                    <p className="text-slate-500 font-bold">UPSERT 로직으로 데이터 부재 문제를 자동 해결합니다.</p>
                </div>
                <button onClick={() => { setEditingId(null); setFormData({ name: '', contact: '', email: '', hire_type: 'freelancer', system_role: 'therapist', remarks: '', color: '#3b82f6' }); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-slate-200">
                    <Plus className="w-5 h-5" /> 직원 직접 등록
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedStaffs.map((staff) => (
                    <div key={staff.id} className={cn(
                        "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md",
                        (staff.system_status === 'retired' || staff.system_status === 'inactive') && "opacity-60 grayscale bg-slate-50"
                    )}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl" style={{ backgroundColor: staff.color }}>
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
                                            {staff.system_status === 'retired' ? '퇴사' : (staff.system_role === 'admin' ? 'Admin' : '치료사')}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {staff.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(staff)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                                <button onClick={() => handleToggleStatus(staff)} className={cn("p-2.5 rounded-xl transition-all", staff.system_status === 'retired' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-400")}>
                                    {staff.system_status === 'retired' ? <RotateCcw className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                                <input required className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-slate-900" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 ml-1">시스템 권한</label>
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