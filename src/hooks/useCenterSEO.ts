import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CenterSEO {
    name: string;
    seo_description: string | null;
    favicon_url?: string;
}

export function useCenterSEO() {
    const { user } = useAuth();
    const [seoData, setSeoData] = useState<CenterSEO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // user가 없거나 아직 로딩중이면 스킵
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchCenterInfo = async () => {
            try {
                // 1. users profiles에서 center_id 찾기
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('center_id')
                    .eq('id', user.id)
                    .maybeSingle() as { data: { center_id: string } | null, error: any };

                if (profileError) {
                    console.warn('Profile fetch error:', profileError);
                }

                if (!profile?.center_id) {
                    console.log('No center assigned for this user, using default SEO.');
                    setSeoData({
                        name: '발달센터',
                        seo_description: '아동발달전문센터 - 언어치료, 감각통합, 미술치료, 놀이치료, 인지치료 전문'
                    });
                    return;
                }

                // 2. centers 테이블에서 정보 가져오기
                const { data: center, error: centerError } = await supabase
                    .from('centers')
                    .select('name, logo_url')
                    .eq('id', profile.center_id)
                    .maybeSingle() as { data: { name: string, logo_url: string } | null, error: any };

                if (centerError) throw centerError;
                if (!center) throw new Error('Center not found');

                setSeoData({
                    name: center.name,
                    seo_description: `자라다 발달센터 [${center.name}] - 언어치료, 감각통합, 미술치료, 놀이치료, 사회성그룹치료`,
                });

            } catch (error) {
                console.warn('SEO Info Fetch Error:', error);
                // Fallback
                setSeoData({
                    name: '발달센터',
                    seo_description: '아동발달전문센터 - 언어치료, 감각통합, 미술치료, 놀이치료, 인지치료 전문'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCenterInfo();
    }, [user]);

    return { seoData, loading };
}
