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

import { X } from 'lucide-react';
import { ConsultationSurveyForm } from './ConsultationSurveyForm';

interface ConsultationSurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        childName?: string;
        childBirthDate?: string;
        childGender?: 'male' | 'female' | 'other';
        guardianName?: string;
        guardianPhone?: string;
        childId?: string;
    };
}

export function ConsultationSurveyModal({ isOpen, onClose, initialData }: ConsultationSurveyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-[#FDFCFB] w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">상담 예약 신청서</h2>
                        <p className="text-sm text-slate-500 font-medium">아이의 발달 고민, 전문가와 상의하세요.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-8 overflow-y-auto">
                    <ConsultationSurveyForm
                        initialData={initialData}
                        onSuccess={() => setTimeout(onClose, 2000)}
                    />
                </div>
            </div>
        </div>
    );
}
