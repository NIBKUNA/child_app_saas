import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { JAMSIL_CENTER_ID, CENTER_DEFAULTS } from '@/config/center';
import { useAdminSettings } from '@/hooks/useAdminSettings';

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
    settings: Record<string, any>;
}

const DEFAULT_BRANDING: CenterBranding = {
    id: JAMSIL_CENTER_ID,
    name: CENTER_DEFAULTS.name || '자라다 아동발달센터',
    logo_url: null,
    phone: '',
    address: '',
    email: '',
    weekday_hours: '',
    saturday_hours: '',
    holiday_text: '일요일/공휴일 휴무',
    settings: {
        center_email: '',
        center_address: '',
        center_phone: ''
    }
};

export function useCenterBranding() {
    const { settings: adminSettings, loading: adminLoading } = useAdminSettings();

    // ✨ [Instant Render] Try LocalStorage First -> Then Default -> Then Async Update
    const [branding, setBranding] = useState<CenterBranding>(() => {
        try {
            const cached = localStorage.getItem('cached_branding_v2');
            if (cached) return JSON.parse(cached);
        } catch (e) { }
        return DEFAULT_BRANDING;
    });

    const [centerLoading, setCenterLoading] = useState(true);

    useEffect(() => {
        const fetchCenterData = async () => {
            try {
                // ✨ Fetch Real Center Data (Source of Truth for Core Info)
                const { data: centerData } = await supabase
                    .from('centers')
                    .select('*')
                    .eq('id', JAMSIL_CENTER_ID)
                    .maybeSingle();

                if (centerData) {
                    const data = centerData as any;
                    const newBranding = {
                        ...branding,
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
                    // ✨ Cache Immediately
                    localStorage.setItem('cached_branding_v2', JSON.stringify(newBranding));
                }
            } catch (err) {
                console.error("Failed to fetch center info:", err);
                // On error, we rely on DEFAULT_BRANDING or Cached data
            } finally {
                setCenterLoading(false);
            }
        };

        fetchCenterData();
    }, []);

    // ✨ [Optimization] derives final branding directly to prevent flicker (no useEffect sync)
    const finalBranding = (!adminLoading && adminSettings) ? {
        ...branding,
        name: adminSettings.center_name || branding.name,
        phone: adminSettings.center_phone || branding.phone,
        address: adminSettings.center_address || branding.address,
        email: adminSettings.center_email || branding.email,
        logo_url: adminSettings.center_logo || branding.logo_url,
        // ✨ [Sync Fix] 운영시간도 admin_settings 우선 적용 (즉시 반영 목적)
        weekday_hours: adminSettings.center_weekday_hours || branding.weekday_hours,
        saturday_hours: adminSettings.center_saturday_hours || branding.saturday_hours,
        holiday_text: adminSettings.center_holiday_text || branding.holiday_text,
        settings: {
            sns_instagram: adminSettings.sns_instagram,
            sns_facebook: adminSettings.sns_facebook,
            sns_youtube: adminSettings.sns_youtube,
            sns_blog: adminSettings.sns_blog
        }
    } : branding;

    return { branding: finalBranding, loading: adminLoading || centerLoading };
}
