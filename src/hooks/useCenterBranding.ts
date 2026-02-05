import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useCenter } from '@/contexts/CenterContext';

export interface CenterBranding {
    id: string;
    name: string;
    logo_url: string | null;
    phone: string | null;
    address: string | null;
    email: string | null;
    weekday_hours: string | null;
    saturday_hours: string | null;
    holiday_text: string | null;
    brand_color: string | null; // ✨ New
    settings: Record<string, any>;
}

const DEFAULT_BRANDING: CenterBranding = {
    id: '',
    name: 'Zarada',
    logo_url: '/zarada_tree_logo.png',
    phone: '',
    address: '',
    email: '',
    weekday_hours: '',
    saturday_hours: '',
    holiday_text: '일요일/공휴일 휴무',
    brand_color: '#4f46e5',
    settings: {
        center_email: '',
        center_address: '',
        center_phone: ''
    }
};

export function useCenterBranding() {
    const { center } = useCenter();
    const { settings: adminSettings, loading: adminLoading } = useAdminSettings();

    // ✨ [Instant Render] Try LocalStorage First -> Then Default -> Then Async Update
    const cacheKey = center?.id ? `cached_branding_v3_${center.id}` : null;
    const cachedBrandingStr = cacheKey ? localStorage.getItem(cacheKey) : null;
    const initialBranding = (() => {
        try {
            if (cachedBrandingStr) {
                const parsed = JSON.parse(cachedBrandingStr);
                if (parsed.id === center?.id) return parsed;
            }
        } catch (e) { }
        return center?.id ? { ...DEFAULT_BRANDING, id: center.id, name: center.name } : DEFAULT_BRANDING;
    })();

    const [branding, setBranding] = useState<CenterBranding>(initialBranding);
    const [centerLoading, setCenterLoading] = useState(!cachedBrandingStr);

    useEffect(() => {
        if (!center?.id) {
            setBranding(DEFAULT_BRANDING);
            return;
        }

        const fetchCenterData = async () => {
            try {
                // ✨ Fetch Real Center Data (Source of Truth for Core Info)
                const { data: centerData } = await supabase
                    .from('centers')
                    .select('*')
                    .eq('id', center.id)
                    .maybeSingle();

                if (centerData) {
                    const data = centerData as any;
                    const newBranding = {
                        ...branding,
                        id: data.id,
                        name: data.name,
                        phone: data.phone,
                        address: data.address,
                        email: data.email,
                        weekday_hours: data.weekday_hours,
                        saturday_hours: data.saturday_hours,
                        holiday_text: data.holiday_text,
                        logo_url: branding.logo_url // updated by adminSettings separately
                    };

                    setBranding(newBranding);
                    // ✨ Cache Immediately with specific key
                    localStorage.setItem(`cached_branding_v3_${center.id}`, JSON.stringify(newBranding));
                }
            } catch (err) {
                console.error("Failed to fetch center info:", err);
            } finally {
                setCenterLoading(false);
            }
        };

        fetchCenterData();
    }, [center]);

    // ✨ [Optimization] derives final branding directly to prevent flicker (no !adminLoading check)
    // We use adminSettings immediately since it's initialized from cache in useAdminSettings
    const finalBranding = (center?.id && adminSettings) ? {
        ...branding,
        // Priority: DB Name (branding.name) > Admin Settings (adminSettings.center_name)
        name: branding.name || adminSettings.center_name || DEFAULT_BRANDING.name,
        phone: adminSettings.center_phone || branding.phone,
        address: adminSettings.center_address || branding.address,
        email: adminSettings.center_email || branding.email,
        logo_url: adminSettings.center_logo || branding.logo_url,
        // ✨ [Sync Fix] 운영시간도 admin_settings 우선 적용 (즉시 반영 목적)
        weekday_hours: adminSettings.center_weekday_hours || branding.weekday_hours,
        saturday_hours: adminSettings.center_saturday_hours || branding.saturday_hours,
        holiday_text: adminSettings.center_holiday_text || branding.holiday_text,
        brand_color: adminSettings.brand_color || branding.brand_color || '#4f46e5',
        settings: {
            ...adminSettings, // Pass all settings for helper lookups
            sns_instagram: adminSettings.sns_instagram,
            sns_facebook: adminSettings.sns_facebook,
            sns_youtube: adminSettings.sns_youtube,
            sns_blog: adminSettings.sns_blog
        }
    } : branding;

    return { branding: finalBranding, loading: adminLoading || centerLoading };
}
