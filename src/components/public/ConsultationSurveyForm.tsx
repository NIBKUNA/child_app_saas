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
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTrafficSource } from '@/hooks/useTrafficSource';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// Custom SVG Icons (no Lucide)
const Icons = {
    checkCircle: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" />
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" />
        </svg>
    ),
    loader: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke="currentColor" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="currentColor" />
            <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" />
            <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" stroke="currentColor" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" stroke="currentColor" />
        </svg>
    ),
    send: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" />
        </svg>
    ),
    baby: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" stroke="currentColor" />
            <path d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2" stroke="currentColor" />
        </svg>
    ),
    message: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" />
        </svg>
    ),
    user: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" />
            <circle cx="12" cy="7" r="4" stroke="currentColor" />
        </svg>
    ),
};

interface ConsultationSurveyFormProps {
    centerId?: string; // ✨ Add centerId prop
    initialData?: {
        childName?: string;
        childBirthDate?: string;
        childGender?: 'male' | 'female' | 'other';
        guardianName?: string;
        guardianPhone?: string;
        childId?: string;
    };
    onSuccess?: () => void;
}

export function ConsultationSurveyForm({ centerId, initialData, onSuccess }: ConsultationSurveyFormProps) {
    const { getSource } = useTrafficSource();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const services = ['언어치료', '놀이치료', '감각통합', '인지학습', '사회성그룹', '발달검사'];

    // Initial birth date handling
    const initialBirth = initialData?.childBirthDate ? {
        year: initialData.childBirthDate.split('-')[0],
        month: String(parseInt(initialData.childBirthDate.split('-')[1])),
        day: String(parseInt(initialData.childBirthDate.split('-')[2]))
    } : { year: '', month: '', day: '' };

    const [birth, setBirth] = useState(initialBirth);

    const [formData, setFormData] = useState({
        child_name: initialData?.childName || '',
        child_gender: initialData?.childGender === 'female' ? '여아' : (initialData?.childGender === 'male' ? '남아' : '남아'),
        diagnosis: '아니오 (없음)',
        concern: '',
        preferred_service: [],
        parent_name: initialData?.guardianName || '',
        phone: initialData?.guardianPhone || '',
        relation: '',
        discovery_path: '' // ✨ New Field
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!birth.year || !birth.month || !birth.day) {
            alert('아이의 생년월일을 모두 선택해주세요.');
            return;
        }

        setLoading(true);

        try {
            const mappedGender = formData.child_gender === '남아' ? 'male' :
                formData.child_gender === '여아' ? 'female' : 'other';

            // 👑 [Sovereign Marketing] UTM & Inflow Source Binding
            // localStorage에서 마케팅 데이터 추출 (App.tsx에서 저장됨)
            const utmSource = localStorage.getItem('utm_source');
            const utmMedium = localStorage.getItem('utm_medium');
            const utmCampaign = localStorage.getItem('utm_campaign');
            const utmContent = localStorage.getItem('utm_content');

            // 사람이 읽기 좋은 형태로 포맷팅
            const marketingInfo = [
                utmSource ? `Source: ${utmSource}` : null,
                utmMedium ? `Medium: ${utmMedium}` : null,
                utmCampaign ? `Campaign: ${utmCampaign}` : null,
                utmContent ? `Content: ${utmContent}` : null,
            ].filter(Boolean).join(' / ');

            // ✨ [UNIFICATION] Submit to 'consultations' table (Source of Truth for Inquiry List)
            const { error } = await supabase.from('consultations').insert([{
                center_id: centerId,
                child_name: formData.child_name,
                child_gender: mappedGender,
                child_birth_date: `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`,
                guardian_name: formData.parent_name,
                guardian_phone: formData.phone,
                concern: `${formData.concern}\n\n[관리자 참고] 관계: ${formData.relation} / 장애진단: ${formData.diagnosis}`,
                preferred_consult_schedule: formData.preferred_service.join(', '),
                inflow_source: formData.discovery_path || getSource() || 'Direct', // ✨ Priority: User Selection > Auto Detection
                marketing_source: marketingInfo || null, // ✨ UTM Data Binding
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            setSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Submit Error:', err);
            alert('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    // Input & Select base styles
    const inputClass = cn(
        "w-full p-4 rounded-2xl border-none focus:ring-4 font-bold transition-colors",
        isDark
            ? "bg-slate-800 text-white placeholder-slate-500 focus:ring-indigo-900"
            : "bg-slate-50 text-slate-900 focus:ring-indigo-50"
    );

    const selectClass = cn(
        "w-full p-4 rounded-2xl border-none focus:ring-2 font-bold cursor-pointer appearance-none transition-colors",
        isDark
            ? "bg-slate-800 text-white focus:ring-indigo-900"
            : "bg-slate-50 text-slate-700 focus:ring-indigo-50"
    );

    if (submitted) {
        return (
            <div className={cn(
                "p-12 rounded-[40px] shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-500",
                isDark ? "bg-slate-800" : "bg-white"
            )}>
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                    isDark ? "bg-emerald-900 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                )}>
                    {Icons.checkCircle("w-10 h-10")}
                </div>
                <h2 className={cn("text-3xl font-black", isDark ? "text-white" : "text-slate-900")}>상담 신청 완료!</h2>
                <p className={cn("font-bold leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
                    작성해주신 내용을 확인하여 빠른 시일 내에 연락드리겠습니다.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className={cn(
                        "px-8 py-4 rounded-2xl font-black mx-auto block transition-colors",
                        isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                >
                    확인
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10 text-left">
            {/* 1. 아동 정보 섹션 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    {Icons.baby(cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600"))}
                    <h3 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>아동 정보</h3>
                </div>

                {/* ✨ 반응형 수정: 모바일에서 100% 너비, 데스크톱에서만 2열 그리드 */}
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                    <div className="space-y-2">
                        <label className={cn("text-sm font-black ml-1 block", isDark ? "text-slate-400" : "text-slate-400")}>
                            아이 이름 *
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="이름 입력"
                            className={inputClass}
                            onChange={e => setFormData({ ...formData, child_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className={cn("text-sm font-black ml-1 block", isDark ? "text-slate-400" : "text-slate-400")}>
                            생년월일 선택 *
                        </label>
                        {/* ✨ 반응형 수정: 좁은 화면에서 wrap 허용 */}
                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            <select
                                required
                                className={cn(selectClass, "flex-1 min-w-[80px]")}
                                value={birth.year}
                                onChange={e => setBirth({ ...birth, year: e.target.value })}
                            >
                                <option value="">년도</option>
                                {years.map(y => <option key={y} value={y}>{y}년</option>)}
                            </select>
                            <select
                                required
                                className={cn(selectClass, "flex-1 min-w-[60px]")}
                                value={birth.month}
                                onChange={e => setBirth({ ...birth, month: e.target.value })}
                            >
                                <option value="">월</option>
                                {months.map(m => <option key={m} value={m}>{m}월</option>)}
                            </select>
                            <select
                                required
                                className={cn(selectClass, "flex-1 min-w-[60px]")}
                                value={birth.day}
                                onChange={e => setBirth({ ...birth, day: e.target.value })}
                            >
                                <option value="">일</option>
                                {days.map(d => <option key={d} value={d}>{d}일</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                    <div className="space-y-2">
                        <label className={cn("text-sm font-black ml-1", isDark ? "text-slate-400" : "text-slate-400")}>성별</label>
                        <div className={cn(
                            "flex p-1.5 rounded-2xl",
                            isDark ? "bg-slate-800" : "bg-slate-50"
                        )}>
                            {['남아', '여아', '기타'].map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, child_gender: g })}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm transition-all",
                                        formData.child_gender === g
                                            ? (isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm")
                                            : (isDark ? "text-slate-500" : "text-slate-400")
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className={cn("text-sm font-black ml-1", isDark ? "text-slate-400" : "text-slate-400")}>장애진단 여부</label>
                        <select
                            className={selectClass}
                            onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                        >
                            <option>아니오 (없음)</option>
                            <option>유 (진단받음)</option>
                            <option>검사 예정</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* 2. 상담 신청 내용 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    {Icons.message(cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600"))}
                    <h3 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>상담 신청 내용</h3>
                </div>
                <textarea
                    required
                    placeholder="주요 고민 사항을 적어주세요."
                    rows={4}
                    className={cn(inputClass, "resize-none rounded-[24px]")}
                    onChange={e => setFormData({ ...formData, concern: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                    {services.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => {
                                const next = formData.preferred_service.includes(s)
                                    ? formData.preferred_service.filter(i => i !== s)
                                    : [...formData.preferred_service, s];
                                setFormData({ ...formData, preferred_service: next });
                            }}
                            className={cn(
                                "px-4 sm:px-5 py-3 rounded-full text-sm font-black transition-all border-2",
                                formData.preferred_service.includes(s)
                                    ? (isDark ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-900 border-slate-900 text-white")
                                    : (isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-100 text-slate-400")
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </section>

            {/* 3. 보호자 정보 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    {Icons.user(cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600"))}
                    <h3 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>보호자 정보</h3>
                </div>
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                    <input
                        required
                        type="text"
                        placeholder="보호자 성함 *"
                        className={inputClass}
                        onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                    />
                    <input
                        required
                        type="tel"
                        placeholder="연락처 *"
                        className={inputClass}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <input
                    type="text"
                    placeholder="아이와의 관계 (예: 모, 부, 조모)"
                    className={inputClass}
                    onChange={e => setFormData({ ...formData, relation: e.target.value })}
                />
            </section>

            {/* 4. 방문 경로 (Marketing Insight) */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2 rounded-xl", isDark ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" />
                            <circle cx="9" cy="7" r="4" stroke="currentColor" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" />
                        </svg>
                    </div>
                    <h3 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>방문 경로</h3>
                </div>
                <div className="space-y-2">
                    <label className={cn("text-sm font-black ml-1 block", isDark ? "text-slate-400" : "text-slate-400")}>
                        저희 센터를 어떻게 알고 오셨나요? *
                    </label>
                    <select
                        required
                        className={selectClass}
                        value={formData.discovery_path}
                        onChange={e => setFormData({ ...formData, discovery_path: e.target.value })}
                    >
                        <option value="">방문 경로 선택</option>
                        <optgroup label="온라인 채널">
                            <option value="Naver Blog">네이버 블로그 / 포스트</option>
                            <option value="Naver Place">네이버 지도 (플레이스)</option>
                            <option value="Google Search">구글 검색</option>
                            <option value="Instagram">인스타그램 / SNS</option>
                        </optgroup>
                        <optgroup label="오프라인 채널">
                            <option value="Referral">지인 소개</option>
                            <option value="Signage">센터 건물 간판 보고</option>
                            <option value="Flyer">전단지 / 홍보물</option>
                            <option value="Hospital">병원 연계 / 추천</option>
                            <option value="Partnership">협약기관 / MOU</option>
                        </optgroup>
                        <optgroup label="기타">
                            <option value="Others">기타</option>
                        </optgroup>
                    </select>
                </div>
            </section>

            <button
                disabled={loading}
                type="submit"
                className={cn(
                    "w-full py-5 sm:py-6 rounded-[24px] text-lg sm:text-xl font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50",
                    isDark
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                )}
            >
                {loading
                    ? Icons.loader("w-6 h-6 animate-spin")
                    : Icons.send("w-6 h-6")
                }
                상담 예약 신청하기
            </button>
        </form>
    );
}