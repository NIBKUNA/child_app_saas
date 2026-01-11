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

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// ✨ 트래픽 소스 카테고리 분류
function categorizeSource(referrer: string, utmSource?: string | null): string {
    if (utmSource) {
        const lower = utmSource.toLowerCase();
        if (lower.includes('naver')) return 'Naver';
        if (lower.includes('google')) return 'Google';
        if (lower.includes('instagram') || lower.includes('facebook') || lower.includes('kakao')) return 'SNS';
        return 'Others';
    }

    if (!referrer || referrer === '') return 'Direct';

    const lowerRef = referrer.toLowerCase();
    if (lowerRef.includes('naver')) return 'Naver';
    if (lowerRef.includes('google')) return 'Google';
    if (lowerRef.includes('daum')) return 'Naver'; // Daum = Naver group
    if (lowerRef.includes('instagram') || lowerRef.includes('facebook') || lowerRef.includes('kakao')) return 'SNS';
    if (lowerRef.includes(window.location.hostname)) return 'Direct'; // Internal

    return 'Others';
}

export function useTrafficSource() {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const source = searchParams.get('utm_source');
        const medium = searchParams.get('utm_medium');
        const campaign = searchParams.get('utm_campaign');
        const referrer = document.referrer;

        // If UTM parameters are present, they take precedence and overwrite previous source
        if (source) {
            sessionStorage.setItem('marketing_source', source);
            if (medium) sessionStorage.setItem('marketing_medium', medium);
            if (campaign) sessionStorage.setItem('marketing_campaign', campaign);
        }

        // If no UTM, but we have a referrer and NO existing source, capture referrer
        const currentSource = sessionStorage.getItem('marketing_source');
        if (!currentSource && referrer) {
            let derivedSource = 'referrer_other';
            const lowerRef = referrer.toLowerCase();

            if (lowerRef.includes('naver')) derivedSource = 'naver_search';
            else if (lowerRef.includes('google')) derivedSource = 'google_search';
            else if (lowerRef.includes('daum')) derivedSource = 'daum_search';
            else if (lowerRef.includes('instagram')) derivedSource = 'instagram';
            else if (lowerRef.includes('facebook')) derivedSource = 'facebook';
            else if (lowerRef.includes(window.location.hostname)) return; // Ignore internal clicks

            sessionStorage.setItem('marketing_source', derivedSource);
        }

        // ✨ [DB Persistence] 세션당 한 번만 방문 기록 저장
        const visitRecorded = sessionStorage.getItem('visit_recorded');
        if (!visitRecorded) {
            const category = categorizeSource(referrer, source);

            const recordVisit = async () => {
                try {
                    await (supabase as any).from('site_visits').insert({
                        source_category: category,
                        referrer_url: referrer || null,
                        utm_source: source || null,
                        utm_medium: medium || null,
                        utm_campaign: campaign || null,
                        page_url: window.location.href,
                        user_agent: navigator.userAgent,
                        visited_at: new Date().toISOString()
                    });
                    console.log('Visit recorded:', category);
                    sessionStorage.setItem('visit_recorded', 'true');
                } catch (error) {
                    // Silently fail - don't break the app for tracking
                    console.warn('Failed to record visit:', error);
                }
            };

            recordVisit();
        }
    }, [searchParams]);
}
