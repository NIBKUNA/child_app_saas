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
                    .from('profiles')
                    .select('center_id')
                    .eq('id', user.id)
                    .single() as { data: { center_id: string } | null, error: any };

                if (profileError || !profile?.center_id) {
                    throw new Error('No center assigned');
                }

                // 2. centers 테이블에서 정보 가져오기
                const { data: center, error: centerError } = await supabase
                    .from('centers')
                    .select('name, logo_url')
                    .eq('id', profile.center_id)
                    .single() as { data: { name: string, logo_url: string } | null, error: any };

                if (centerError || !center) throw centerError || new Error('Center not found');

                setSeoData({
                    name: center.name,
                    seo_description: `자라다 발달센터 [${center.name}] - 우리 아이 맞춤형 성장 플랫폼`,
                });

            } catch (error) {
                console.warn('SEO Info Fetch Error:', error);
                // Fallback
                setSeoData({
                    name: '자라다 발달센터',
                    seo_description: '우리 아이 성장 발달 관리 플랫폼'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCenterInfo();
    }, [user]);

    return { seoData, loading };
}
