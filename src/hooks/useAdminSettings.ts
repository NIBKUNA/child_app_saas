import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ✨ [Logo Cache] localStorage 키
const BRAND_CACHE_KEY = 'brand_cache';

// Define the keys we expect to use
export type AdminSettingKey =
    | 'home_title'
    | 'home_subtitle'
    | 'kakao_url'
    | 'main_banner_url'
    | 'notice_text'
    | 'about_intro_text'
    | 'about_main_image'
    | 'about_desc_title'
    | 'about_desc_body'
    | 'programs_intro_text'
    | 'programs_list'
    | 'center_logo'
    | 'center_name'
    | 'center_phone'
    | 'center_address'
    | 'center_map_url'
    | 'ai_posting_day'
    | 'ai_posting_time'
    | 'ai_next_topic';

export interface ProgramItem {
    id: string;
    title: string;
    eng: string;
    desc: string;
    targets: string[];
    icon_name: string;
}

export interface AdminSetting {
    key: string;
    value: string | null;
    updated_at: string | null;
}

// ✨ [Brand Cache] localStorage에서 브랜드 정보 불러오기
function getCachedBrand(): Record<string, string | null> {
    try {
        const cached = localStorage.getItem(BRAND_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) { }
    return {};
}

// ✨ [Brand Cache] localStorage에 브랜드 정보 저장
function setCachedBrand(settings: Record<string, string | null>) {
    try {
        const brandData = {
            center_logo: settings['center_logo'] || null,
            center_name: settings['center_name'] || null
        };
        localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(brandData));
    } catch (e) { }
}

export const useAdminSettings = () => {
    // ✨ [Flash Prevention] 캐시된 브랜드 데이터로 초기화
    const [settings, setSettings] = useState<Record<string, string | null>>(() => getCachedBrand());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all settings
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('admin_settings') as any)
                .select('*');

            if (error) throw error;

            if (data) {
                const settingsMap: Record<string, string | null> = {};
                data.forEach((item: any) => {
                    settingsMap[item.key] = item.value;
                });
                setSettings(settingsMap);

                // ✨ 브랜드 정보 캐시 업데이트
                setCachedBrand(settingsMap);
            }
        } catch (err: any) {
            console.error('Error fetching admin settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update a specific setting
    const updateSetting = async (key: AdminSettingKey, value: string) => {
        try {
            const { error } = await (supabase
                .from('admin_settings') as any)
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Optimistic update
            setSettings(prev => {
                const updated = { ...prev, [key]: value };
                // ✨ 브랜드 정보 캐시 업데이트
                if (key === 'center_logo' || key === 'center_name') {
                    setCachedBrand(updated);
                }
                return updated;
            });

            // ✨ [Global Sync] 설정 변경 이벤트 발송 (다른 컴포넌트 즉시 갱신)
            window.dispatchEvent(new Event('settings-updated'));

            return { success: true };
        } catch (err: any) {
            console.error(`Error updating setting ${key}:`, err);
            return { success: false, error: err.message };
        }
    };

    // Initial fetch & Listener
    useEffect(() => {
        fetchSettings();

        // ✨ [Global Sync] 이벤트 리스너 등록
        const handleSync = () => {
            console.log('🔄 Settings Sync Triggered');
            fetchSettings();
        };
        window.addEventListener('settings-updated', handleSync);

        return () => {
            window.removeEventListener('settings-updated', handleSync);
        };
    }, []);

    const getSetting = (key: AdminSettingKey) => settings[key] || '';

    return {
        settings,
        loading,
        error,
        getSetting,
        updateSetting,
        refresh: fetchSettings
    };
};
