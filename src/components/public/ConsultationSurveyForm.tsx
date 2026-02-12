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
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTrafficSource } from '@/hooks/useTrafficSource';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { useTheme } from '@/contexts/ThemeProvider';
import { motion } from 'framer-motion';
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
    const { branding } = useCenterBranding();
    const brandColor = branding.brand_color || '#4f46e5';
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

    const [formData, setFormData] = useState<{
        child_name: string;
        child_gender: string;
        diagnosis: string;
        concern: string;
        preferred_service: string[];
        parent_name: string;
        phone: string;
        relation: string;
        discovery_path: string;
    }>({
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

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;
    const formContainerRef = useRef<HTMLDivElement>(null);

    const scrollToFormTop = () => {
        // ✨ [UX Fix] 웹 상단이 아닌, 폼 상단으로만 살짝 스크롤
        formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.child_name || !birth.year || !birth.month || !birth.day) {
                alert('필수 아동 정보를 모두 입력해주세요.');
                return;
            }
        }
        if (currentStep === 2) {
            if (!formData.concern) {
                alert('고민 사항을 입력해주세요.');
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        scrollToFormTop();
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        scrollToFormTop();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep < totalSteps) {
            nextStep();
            return;
        }

        if (!formData.parent_name || !formData.phone || !formData.discovery_path) {
            alert('보호자 정보와 방문 경로를 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        // ... (API call logic remains same)
        try {
            const mappedGender = formData.child_gender === '남아' ? 'male' :
                formData.child_gender === '여아' ? 'female' : 'other';

            const utmSource = localStorage.getItem('utm_source');
            const utmMedium = localStorage.getItem('utm_medium');
            const utmCampaign = localStorage.getItem('utm_campaign');
            const utmContent = localStorage.getItem('utm_content');

            const marketingInfo = [
                utmSource ? `Source: ${utmSource}` : null,
                utmMedium ? `Medium: ${utmMedium}` : null,
                utmCampaign ? `Campaign: ${utmCampaign}` : null,
                utmContent ? `Content: ${utmContent}` : null,
            ].filter(Boolean).join(' / ');

            if (!centerId) {
                alert('센터 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }

            const { error } = await (supabase.from('consultations')).insert([{
                center_id: centerId,
                child_name: formData.child_name,
                child_gender: mappedGender,
                child_birth_date: `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`,
                guardian_name: formData.parent_name,
                guardian_phone: formData.phone,
                concern: `${formData.concern}\n\n[관리자 참고] 관계: ${formData.relation} / 장애진단: ${formData.diagnosis}`,
                preferred_consult_schedule: formData.preferred_service.join(', '),
                inflow_source: formData.discovery_path || getSource() || 'Direct',
                marketing_source: marketingInfo || null,
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

    const inputClass = cn(
        "w-full p-4 rounded-2xl border-none focus:ring-4 font-bold transition-colors",
        isDark
            ? "bg-slate-800 text-white placeholder-slate-500 focus:ring-indigo-900"
            : "bg-slate-50 text-slate-900 focus:ring-indigo-100/50"
    );

    const selectClass = cn(
        "w-full p-4 rounded-2xl border-none focus:ring-2 font-bold cursor-pointer appearance-none transition-colors",
        isDark
            ? "bg-slate-800 text-white focus:ring-indigo-900"
            : "bg-slate-50 text-slate-700 focus:ring-indigo-100/50"
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
        <div ref={formContainerRef} className="space-y-12 scroll-mt-24">
            {/* ✨ Step Progress Bar */}
            <div className="flex items-center justify-between max-w-xs mx-auto mb-16">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center relative">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm z-10 transition-all duration-500",
                            currentStep === step
                                ? "text-white scale-110 shadow-lg"
                                : currentStep > step
                                    ? "bg-indigo-100 text-indigo-600"
                                    : (isDark ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-400")
                        )}
                            style={currentStep === step ? { backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` } : {}}
                        >
                            {currentStep > step ? Icons.checkCircle("w-5 h-5") : step}
                        </div>
                        {step < 3 && (
                            <div className={cn(
                                "absolute left-10 w-24 h-[2px] -z-0",
                                currentStep > step ? "" : (isDark ? "bg-slate-800" : "bg-slate-100")
                            )}
                                style={currentStep > step ? { backgroundColor: brandColor } : {}}
                            />
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 text-left">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {currentStep === 1 && (
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>아이 정보를 알려주세요</h3>
                                <p className="text-sm font-bold text-slate-400">상담을 위한 기본적인 아이 정보입니다.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">아이 이름 *</label>
                                    <input required type="text" placeholder="이름 입력" className={inputClass} value={formData.child_name} onChange={e => setFormData({ ...formData, child_name: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">생년월일 선택 *</label>
                                    <div className="flex gap-2">
                                        <select required className={selectClass} value={birth.year} onChange={e => setBirth({ ...birth, year: e.target.value })}>
                                            <option value="">년도</option>
                                            {years.map(y => <option key={y} value={y}>{y}년</option>)}
                                        </select>
                                        <select required className={selectClass} value={birth.month} onChange={e => setBirth({ ...birth, month: e.target.value })}>
                                            <option value="">월</option>
                                            {months.map(m => <option key={m} value={m}>{m}월</option>)}
                                        </select>
                                        <select required className={selectClass} value={birth.day} onChange={e => setBirth({ ...birth, day: e.target.value })}>
                                            <option value="">일</option>
                                            {days.map(d => <option key={d} value={d}>{d}일</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">성별</label>
                                        <div className={cn("flex p-1.5 rounded-2xl", isDark ? "bg-slate-800" : "bg-slate-50")}>
                                            {['남아', '여아'].map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, child_gender: g })}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl font-black text-sm transition-all",
                                                        formData.child_gender === g ? "bg-white shadow-sm" : (isDark ? "text-slate-500" : "text-slate-400")
                                                    )}
                                                    style={formData.child_gender === g ? { color: brandColor } : {}}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">장애진단 여부</label>
                                        <select className={selectClass} value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}>
                                            <option>아니오 (없음)</option>
                                            <option>유 (진단받음)</option>
                                            <option>검사 예정</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {currentStep === 2 && (
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>무엇이 고민이신가요?</h3>
                                <p className="text-sm font-bold text-slate-400">아이의 상황을 자세히 적어주시면 더 정확한 상담이 가능합니다.</p>
                            </div>

                            <div className="space-y-6">
                                <textarea required placeholder="주요 고민 사항을 적어주세요." rows={6} className={cn(inputClass, "resize-none rounded-[32px] p-6")} value={formData.concern} onChange={e => setFormData({ ...formData, concern: e.target.value })} />

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">관심 있는 프로그램 (중복 선택 가능)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {services.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => {
                                                    const next = formData.preferred_service.includes(s) ? formData.preferred_service.filter(i => i !== s) : [...formData.preferred_service, s];
                                                    setFormData({ ...formData, preferred_service: next });
                                                }}
                                                className={cn(
                                                    "px-5 py-3 rounded-full text-sm font-black transition-all border-2",
                                                    formData.preferred_service.includes(s) ? "text-white" : (isDark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400")
                                                )}
                                                style={formData.preferred_service.includes(s) ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {currentStep === 3 && (
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>마지막으로 연락처를 남겨주세요</h3>
                                <p className="text-sm font-bold text-slate-400">선생님이 확인 후 직접 연락드리겠습니다.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">보호자 성함 *</label>
                                        <input required type="text" placeholder="성함" className={inputClass} value={formData.parent_name} onChange={e => setFormData({ ...formData, parent_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">아이와의 관계</label>
                                        <input type="text" placeholder="예: 모, 부" className={inputClass} value={formData.relation} onChange={e => setFormData({ ...formData, relation: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">연락처 *</label>
                                    <input required type="tel" placeholder="010-0000-0000" className={inputClass} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>

                                <div className="space-y-2 pt-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">방문 경로 *</label>
                                    <select required className={selectClass} value={formData.discovery_path} onChange={e => setFormData({ ...formData, discovery_path: e.target.value })}>
                                        <option value="">저희 센터를 어떻게 알고 오셨나요?</option>
                                        <optgroup label="온라인">
                                            <option value="Naver Blog">네이버 블로그</option>
                                            <option value="Naver Place">네이버 지도</option>
                                            <option value="Instagram">인스타그램/SNS</option>
                                        </optgroup>
                                        <optgroup label="오프라인/지인">
                                            <option value="Referral">지인 소개</option>
                                            <option value="Hospital">병원 연계/추천</option>
                                            <option value="Others">기타</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}
                </motion.div>

                <div className="flex gap-4 pt-10">
                    {currentStep > 1 && (
                        <button type="button" onClick={prevStep} className={cn("px-8 py-5 rounded-[24px] font-black transition-all", isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                            이전
                        </button>
                    )}
                    <button
                        disabled={loading}
                        type="submit"
                        className={cn(
                            "flex-1 py-5 rounded-[24px] text-lg font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-white"
                        )}
                        style={{ backgroundColor: brandColor }}
                    >
                        {loading ? Icons.loader("w-6 h-6 animate-spin") : (currentStep === totalSteps ? Icons.send("w-5 h-5") : null)}
                        {currentStep === totalSteps ? "상담 예약 신청하기" : "다음 단계로"}
                    </button>
                </div>
            </form>
        </div>
    );
}