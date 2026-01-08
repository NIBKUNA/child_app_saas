// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Save, Trash2, UserCheck, AlertCircle, Mail } from 'lucide-react';

export function ChildModal({ isOpen, onClose, childId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [parents, setParents] = useState([]);
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
                .from('user_profiles')
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
            } else {
                result = await supabase.from('children').insert([submissionData]);
            }

            // ✨ 미세 조정 2: Supabase 에러 객체를 직접 체크하여 명확한 원인 파악
            if (result.error) {
                throw result.error;
            }

            alert('성공적으로 저장되었습니다.');
            onSuccess();
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
        if (!confirm('삭제하시겠습니까? 관련 일정도 모두 삭제될 수 있습니다.')) return;
        const { error } = await supabase.from('children').delete().eq('id', childId);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            onSuccess();
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
                    <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100 space-y-4">
                        <label className="text-xs font-black text-blue-600 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> 보호자 이메일 계정 연결
                        </label>
                        <select
                            className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none"
                            value={formData.parent_id}
                            onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                        >
                            <option value="">계정 연결 안 함 (이메일 선택)</option>
                            {parents.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} | {p.email}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-start gap-2 ml-1">
                            <AlertCircle className="w-3 h-3 text-blue-400 mt-0.5" />
                            <p className="text-[10px] text-blue-400 font-bold leading-relaxed">
                                보호자가 가입한 이메일을 선택해 주세요. 연결 시 해당 보호자가 아이 정보를 볼 수 있습니다.
                            </p>
                        </div>
                    </div>

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
            </div>
        </div>
    );
}