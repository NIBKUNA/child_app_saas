// @ts-nocheck
/* eslint-disable */
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTrafficSource } from '@/hooks/useTrafficSource';
import { CheckCircle2, Loader2, Send, Baby, MessageSquare, UserCircle } from 'lucide-react';

export function ConsultationSurveyForm() {
    const { getSource } = useTrafficSource();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // 연, 월, 일 상태 관리
    const [birth, setBirth] = useState({ year: '', month: '', day: '' });
    const [formData, setFormData] = useState({
        child_name: '',
        child_gender: '남아',
        diagnosis: '아니오 (없음)',
        concern: '',
        preferred_service: [],
        parent_name: '',
        phone: '',
        relation: ''
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const services = ['언어치료', '놀이치료', '감각통합', '인지학습', '사회성그룹', '발달검사'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!birth.year || !birth.month || !birth.day) {
            alert('아이의 생년월일을 모두 선택해주세요.');
            return;
        }

        setLoading(true);

        try {
            const fullBirthDate = `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`;

            // ✨ [해결 핵심 1] DB ENUM 형식에 맞게 성별값 영문 변환 (male/female)
            const mappedGender = formData.child_gender === '남아' ? 'male' :
                formData.child_gender === '여아' ? 'female' : 'other';

            // ✨ [해결 핵심 2] DB에 없는 컬럼(relation, diagnosis)은 제외하고 admin_notes에 합쳐서 전송
            const { error } = await supabase.from('leads').insert([{
                parent_name: formData.parent_name,
                phone: formData.phone,
                child_name: formData.child_name,
                child_gender: mappedGender, // 영문 변환값 적용
                child_birth_year: parseInt(birth.year),
                concern: formData.concern,
                preferred_service: formData.preferred_service,
                // ✨ 실존하는 admin_notes 컬럼에 모든 추가 정보(상세생일, 관계, 진단) 기록
                admin_notes: `상세생일: ${fullBirthDate} / 관계: ${formData.relation} / 장애진단: ${formData.diagnosis}`,
                source: getSource() || 'Direct',
                status: 'new',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            setSubmitted(true);
        } catch (err) {
            console.error('Submit Error:', err);
            alert('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white p-12 rounded-[40px] shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 text-center">상담 신청 완료!</h2>
                <p className="text-slate-500 font-bold leading-relaxed text-center">작성해주신 내용을 확인하여 빠른 시일 내에 연락드리겠습니다.</p>
                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black mx-auto block">확인</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl space-y-10 text-left border border-slate-100">
            {/* 1. 아동 정보 섹션 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2 text-left">
                    <Baby className="text-indigo-600 w-6 h-6" />
                    <h3 className="text-xl font-black text-slate-900">아동 정보</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-400 ml-1 block">아이 이름 *</label>
                        <input required type="text" placeholder="이름 입력" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 font-bold"
                            onChange={e => setFormData({ ...formData, child_name: e.target.value })} />
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-sm font-black text-slate-400 ml-1 block text-left">생년월일 선택 *</label>
                        <div className="flex gap-2">
                            {/* ✨ 년도 잘림 해결을 위해 flex 비율 조정 */}
                            <select required className="flex-[1.5] p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-50 font-bold text-sm cursor-pointer appearance-none"
                                value={birth.year} onChange={e => setBirth({ ...birth, year: e.target.value })}>
                                <option value="">년도</option>
                                {years.map(y => <option key={y} value={y}>{y}년</option>)}
                            </select>
                            <select required className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-50 font-bold text-sm cursor-pointer appearance-none"
                                value={birth.month} onChange={e => setBirth({ ...birth, month: e.target.value })}>
                                <option value="">월</option>
                                {months.map(m => <option key={m} value={m}>{m}월</option>)}
                            </select>
                            <select required className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-50 font-bold text-sm cursor-pointer appearance-none"
                                value={birth.day} onChange={e => setBirth({ ...birth, day: e.target.value })}>
                                <option value="">일</option>
                                {days.map(d => <option key={d} value={d}>{d}일</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-400 ml-1">성별</label>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                            {['남아', '여아', '기타'].map(g => (
                                <button key={g} type="button" onClick={() => setFormData({ ...formData, child_gender: g })}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${formData.child_gender === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-400 ml-1">장애진단 여부</label>
                        <select className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 cursor-pointer"
                            onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}>
                            <option>아니오 (없음)</option>
                            <option>유 (진단받음)</option>
                            <option>검사 예정</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* 2. 상담 신청 내용 */}
            <section className="space-y-6 text-left">
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="text-indigo-600 w-6 h-6" />
                    <h3 className="text-xl font-black text-slate-900">상담 신청 내용</h3>
                </div>
                <textarea required placeholder="주요 고민 사항을 적어주세요." rows={4} className="w-full p-5 bg-slate-50 rounded-[24px] border-none focus:ring-4 focus:ring-indigo-50 font-bold resize-none text-left"
                    onChange={e => setFormData({ ...formData, concern: e.target.value })} />
                <div className="flex flex-wrap gap-2 text-left">
                    {services.map(s => (
                        <button key={s} type="button" onClick={() => {
                            const next = formData.preferred_service.includes(s) ? formData.preferred_service.filter(i => i !== s) : [...formData.preferred_service, s];
                            setFormData({ ...formData, preferred_service: next });
                        }} className={`px-5 py-3 rounded-full text-sm font-black transition-all border-2 ${formData.preferred_service.includes(s) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>{s}</button>
                    ))}
                </div>
            </section>

            {/* 3. 보호자 정보 */}
            <section className="space-y-6 text-left">
                <div className="flex items-center gap-3 mb-2">
                    <UserCircle className="text-indigo-600 w-6 h-6" />
                    <h3 className="text-xl font-black text-slate-900">보호자 정보</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <input required type="text" placeholder="보호자 성함 *" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 font-bold"
                        onChange={e => setFormData({ ...formData, parent_name: e.target.value })} />
                    <input required type="tel" placeholder="연락처 *" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 font-bold"
                        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <input type="text" placeholder="아이와의 관계 (예: 모, 부, 조모)" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 font-bold"
                    onChange={e => setFormData({ ...formData, relation: e.target.value })} />
            </section>

            <button disabled={loading} type="submit" className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] text-xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300">
                {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />} 상담 예약 신청하기
            </button>
        </form>
    );
}