/**
 * 🎨 Project: Zarada ERP
 * Refactored for Multi-tenancy Support
 */
import { useCenterBranding } from '@/hooks/useCenterBranding';

export function ZaradaLogoFooter() {
    const { branding } = useCenterBranding();

    return (
        <footer className="w-full py-12 flex items-center justify-center bg-[#f8f8f8]">
            {branding.logo_url ? (
                <img
                    src={branding.logo_url}
                    alt={branding.name}
                    className="h-16 w-auto object-contain transition-all hover:scale-105"
                />
            ) : (
                /* Fallback to Text Logo if no image */
                <div className="relative inline-block">
                    <div className="absolute rounded-full bg-[#6ABF69]" style={{ top: '-12px', right: '10px', width: '8px', height: '8px' }} />
                    <span
                        style={{
                            fontFamily: "sans-serif", // Simplified for generic
                            fontSize: '48px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            background: 'linear-gradient(90deg, #5BC4D4, #6B9FD6, #8B7BBF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        {branding.name}
                    </span>
                </div>
            )}
        </footer>
    );
}
