
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
import { X, Loader2, Save, Trash2 } from 'lucide-react';
import { InvitationCodeAlert } from '@/components/InvitationCodeAlert';
import { useCenter } from '@/contexts/CenterContext';

// ✨ 아동 모달 Props 타입
interface ChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    childId: string | null;
    onSuccess: () => void;
}

// ✨ 아동 폼 데이터 타입 (UI 용)
interface ChildFormData {
    name: string;
    registration_number: string;
    birth_date: string;
    gender: '남' | '여';           // UI에서의 성별 표시
    diagnosis: string;
    guardian_name: string;
    contact: string;
    notes: string;                  // 메모/비고
    school_name: string;            // 학교명
    grade: string;                  // 학년
    inflow_source: string;          // 유입경로
    medical_history: string;        // 의료이력
    center_id: string;
}

// ✨ Supabase 저장용 데이터 타입
interface ChildSubmissionData {
    name: string;
    registration_number: string | null;
    birth_date: string;              // DB에서 NOT NULL
    gender: 'male' | 'female';   // DB Enum
    diagnosis: string | null;
    guardian_name: string | null;
    contact: string | null;
    notes: string | null;
    school_name: string | null;
    grade: string | null;
    inflow_source: string | null;
    medical_history: string | null;
    center_id: string;
}

// ✨ 아동 정보 응답 타입 (Supabase)
interface ChildData {
    id: string;
    name: string;
    registration_number: string | null;
    birth_date: string | null;
    gender: 'male' | 'female' | null;
    diagnosis: string | null;
    guardian_name: string | null;
    contact: string | null;
    notes: string | null;
    school_name: string | null;
    grade: string | null;
    inflow_source: string | null;
    medical_history: string | null;
    center_id: string;
    invitation_code: string | null;
}

export function ChildModal({ isOpen, onClose, childId, onSuccess }: ChildModalProps) {
    const [loading, setLoading] = useState(false);
    const { center } = useCenter(); // ✨ Use center
    const centerId = center?.id;
    // ✨ [Removed] Manual Parent Connection State
    const [showCodeAlert, setShowCodeAlert] = useState(false);
    const [newChildCode, setNewChildCode] = useState('');
    const [newChildName, setNewChildName] = useState('');
    const [formData, setFormData] = useState<ChildFormData>({
        name: '',
        registration_number: '',
        birth_date: '',
        gender: '남',
        diagnosis: '',
        guardian_name: '',
        contact: '',
        notes: '',
        school_name: '',
        grade: '',
        inflow_source: '',
        medical_history: '',
        center_id: ''
    });

    useEffect(() => {
        if (isOpen && centerId) {
            if (childId) {
                loadChild();
            } else {
                setFormData({
                    name: '', registration_number: '', birth_date: '', gender: '남',
                    diagnosis: '', guardian_name: '', contact: '',
                    notes: '', school_name: '', grade: '', inflow_source: '', medical_history: '',
                    center_id: centerId
                });
            }
        }
    }, [isOpen, childId, centerId]);

    // ✨ [Removed] fetchParentAccounts logic

    const loadChild = async () => {
        const { data } = await supabase.from('children').select('*').eq('id', childId!).single();
        const childData = data as ChildData | null;
        if (childData) {
            setFormData({
                name: childData.name,
                registration_number: childData.registration_number || '',
                birth_date: childData.birth_date || '',
                diagnosis: childData.diagnosis || '',
                guardian_name: childData.guardian_name || '',
                contact: childData.contact || '',
                gender: childData.gender === 'male' ? '남' : '여',
                notes: childData.notes || '',
                school_name: childData.school_name || '',
                grade: childData.grade || '',
                inflow_source: childData.inflow_source || '',
                medical_history: childData.medical_history || '',
                center_id: childData.center_id
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!centerId) return alert('센터 정보가 없습니다.');
        setLoading(true);

        try {
            const submissionData: ChildSubmissionData = {
                name: formData.name,
                registration_number: formData.registration_number || null,
                birth_date: formData.birth_date || new Date().toISOString().split('T')[0], // NOT NULL 보장
                gender: formData.gender === '남' ? 'male' : 'female',
                diagnosis: formData.diagnosis || null,
                guardian_name: formData.guardian_name || null,
                contact: formData.contact || null,
                notes: formData.notes || null,
                school_name: formData.school_name || null,
                grade: formData.grade || null,
                inflow_source: formData.inflow_source || null,
                medical_history: formData.medical_history || null,
                center_id: centerId
            };

            let result;
            if (childId) {
                result = await supabase.from('children').update(submissionData).eq('id', childId);
                if (result.error) throw result.error;
                alert('성공적으로 저장되었습니다.');
                onSuccess();
            } else {
                result = await supabase.from('children')
                    .insert([{ ...submissionData }])
                    .select('invitation_code, name')
                    .single();

                if (result.error) throw result.error;

                setNewChildName(submissionData.name);
                setNewChildCode(result.data?.invitation_code || '');
                setShowCodeAlert(true);
            }
        } catch (error) {
            console.error('저장 실패 상세:', error);
            if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23503') {
                alert('저장 실패: 선택한 보호자 계정이 유효하지 않습니다. 다시 선택해주세요.');
            } else {
                const errMsg = error instanceof Error ? error.message : '데이터 형식을 확인해주세요.';
                alert('저장 실패: ' + errMsg);
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
            const { error } = await supabase.from('children').delete().eq('id', childId!);
            if (error) throw error;

            alert('아동 및 관련 데이터가 모두 삭제되었습니다.');
            onSuccess();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 text-slate-900 dark:text-white";
    const labelClass = "text-xs font-black text-slate-500 dark:text-slate-400 mb-2 block ml-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">아동 정보 설정</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-md rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* 기본 정보 */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">기본 정보</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>아동 이름 *</label>
                                <input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>생년월일</label>
                                <input type="date" className={`${inputClass} dark:[color-scheme:dark]`} value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>성별</label>
                                <select className={inputClass} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as '남' | '여' })}>
                                    <option value="남">남성</option>
                                    <option value="여">여성</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>진단명</label>
                                <input type="text" className={inputClass} placeholder="예: ADHD, ASD 등" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>보호자 성함</label>
                                <input type="text" className={inputClass} value={formData.guardian_name} onChange={e => setFormData({ ...formData, guardian_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>연락처</label>
                                <input type="text" className={inputClass} placeholder="010-0000-0000" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* 추가 정보 */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">추가 정보</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>학교/유치원</label>
                                <input type="text" className={inputClass} value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>학년/반</label>
                                <input type="text" className={inputClass} placeholder="예: 초3, 6세" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>유입경로</label>
                                <input type="text" className={inputClass} placeholder="지인소개 등" value={formData.inflow_source} onChange={e => setFormData({ ...formData, inflow_source: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* 의료이력 & 메모 */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">메모 & 특이사항</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>의료 이력</label>
                                <textarea
                                    className={`${inputClass} min-h-[60px] resize-y`}
                                    placeholder="수술 이력, 투약 정보 등"
                                    value={formData.medical_history}
                                    onChange={e => setFormData({ ...formData, medical_history: e.target.value })}
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>메모 / 비고</label>
                                <textarea
                                    className={`${inputClass} min-h-[60px] resize-y`}
                                    placeholder="기타 참고 사항을 입력하세요"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                />
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