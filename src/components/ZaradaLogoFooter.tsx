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
                <div className="relative inline-block font-black text-3xl tracking-tight">
                    {/* ✨ 'Z' Point Design */}
                    {branding.name ? (
                        <>
                            <span className="text-primary text-4xl mr-0.5">{branding.name.charAt(0)}</span>
                            <span className="text-slate-900">{branding.name.slice(1)}</span>
                        </>
                    ) : (
                        <div className="h-8 w-40 bg-slate-200 animate-pulse rounded"></div>
                    )}
                </div>
            )}
        </footer>
    );
}
