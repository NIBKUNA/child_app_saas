/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 트래픽 소스 추적 훅
 *  - UTM 파라미터, referrer, 광고 자동 태그(gclid/n_media) 기반 채널 분류
 *  - 센터별(center_id) site_visits 테이블에 기록
 *  - 채널+날짜 기반 중복 방지 (localStorage dedup)
 */

import { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext';

// ─────────────────────────────────────────────────
// 채널 분류 함수 — Dashboard trafficMap 키와 일치
// ─────────────────────────────────────────────────
function categorizeSource(
    referrer: string,
    utmSource?: string | null,
    gclid?: string | null,
    nMedia?: string | null,
    fbclid?: string | null
): string {
    // 1. 광고 플랫폼 자동 태그 (우선순위 최고)
    if (gclid) return 'Google Ads';
    if (nMedia) return 'Naver Ads';
    if (fbclid) return 'Facebook Ads';

    // 2. UTM 파라미터 (마케팅 링크에 직접 태깅)
    if (utmSource) {
        const lower = utmSource.toLowerCase();
        // Naver
        if (lower.includes('naver_blog') || lower.includes('naver-blog') || lower === 'blog.naver') return 'Naver Blog';
        if (lower.includes('naver_place') || lower.includes('naver-place') || lower.includes('naver_map')) return 'Naver Place';
        if (lower.includes('naver')) return 'Naver Blog';
        // Google
        if (lower.includes('google_maps') || lower.includes('google-maps') || lower.includes('googlemaps')) return 'Google Maps';
        if (lower.includes('google')) return 'Google Search';
        // SNS & 영상
        if (lower.includes('youtube')) return 'Youtube';
        if (lower.includes('instagram')) return 'Instagram';
        if (lower.includes('facebook')) return 'Facebook';
        if (lower.includes('kakao')) return 'KakaoTalk';
        if (lower.includes('twitter') || lower.includes('x.com')) return 'Others';
        // 오프라인 유입 (QR, 전단지 등)
        if (lower.includes('signage') || lower.includes('qr')) return 'Signage';
        if (lower.includes('flyer') || lower.includes('leaflet')) return 'Flyer';
        if (lower.includes('hospital') || lower.includes('clinic')) return 'Hospital';
        if (lower.includes('referral') || lower.includes('partner')) return 'Partnership';
        return 'Others';
    }

    // 3. Referrer 기반 분류 (자연 유입)
    if (!referrer || referrer === '') return 'Direct';

    const lowerRef = referrer.toLowerCase();

    // 인프라/개발 도메인 → Direct 처리 (노이즈 방지)
    if (lowerRef.includes('vercel.com') || lowerRef.includes('vercel.app') ||
        lowerRef.includes('localhost') || lowerRef.includes('127.0.0.1') ||
        lowerRef.includes('brainlitix.net')) return 'Direct';

    // 자사 도메인 → 내부 이동
    if (lowerRef.includes('zarada') || lowerRef.includes('myparents.co.kr') ||
        lowerRef.includes('creatorlink-gabia') || lowerRef.includes('withmemedical')) return 'Direct';

    // 현재 도메인 → 내부 이동
    if (lowerRef.includes(window.location.hostname)) return 'Direct';

    // Naver 세분화
    if (lowerRef.includes('blog.naver') || lowerRef.includes('m.blog.naver')) return 'Naver Blog';
    if (lowerRef.includes('map.naver') || lowerRef.includes('naver.me') || lowerRef.includes('place.naver') || lowerRef.includes('m.place.naver')) return 'Naver Place';
    if (lowerRef.includes('search.naver') || lowerRef.includes('naver.com')) return 'Naver Blog';
    if (lowerRef.includes('daum.net') || lowerRef.includes('daum.co.kr')) return 'Others';

    // Google 세분화
    if (lowerRef.includes('maps.google') || lowerRef.includes('google.com/maps') || lowerRef.includes('goo.gl/maps')) return 'Google Maps';
    if (lowerRef.includes('google.com') || lowerRef.includes('google.co.kr')) return 'Google Search';

    // SNS
    if (lowerRef.includes('youtube.com') || lowerRef.includes('youtu.be')) return 'Youtube';
    if (lowerRef.includes('instagram.com') || lowerRef.includes('l.instagram')) return 'Instagram';
    if (lowerRef.includes('facebook.com') || lowerRef.includes('fb.com') || lowerRef.includes('l.facebook')) return 'Facebook';
    if (lowerRef.includes('kakao')) return 'KakaoTalk';

    return 'Others';
}

// ─────────────────────────────────────────────────
// 훅 본체
// ─────────────────────────────────────────────────
export function useTrafficSource() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { center } = useCenter();

    useEffect(() => {
        // ── UTM + 광고 태그 수집 ──
        const source = searchParams.get('utm_source');
        const medium = searchParams.get('utm_medium');
        const campaign = searchParams.get('utm_campaign');
        const gclid = searchParams.get('gclid');     // Google Ads auto-tag
        const nMedia = searchParams.get('n_media');   // Naver Ads auto-tag
        const fbclid = searchParams.get('fbclid');   // Facebook/Instagram Ads auto-tag
        const referrer = document.referrer;

        // ── 광고 자동 감지 → UTM 자동 세팅 ──
        let effectiveSource = source;
        let effectiveMedium = medium;
        let effectiveCampaign = campaign;

        if (gclid && !source) {
            effectiveSource = 'google';
            effectiveMedium = 'cpc';
            effectiveCampaign = 'google_ads_auto';
        } else if (nMedia && !source) {
            effectiveSource = 'naver';
            effectiveMedium = 'cpc';
            effectiveCampaign = 'naver_ads_auto';
        } else if (fbclid && !source) {
            effectiveSource = 'facebook';
            effectiveMedium = 'cpc';
            effectiveCampaign = 'facebook_ads_auto';
        }

        // ── sessionStorage에 마케팅 소스 저장 (폼 제출 시 참조) ──
        if (effectiveSource) {
            sessionStorage.setItem('marketing_source', effectiveSource);
            if (effectiveMedium) sessionStorage.setItem('marketing_medium', effectiveMedium);
            if (effectiveCampaign) sessionStorage.setItem('marketing_campaign', effectiveCampaign);
        }

        // ── Referrer 기반 자동 추론 (UTM 없을 때) ──
        const currentSource = sessionStorage.getItem('marketing_source');
        if (!currentSource && referrer) {
            let derivedSource = 'referrer_other';
            const lowerRef = referrer.toLowerCase();

            if (lowerRef.includes('blog.naver') || lowerRef.includes('m.blog.naver')) derivedSource = 'naver_blog';
            else if (lowerRef.includes('map.naver') || lowerRef.includes('place.naver') || lowerRef.includes('m.place.naver') || lowerRef.includes('naver.me')) derivedSource = 'naver_place';
            else if (lowerRef.includes('naver')) derivedSource = 'naver_search';
            else if (lowerRef.includes('maps.google') || lowerRef.includes('google.com/maps') || lowerRef.includes('goo.gl/maps')) derivedSource = 'google_maps';
            else if (lowerRef.includes('google')) derivedSource = 'google_search';
            else if (lowerRef.includes('youtube') || lowerRef.includes('youtu.be')) derivedSource = 'youtube';
            else if (lowerRef.includes('instagram') || lowerRef.includes('l.instagram')) derivedSource = 'instagram';
            else if (lowerRef.includes('facebook') || lowerRef.includes('fb.com') || lowerRef.includes('l.facebook')) derivedSource = 'facebook';
            else if (lowerRef.includes('kakao')) derivedSource = 'kakaotalk';
            else if (lowerRef.includes('daum')) derivedSource = 'daum_search';
            else if (lowerRef.includes(window.location.hostname)) return;

            sessionStorage.setItem('marketing_source', derivedSource);
        }

        // ── 중복 방지 + DB 기록 ──
        const category = categorizeSource(referrer, effectiveSource, gclid, nMedia, fbclid);
        const todayStr = new Date().toISOString().split('T')[0];
        const isBlogPage = location.pathname.includes('/blog/');

        // 광고 클릭은 gclid/n_media가 매번 다르므로 별도 키로 처리 (중복 차단 X)
        const isAdClick = !!(gclid || nMedia || fbclid);
        const dedupeKey = isAdClick
            ? `zv_${todayStr}_${category}_${gclid || nMedia || fbclid}`
            : isBlogPage
                ? `zv_${todayStr}_${category}_${location.pathname}`
                : `zv_${todayStr}_${category}`;

        const alreadyRecorded = localStorage.getItem(dedupeKey);

        // Direct 트래픽은 DB 기록 제외 (노이즈 방지)
        if (!alreadyRecorded && category !== 'Direct') {
            const recordVisit = async () => {
                if (!center?.id) return; // center 로딩 대기

                try {
                    const { error } = await supabase.from('site_visits').insert({
                        center_id: center.id,
                        source_category: category,
                        referrer_url: referrer || null,
                        utm_source: effectiveSource || null,
                        utm_medium: effectiveMedium || null,
                        utm_campaign: effectiveCampaign || null,
                        page_url: window.location.href,
                        user_agent: navigator.userAgent,
                        visited_at: new Date().toISOString()
                    });

                    if (error) {
                        console.warn('❌ [Traffic] Record failed:', error.message, error.details);
                        return;
                    }

                    localStorage.setItem(dedupeKey, '1');

                    // 7일 이상 된 방문 기록 키 자동 정리
                    try {
                        const cleanupDate = new Date();
                        cleanupDate.setDate(cleanupDate.getDate() - 7);
                        const cleanupStr = cleanupDate.toISOString().split('T')[0];
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const key = localStorage.key(i);
                            if (key?.startsWith('zv_') && key < `zv_${cleanupStr}`) {
                                localStorage.removeItem(key);
                            }
                        }
                    } catch (_) { /* cleanup 실패 무시 */ }
                } catch (error) {
                    console.warn('⚠️ [Traffic] System error:', error);
                }
            };

            recordVisit();
        }
    }, [searchParams, center?.id, location.pathname]);

    // 폼 제출 시 마케팅 소스 조회용
    const getSource = () => {
        return sessionStorage.getItem('marketing_source') ||
            localStorage.getItem('utm_source') ||
            'direct';
    };

    return { getSource };
}
