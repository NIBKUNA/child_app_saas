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

export function ChildModal({ isOpen, onClose, childId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [parents, setParents] = useState([]);
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
        parent_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchParentAccounts();
            if (childId) {
                loadChild();
            } else {
                setFormData({
                    name: '', registration_number: '', birth_date: '', gender: '남',
                    diagnosis: '', guardian_name: '', contact: '', parent_id: ''
                });
            }
        }
    }, [isOpen, childId]);

    const fetchParentAccounts = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles') // ✨ Standardized to user_profiles
                .select('id, name, email')
                .eq('role', 'parent')
                .order('name');
            if (error) throw error;
            setParents(data || []);
        } catch (error) {
            console.error('학부모 목록 로드 실패:', error);
        }
    };

    const loadChild = async () => {
        const { data, error } = await supabase.from('children').select('*').eq('id', childId).single();
        if (data) {
            setFormData({
                ...data,
                // DB에서 가져온 값이 null이면 빈 문자열로 처리하여 select 태그와 동기화
                parent_id: data.parent_id || ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // ✨ 미세 조정 1: parent_id가 빈 문자열("")이면 명확하게 null을 할당
            // foreign key 제약 조건 에러를 방지하는 가장 중요한 로직입니다.
            const cleanParentId = formData.parent_id === "" ? null : formData.parent_id;

            const submissionData = {
                name: formData.name,
                registration_number: formData.registration_number || null,
                birth_date: formData.birth_date || null,
                gender: formData.gender,
                diagnosis: formData.diagnosis || null,
                guardian_name: formData.guardian_name || null,
                contact: formData.contact || null,
                parent_id: cleanParentId // 정제된 UUID 또는 null 전달
            };

            let result;
            if (childId) {
                result = await supabase.from('children').update(submissionData).eq('id', childId);
                if (result.error) throw result.error;
                alert('성공적으로 저장되었습니다.');
                onSuccess();
            } else {
                // ✨ [신규 등록] insert 후 invitation_code 반환받기
                result = await supabase.from('children').insert([submissionData]).select('invitation_code, name').single();
                if (result.error) throw result.error;

                // ✨ 초대 코드 알림창 표시
                setNewChildName(submissionData.name);
                setNewChildCode(result.data.invitation_code);
                setShowCodeAlert(true);
            }
        } catch (error) {
            console.error('저장 실패 상세:', error);
            // 외래키 에러 시 더 친절한 안내 메시지 출력
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
        if (!confirm('🚨 정말 삭제하시겠습니까?\n\n이 아동과 관련된 모든 데이터(수업 일정, 수납 내역, 상담 일지, 알림장)가 영구적으로 삭제됩니다.\n\n삭제된 데이터는 복구할 수 없습니다.')) return;

        setLoading(true);
        try {
            // 1. 수납 상세 내역 삭제 (payment_items) - schedule_id 또는 payment_id 연결
            // 여기서는 child_id를 직접 참조하지 않으므로, payments 테이블을 거쳐야 함
            // 하지만 복잡하므로, payments 삭제 시 ON DELETE CASCADE가 아닌 수동 처리가 필요할 수 있음.
            // 일단 payments를 지우기 전에 payments_items를 지워야 함.

            // child_id로 연결된 payments 찾기
            const { data: userPayments } = await supabase.from('payments').select('id').eq('child_id', childId);
            const paymentIds = userPayments?.map(p => p.id) || [];

            if (paymentIds.length > 0) {
                await supabase.from('payment_items').delete().in('payment_id', paymentIds);
                await supabase.from('payments').delete().in('id', paymentIds);
            }

            // 2. 일정 관련 데이터 삭제 (schedules -> counseling_logs, daily_notes)
            const { data: userSchedules } = await supabase.from('schedules').select('id').eq('child_id', childId);
            const scheduleIds = userSchedules?.map(s => s.id) || [];

            if (scheduleIds.length > 0) {
                // 일정에 연결된 하위 데이터 삭제
                await supabase.from('counseling_logs').delete().in('schedule_id', scheduleIds);
                await supabase.from('daily_notes').delete().in('schedule_id', scheduleIds);
                await supabase.from('payment_items').delete().in('schedule_id', scheduleIds); // 일정 ID로 연결된 수납 상세도 삭제
                await supabase.from('consultations').delete().in('schedule_id', scheduleIds);

                // 일정 삭제
                await supabase.from('schedules').delete().in('id', scheduleIds);
            }

            // 3. 아동 직접 연결 데이터 삭제
            await supabase.from('counseling_logs').delete().eq('child_id', childId);
            await supabase.from('daily_notes').delete().eq('child_id', childId);
            await supabase.from('consultations').delete().eq('child_id', childId);
            await supabase.from('child_therapist').delete().eq('child_id', childId);
            await supabase.from('vouchers').delete().eq('child_id', childId);

            // 4. 리드(상담문의) 연결 해제 (삭제하지 않고 연결 끊기)
            await supabase.from('leads').update({ converted_child_id: null }).eq('converted_child_id', childId);

            // 5. 최종 아동 삭제
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">아동 정보 설정</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Email connection removed as per core operation phase 2 */}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-2 block ml-1">아동 이름</label>
                                <input type="text" required className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-2 block ml-1">생년월일</label>
                                <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-2 block ml-1">성별</label>
                                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="남">남성</option>
                                    <option value="여">여성</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-2 block ml-1">진단명</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-2 block ml-1">보호자 성함 (수동)</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200" value={formData.guardian_name} onChange={e => setFormData({ ...formData, guardian_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-2 block ml-1">연락처 (수동)</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        {childId && (
                            <button type="button" onClick={handleDelete} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors">
                                <Trash2 className="w-6 h-6" />
                            </button>
                        )}
                        <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-black py-5 rounded-[20px] flex justify-center items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />} 정보 저장하기
                        </button>
                    </div>
                </form>

                {/* ✨ 초대 코드 즉시 알림창 (Modal 위에 덮어씌움) */}
                <InvitationCodeAlert
                    isOpen={showCodeAlert}
                    onClose={() => {
                        setShowCodeAlert(false);
                        onSuccess(); // 알림창 닫으면 그제서야 모달 닫기
                    }}
                    childName={newChildName}
                    invitationCode={newChildCode}
                />
            </div>
        </div>
    );
}