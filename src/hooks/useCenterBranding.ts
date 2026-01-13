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
    const [branding, setBranding] = useState<CenterBranding>(DEFAULT_BRANDING);
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

                // 2. If no user or no center (e.g. public page or public user), 
                // In a real multi-tenant app with subdomains, we would parse window.location.hostname
                // For now, if no centerId, we might fetch the first one as fallback OR allow "Global" via a specific query param.
                // However, to fix the "limit(1)" issue safely:
                // If we can't identify the center, we should show "Platform Default" or nothing precise.
                // But for this project context, if user is not logged in, maybe we fallback to a "Demo Center" or just keep default.
                // Let's assume there is at least one center and we might pick specific one via ENV or DB config if needed.
                // For safety: if no centerId, return DEFAULT.

                if (!centerId) {
                    // Fallback for demo/dev: Try to get the first center ONLY if we truly have no context.
                    // But 'limit(1)' was the bug. Ideally we shouldn't do this.
                    // Let's check if there's an environment variable for DEFAULT_CENTER_ID
                    // centerId = import.meta.env.VITE_DEFAULT_CENTER_ID;
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
                            name: settingsMap['center_name'] || center.name, // Setting overrides DB column
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
