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
/**
 * ============================================
 * 🎨 ZARADA - Program Custom SVG Icons
 * 각 프로그램별 커스텀 아이콘
 * ============================================
 */

// 언어치료 아이콘
export function SpeechTherapyIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>{`
                @keyframes speak { 
                    0%, 100% { transform: scaleX(1); } 
                    50% { transform: scaleX(1.2); } 
                }
                .speak-animate { animation: speak 1s ease-in-out infinite; transform-origin: left; }
            `}</style>
            <circle cx="32" cy="32" r="28" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
            <circle cx="24" cy="28" r="10" fill="#6366F1" />
            <path className="speak-animate" d="M38 24 Q48 28 48 32 Q48 36 38 40" stroke="#6366F1" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M42 28 Q50 32 42 36" stroke="#A5B4FC" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
    );
}

// 놀이치료 아이콘
export function PlayTherapyIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>{`
                @keyframes bounce { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(-4px); } 
                }
                .bounce-animate { animation: bounce 0.8s ease-in-out infinite; }
            `}</style>
            <circle cx="32" cy="32" r="28" fill="#FDF2F8" stroke="#FBCFE8" strokeWidth="2" />
            <circle className="bounce-animate" cx="22" cy="24" r="8" fill="#EC4899" />
            <rect className="bounce-animate" x="34" y="20" width="12" height="12" rx="3" fill="#F472B6" style={{ animationDelay: '0.2s' }} />
            <polygon className="bounce-animate" points="28,40 36,48 20,48" fill="#F9A8D4" style={{ animationDelay: '0.4s' }} />
        </svg>
    );
}

// 인지치료 아이콘
export function CognitiveTherapyIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>{`
                @keyframes think { 
                    0%, 100% { opacity: 1; } 
                    50% { opacity: 0.5; } 
                }
                .think-animate { animation: think 1.5s ease-in-out infinite; }
            `}</style>
            <circle cx="32" cy="32" r="28" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="2" />
            <path d="M24 32 C24 24 32 20 40 24 C46 28 44 36 38 38 C34 40 32 44 32 48" stroke="#8B5CF6" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle className="think-animate" cx="32" cy="52" r="2" fill="#8B5CF6" />
            <circle className="think-animate" cx="20" cy="20" r="3" fill="#C4B5FD" style={{ animationDelay: '0.3s' }} />
            <circle className="think-animate" cx="44" cy="18" r="2" fill="#DDD6FE" style={{ animationDelay: '0.6s' }} />
        </svg>
    );
}

// 감각통합치료 아이콘
export function SensoryTherapyIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>{`
                @keyframes pulse { 
                    0%, 100% { transform: scale(1); opacity: 0.6; } 
                    50% { transform: scale(1.3); opacity: 0.2; } 
                }
                .pulse-ring { animation: pulse 2s ease-in-out infinite; transform-origin: center; }
            `}</style>
            <circle cx="32" cy="32" r="28" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="2" />
            <circle className="pulse-ring" cx="32" cy="32" r="16" stroke="#10B981" strokeWidth="2" fill="none" />
            <circle className="pulse-ring" cx="32" cy="32" r="12" stroke="#34D399" strokeWidth="2" fill="none" style={{ animationDelay: '0.5s' }} />
            <circle cx="32" cy="32" r="6" fill="#10B981" />
        </svg>
    );
}

// 사회성그룹 아이콘
export function SocialGroupIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2" />
            <circle cx="22" cy="26" r="6" fill="#F59E0B" />
            <circle cx="42" cy="26" r="6" fill="#FBBF24" />
            <circle cx="32" cy="42" r="6" fill="#FCD34D" />
            <path d="M24 30 L30 38 M34 38 L40 30 M30 38 L34 38" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// 발달검사 아이콘
export function AssessmentIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>{`
                @keyframes check { 
                    0% { stroke-dashoffset: 20; } 
                    100% { stroke-dashoffset: 0; } 
                }
                .check-animate { stroke-dasharray: 20; animation: check 0.8s ease-out forwards; }
            `}</style>
            <circle cx="32" cy="32" r="28" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="2" />
            <rect x="20" y="16" width="24" height="32" rx="4" fill="#0EA5E9" opacity="0.2" />
            <rect x="22" y="18" width="20" height="28" rx="3" fill="white" stroke="#0EA5E9" strokeWidth="1.5" />
            <path className="check-animate" d="M26 30 L30 34 L38 24" stroke="#0EA5E9" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="26" y1="40" x2="38" y2="40" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// 미술치료 아이콘
export function ArtTherapyIcon({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>{`
                @keyframes paint { 
                    0%, 100% { transform: rotate(-5deg); } 
                    50% { transform: rotate(5deg); } 
                }
                .paint-animate { animation: paint 1s ease-in-out infinite; transform-origin: 32px 48px; }
            `}</style>
            <circle cx="32" cy="32" r="28" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="2" />
            {/* Palette */}
            <ellipse cx="32" cy="36" rx="16" ry="12" fill="#F59E0B" opacity="0.3" />
            {/* Paint dots */}
            <circle cx="24" cy="32" r="4" fill="#EF4444" />
            <circle cx="34" cy="28" r="4" fill="#3B82F6" />
            <circle cx="40" cy="34" r="4" fill="#10B981" />
            <circle cx="28" cy="40" r="3" fill="#8B5CF6" />
            {/* Brush */}
            <g className="paint-animate">
                <rect x="30" y="16" width="4" height="20" rx="2" fill="#78350F" />
                <path d="M30 16 L34 16 L33 10 L31 10 Z" fill="#D97706" />
            </g>
        </svg>
    );
}
