// @ts-nocheck
/* eslint-disable */
/**
 * ============================================
 * 🎨 ZARADA - Custom Brand SVG Icons
 * 커스텀 SVG 인포그래픽 with 애니메이션
 * ============================================
 */

// 성장하는 아이 아이콘 (stroke-dasharray 애니메이션)
export function GrowthIcon({ className = "w-16 h-16" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>
                {`
                    @keyframes drawStroke {
                        from { stroke-dashoffset: 200; }
                        to { stroke-dashoffset: 0; }
                    }
                    .animate-draw {
                        stroke-dasharray: 200;
                        stroke-dashoffset: 200;
                        animation: drawStroke 2s ease-out forwards;
                    }
                `}
            </style>
            <circle cx="32" cy="32" r="28" stroke="#E0E7FF" strokeWidth="2" fill="#EEF2FF" />
            <path
                className="animate-draw"
                d="M20 44 C20 44 24 36 32 36 C40 36 44 44 44 44"
                stroke="#6366F1"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="32" cy="24" r="8" fill="#6366F1" />
            <path
                className="animate-draw"
                d="M32 32 L32 48"
                stroke="#6366F1"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ animationDelay: '0.5s' }}
            />
        </svg>
    );
}

// 하트 케어 아이콘
export function HeartCareIcon({ className = "w-16 h-16" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                    .heart-pulse {
                        animation: pulse 2s ease-in-out infinite;
                        transform-origin: center;
                    }
                `}
            </style>
            <circle cx="32" cy="32" r="28" stroke="#FCE7F3" strokeWidth="2" fill="#FDF2F8" />
            <g className="heart-pulse">
                <path
                    d="M32 46 C32 46 16 36 16 26 C16 20 22 16 28 16 C31 16 32 18 32 18 C32 18 33 16 36 16 C42 16 48 20 48 26 C48 36 32 46 32 46Z"
                    fill="#F472B6"
                />
            </g>
            <path
                d="M20 32 L28 32 L30 28 L34 36 L36 32 L44 32"
                stroke="#EC4899"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

// 별빛 아이콘
export function StarIcon({ className = "w-16 h-16" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>
                {`
                    @keyframes twinkle {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    .star-twinkle {
                        animation: twinkle 1.5s ease-in-out infinite;
                    }
                `}
            </style>
            <circle cx="32" cy="32" r="28" stroke="#FEF3C7" strokeWidth="2" fill="#FFFBEB" />
            <path
                className="star-twinkle"
                d="M32 12 L35 26 L49 26 L38 34 L42 48 L32 40 L22 48 L26 34 L15 26 L29 26 Z"
                fill="#F59E0B"
            />
        </svg>
    );
}

// 연결 아이콘 (가족 중심)
export function ConnectionIcon({ className = "w-16 h-16" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>
                {`
                    @keyframes connect {
                        0% { stroke-dashoffset: 50; }
                        100% { stroke-dashoffset: 0; }
                    }
                    .connect-line {
                        stroke-dasharray: 50;
                        animation: connect 1.5s ease-out forwards;
                    }
                `}
            </style>
            <circle cx="32" cy="32" r="28" stroke="#D1FAE5" strokeWidth="2" fill="#ECFDF5" />
            <circle cx="20" cy="28" r="6" fill="#10B981" />
            <circle cx="44" cy="28" r="6" fill="#10B981" />
            <circle cx="32" cy="44" r="5" fill="#34D399" />
            <path
                className="connect-line"
                d="M23 33 L30 40 M35 40 L41 33 M32 39 L32 35"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

// 배경 장식용 추상 도형
export function BackgroundShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top Right Blob */}
            <svg
                className="absolute top-0 right-0 w-[600px] h-[600px] text-indigo-50 opacity-50"
                viewBox="0 0 600 600"
                fill="currentColor"
            >
                <circle cx="500" cy="100" r="150" />
                <circle cx="400" cy="200" r="80" />
            </svg>

            {/* Bottom Left Blob */}
            <svg
                className="absolute bottom-0 left-0 w-[400px] h-[400px] text-violet-50 opacity-40"
                viewBox="0 0 400 400"
                fill="currentColor"
            >
                <ellipse cx="100" cy="300" rx="200" ry="150" />
            </svg>

            {/* Floating Dots */}
            <svg className="absolute top-1/4 left-1/4 w-4 h-4 text-indigo-200" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="8" />
            </svg>
            <svg className="absolute top-1/3 right-1/3 w-3 h-3 text-rose-200" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="6" />
            </svg>
            <svg className="absolute bottom-1/4 right-1/4 w-5 h-5 text-amber-200" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="10" />
            </svg>
        </div>
    );
}
