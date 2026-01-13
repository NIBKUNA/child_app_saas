import { useState } from 'react';
import { JAMSIL_CENTER_ID, CENTER_DEFAULTS } from '@/config/center';

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
    name: CENTER_DEFAULTS.name,
    logo_url: null,
    phone: CENTER_DEFAULTS.phone,
    address: CENTER_DEFAULTS.address,
    email: 'help@zarada.co.kr',
    weekday_hours: '09:00 - 20:00',
    saturday_hours: '09:00 - 17:00',
    holiday_text: '일요일/공휴일 휴무',
    settings: {}
};

export function useCenterBranding() {
    // ✨ [Direct Force] Initialize with Jamsil Defaults immediately (Zero Latency)
    const [branding] = useState<CenterBranding>(DEFAULT_BRANDING);
    const [loading] = useState(false);

    return { branding, loading };
}
