import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
    id: '',
    name: '자라다 아동발달센터',
    logo_url: null,
    phone: '00-0000-0000',
    address: '',
    email: '',
    weekday_hours: '09:00 - 19:00',
    saturday_hours: '09:00 - 16:00',
    holiday_text: '일요일/공휴일 휴무',
    settings: {}
};

export function useCenterBranding() {
    const { user } = useAuth();
    const [branding, setBranding] = useState<CenterBranding>({ ...DEFAULT_BRANDING, name: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                let centerId = '';

                // 1. If logged in, get center_id from profile
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('center_id')
                        .eq('id', user.id)
                        .single() as { data: { center_id: string } | null, error: any };
                    centerId = profile?.center_id || '';
                }

                // 2. If no user, check Domain (Public Access)
                if (!centerId) {
                    const hostname = window.location.hostname;
                    // For dev/test, if localhost, we might want a fallback or just specific logic
                    // Query admin_settings for the domain
                    // We assume there is a setting key 'domain_url' that stores the hostname
                    const { data: domainSetting } = await supabase
                        .from('admin_settings')
                        .select('center_id')
                        .eq('key', 'domain_url')
                        .ilike('value', `%${hostname}%`) // Flexible match
                        .maybeSingle(); // Use maybeSingle to avoid 406/errors if not found

                    if (domainSetting) {
                        centerId = domainSetting.center_id;
                    } else {
                        // Fallback: If no domain match (e.g. localhost initial), 
                        // attempt to fetch the "Main" center or first one to avoid empty screen
                        // For this SaaS, we'll fetch the first created center as default
                        const { data: firstCenter } = await supabase
                            .from('centers')
                            .select('id')
                            .order('created_at', { ascending: true })
                            .limit(1)
                            .maybeSingle();
                        if (firstCenter) centerId = firstCenter.id;
                    }
                }

                if (centerId) {
                    // Fetch Center Basic Info
                    const { data: center } = await supabase
                        .from('centers')
                        .select('*')
                        .eq('id', centerId)
                        .single() as { data: any, error: any };

                    if (center) {
                        // Fetch Admin Settings for this center
                        const { data: settings } = await supabase
                            .from('admin_settings')
                            .select('key, value')
                            .eq('center_id', centerId) as { data: any[], error: any };

                        const settingsMap: Record<string, any> = {};
                        settings?.forEach((s: any) => settingsMap[s.key] = s.value);

                        setBranding({
                            id: center.id,
                            name: settingsMap['center_name'] || center.name,
                            logo_url: settingsMap['center_logo'] || center.logo_url,
                            phone: settingsMap['center_phone'] || center.phone,
                            address: settingsMap['center_address'] || center.address,
                            email: center.email,
                            weekday_hours: center.weekday_hours || DEFAULT_BRANDING.weekday_hours,
                            saturday_hours: center.saturday_hours || DEFAULT_BRANDING.saturday_hours,
                            holiday_text: center.holiday_text || DEFAULT_BRANDING.holiday_text,
                            settings: settingsMap
                        });
                    }
                }

            } catch (error) {
                console.error('Branding fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBranding();
    }, [user]);

    return { branding, loading };
}
