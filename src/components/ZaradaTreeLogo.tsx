
export function ZaradaTreeLogo({ className = "h-8 w-auto" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 320 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Shadows */}
            <path d="M85 170L110 185H130L85 170Z" fill="#E2E8F0" />
            <path d="M160 170L190 190H215L160 170Z" fill="#E2E8F0" />
            <path d="M235 170L270 195H295L235 170Z" fill="#E2E8F0" />

            {/* Trunks */}
            <path d="M82 110L75 180H88L82 110Z" fill="#4B321F" />
            <path d="M82 110L95 130" stroke="#4B321F" strokeWidth="4" strokeLinecap="round" />

            <path d="M160 85L150 180H170L160 85Z" fill="#4B321F" />
            <path d="M160 100L175 125" stroke="#4B321F" strokeWidth="4" strokeLinecap="round" />

            <path d="M238 105L228 180H248L238 105Z" fill="#4B321F" />
            <path d="M238 120L253 145" stroke="#4B321F" strokeWidth="4" strokeLinecap="round" />

            {/* Foliage (Overlapping Circles with Transparency) */}
            <circle cx="80" cy="95" r="65" fill="#FACC15" fillOpacity="0.85" />
            <circle cx="160" cy="75" r="75" fill="#4ADE80" fillOpacity="0.85" />
            <circle cx="240" cy="100" r="70" fill="#22D3EE" fillOpacity="0.85" />
        </svg>
    );
}
