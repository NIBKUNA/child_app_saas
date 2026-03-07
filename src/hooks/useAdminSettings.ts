/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext';

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
    | 'home_story_title'
    | 'home_story_body'
    | 'home_story_image'
    | 'home_cta_text'
    | 'home_cta_link'
    | 'about_cta_text'
    | 'about_cta_link'
    | 'programs_list'
    | 'center_logo'
    | 'center_name'
    | 'center_phone'
    | 'center_address'
    | 'center_email'
    | 'center_map_url'
    | 'center_lat'
    | 'center_lng'
    | 'ai_posting_day'
    | 'ai_posting_time'
    | 'ai_next_topic'
    | 'brand_color'
    | 'seo_keywords'
    | 'banner_animation'
    | 'banner_duration'
    | 'sns_instagram'
    | 'sns_facebook'
    | 'sns_youtube'
    | 'sns_blog'
    | 'about_gallery'
    | 'therapists_intro_text'
    | 'center_weekday_hours'
    | 'center_saturday_hours'
    | 'center_holiday_text'
    | 'openai_api_key'
    | 'home_title_size'
    | 'home_subtitle_size'
    | 'home_story_title_size'
    | 'home_story_body_size'
    | 'seo_region'
    | 'reminder_hour';

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
function getCachedBrand(centerId: string): Record<string, string | null> {
    try {
        const cached = localStorage.getItem(`brand_cache_${centerId}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            return parsed.data || {};
        }
    } catch (e) { }
    return {};
}

// ✨ [Brand Cache] localStorage에 브랜드 정보 저장
function setCachedBrand(centerId: string, settings: Record<string, string | null>) {
    try {
        const brandData = {
            cid: centerId,
            data: {
                center_logo: settings['center_logo'] || null,
                center_name: settings['center_name'] || null,
                brand_color: settings['brand_color'] || null, // ✨ New
                main_banner_url: settings['main_banner_url'] || null
            }
        };
        localStorage.setItem(`brand_cache_${centerId}`, JSON.stringify(brandData));
    } catch (e) { }
}

export const useAdminSettings = () => {
    const { center } = useCenter();

    // ✨ [Flash Prevention] 캐시된 브랜드 데이터로 초기화
    const cachedData = center?.id ? getCachedBrand(center.id) : {};
    const [settings, setSettings] = useState<Record<string, string | null>>(cachedData);

    // 캐시가 있으면 로딩을 false로 시작하여 즉시 렌더링 허용
    const [loading, setLoading] = useState(!Object.keys(cachedData).length);
    const [error, setError] = useState<string | null>(null);

    // Fetch all settings
    const fetchSettings = async () => {
        if (!center?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_settings')
                .select('*')
                .eq('center_id', center.id);

            if (error) throw error;

            if (data) {
                const settingsMap: Record<string, string | null> = {};
                data.forEach((item) => {
                    settingsMap[item.key] = item.value;
                });
                setSettings(settingsMap);

                // ✨ 브랜드 정보 캐시 업데이트
                setCachedBrand(center.id, settingsMap);
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
        if (!center?.id) return { success: false, error: 'No center selected' };

        try {
            const { error } = await supabase
                .from('admin_settings')
                .upsert({
                    center_id: center.id,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Optimistic update
            setSettings(prev => {
                const updated = { ...prev, [key]: value };
                // ✨ 브랜드 정보 캐시 업데이트 (브랜드 컬러 포함)
                if (key === 'center_logo' || key === 'center_name' || key === 'brand_color') {
                    setCachedBrand(center.id, updated);
                }
                return updated;
            });

            // ✨ [Global Sync] 설정 변경 이벤트 발송 → 리스너가 자동 refetch
            window.dispatchEvent(new Event('settings-updated'));

            return { success: true };
        } catch (err: any) {
            console.error(`Error updating setting ${key}:`, err);
            return { success: false, error: err.message };
        }
    };

    // Initial fetch & Listener
    useEffect(() => {
        if (center?.id) {
            fetchSettings();
        } else {
            // ✨ [Fix] Stop loading if no center is selected (Global Mode)
            setLoading(false);
        }

        // ✨ [Global Sync] 이벤트 리스너 등록
        const handleSync = () => {
            fetchSettings();
        };
        window.addEventListener('settings-updated', handleSync);

        return () => {
            window.removeEventListener('settings-updated', handleSync);
        };
    }, [center?.id]); // ✨ [Perf] ID만 추적 → 객체 참조 변경 시 불필요한 refetch 방지

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
