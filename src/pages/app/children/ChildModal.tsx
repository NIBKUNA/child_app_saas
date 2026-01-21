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
import { X, Loader2, Save, Trash2, UserCheck, AlertCircle, Mail } from 'lucide-react';
import { InvitationCodeAlert } from '@/components/InvitationCodeAlert';
import { JAMSIL_CENTER_ID } from '@/config/center';

export function ChildModal({ isOpen, onClose, childId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    // ✨ [Removed] Manual Parent Connection State
    const [showCodeAlert, setShowCodeAlert] = useState(false);
    const [newChildCode, setNewChildCode] = useState('');
    const [newChildName, setNewChildName] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        registration_number: '',
        birth_date: '',
        gender: '남',
        diagnosis: '',
        guardian_name: '',
        contact: '',
        parent_id: '',
        center_id: JAMSIL_CENTER_ID
    });

    useEffect(() => {
        if (isOpen) {
            if (childId) {
                loadChild();
            } else {
                setFormData({
                    name: '', registration_number: '', birth_date: '', gender: '남',
                    diagnosis: '', guardian_name: '', contact: '',
                    center_id: JAMSIL_CENTER_ID
                });
            }
        }
    }, [isOpen, childId]);

    // ✨ [Removed] fetchParentAccounts logic

    const loadChild = async () => {
        const { data, error } = await supabase.from('children').select('*').eq('id', childId).single();
        if (data) {
            setFormData({
                ...data,
                // ✨ [FIX] Ensure no null values for inputs (Controlled Components)
                registration_number: data.registration_number || '',
                birth_date: data.birth_date || '',
                diagnosis: data.diagnosis || '',
                guardian_name: data.guardian_name || '',
                contact: data.contact || '',
                gender: data.gender || '남' // Ensure gender has a valid value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submissionData = {
                name: formData.name,
                registration_number: formData.registration_number || null,
                birth_date: formData.birth_date || null,
                gender: formData.gender,
                diagnosis: formData.diagnosis || null,
                guardian_name: formData.guardian_name || null,
                contact: formData.contact || null,
                // ✨ [Removed] parent_id (Managed via Invitation Code only)
                center_id: JAMSIL_CENTER_ID
            };

            let result;
            if (childId) {
                result = await supabase.from('children').update(submissionData).eq('id', childId);
                if (result.error) throw result.error;
                alert('성공적으로 저장되었습니다.');
                onSuccess();
            } else {
                const generateInvitationCode = () => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let result = '';
                    for (let i = 0; i < 5; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return result;
                };

                const newCode = generateInvitationCode();
                console.log('Generating Invitation Code:', newCode);

                result = await supabase.from('children')
                    .insert([{ ...submissionData, invitation_code: newCode }])
                    .select('invitation_code, name')
                    .single();

                if (result.error) throw result.error;

                setNewChildName(submissionData.name);
                setNewChildCode(result.data.invitation_code);
                setShowCodeAlert(true);
            }
        } catch (error) {
            console.error('저장 실패 상세:', error);
            if (error.code === '23503') {
                alert('저장 실패: 선택한 보호자 계정이 유효하지 않습니다. 다시 선택해주세요.');
            } else {
                alert('저장 실패: ' + (error.message || '데이터 형식을 확인해주세요.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('🚨 정말 삭제하시겠습니까?\n\n이 아동과 관련된 모든 데이터(수업 일정, 수납 내역, 상담 일지, 알림장, 발달 평가)가 영구적으로 삭제됩니다.\n\n삭제된 데이터는 복구할 수 없습니다.')) return;

        setLoading(true);
        try {
            // ✨ [Cleanup] 
            // DB 스키마에 ON DELETE CASCADE가 설정되어 있어, 
            // children 테이블에서 삭제하면 연결된 모든 데이터(일정, 일지, 결제 등)가 자동 삭제됩니다.
            const { error } = await supabase.from('children').delete().eq('id', childId);
            if (error) throw error;

            alert('아동 및 관련 데이터가 모두 삭제되었습니다.');
            onSuccess();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">아동 정보 설정</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-md rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* ✨ [Removed] Manual Parent Connection Dropdown */}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1">아동 이름</label>
                                <input type="text" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1">생년월일</label>
                                <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white dark:[color-scheme:dark]" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1">성별</label>
                                <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="남">남성</option>
                                    <option value="여">여성</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1">진단명</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1">보호자 성함 (수동)</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white" value={formData.guardian_name} onChange={e => setFormData({ ...formData, guardian_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1">연락처 (수동)</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        {childId && (
                            <button type="button" onClick={handleDelete} className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                                <Trash2 className="w-6 h-6" />
                            </button>
                        )}
                        <button type="submit" disabled={loading} className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white font-black py-5 rounded-[20px] flex justify-center items-center gap-2 shadow-xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all">
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />} 정보 저장하기
                        </button>
                    </div>
                </form>

                <InvitationCodeAlert
                    isOpen={showCodeAlert}
                    onClose={() => {
                        setShowCodeAlert(false);
                        onSuccess();
                    }}
                    childName={newChildName}
                    invitationCode={newChildCode}
                />
            </div>
        </div>
    );
}