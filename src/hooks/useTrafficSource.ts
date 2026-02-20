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
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import

// ✨ 트래픽 소스 카테고리 분류 — Dashboard trafficMap 키와 정확히 일치
// Dashboard keys: 'Naver Blog', 'Naver Place', 'Google Search', 'Instagram',
//                 'Youtube', 'Facebook', 'KakaoTalk', 'Direct', 'Others'
function categorizeSource(referrer: string, utmSource?: string | null): string {
    // 1. UTM 파라미터 우선 (마케팅 링크에 직접 태깅된 소스)
    if (utmSource) {
        const lower = utmSource.toLowerCase();
        // Naver 세분화
        if (lower.includes('naver_blog') || lower.includes('naver-blog') || lower === 'blog.naver') return 'Naver Blog';
        if (lower.includes('naver_place') || lower.includes('naver-place') || lower.includes('naver_map')) return 'Naver Place';
        if (lower.includes('naver')) return 'Naver Blog'; // 네이버 기본값 = 블로그 (가장 일반적인 네이버 마케팅)
        // Google 세분화
        if (lower.includes('google_maps') || lower.includes('google-maps') || lower.includes('googlemaps')) return 'Google Maps';
        if (lower.includes('google')) return 'Google Search';
        // 영상/SNS
        if (lower.includes('youtube')) return 'Youtube';
        if (lower.includes('instagram')) return 'Instagram';
        if (lower.includes('facebook')) return 'Facebook';
        if (lower.includes('kakao')) return 'KakaoTalk';
        if (lower.includes('twitter') || lower.includes('x.com')) return 'Others';
        // 오프라인 유입 태깅 (QR, 전단지 등에 utm_source 설정 시)
        if (lower.includes('signage') || lower.includes('qr')) return 'Signage';
        if (lower.includes('flyer') || lower.includes('leaflet')) return 'Flyer';
        if (lower.includes('hospital') || lower.includes('clinic')) return 'Hospital';
        if (lower.includes('referral') || lower.includes('partner')) return 'Partnership';
        return 'Others';
    }

    // 2. Referrer 기반 분류 (UTM 없이 자연 유입)
    if (!referrer || referrer === '') return 'Direct';

    const lowerRef = referrer.toLowerCase();

    // ✨ [차단] 인프라/개발 도메인 — 유입으로 치지 않음
    if (lowerRef.includes('vercel.com') || lowerRef.includes('vercel.app') ||
        lowerRef.includes('localhost') || lowerRef.includes('127.0.0.1') ||
        lowerRef.includes('brainlitix.net')) return 'Direct';

    // ✨ [자사 도메인] 플랫폼 내부 도메인 — 내부 이동으로 처리
    if (lowerRef.includes('zarada') || lowerRef.includes('myparents.co.kr') ||
        lowerRef.includes('creatorlink-gabia') || lowerRef.includes('withmemedical')) return 'Direct';

    // 내부 트래픽 무시 (현재 도메인)
    if (lowerRef.includes(window.location.hostname)) return 'Direct';

    // Naver 세분화 (referrer URL 기반)
    if (lowerRef.includes('blog.naver') || lowerRef.includes('m.blog.naver')) return 'Naver Blog';
    if (lowerRef.includes('map.naver') || lowerRef.includes('naver.me') || lowerRef.includes('place.naver') || lowerRef.includes('m.place.naver')) return 'Naver Place';
    if (lowerRef.includes('search.naver') || lowerRef.includes('naver.com')) return 'Naver Blog'; // 네이버 검색 = 블로그 노출이 대부분
    if (lowerRef.includes('daum.net') || lowerRef.includes('daum.co.kr')) return 'Others';

    // Google 세분화 (Maps vs 검색)
    if (lowerRef.includes('maps.google') || lowerRef.includes('google.com/maps') || lowerRef.includes('goo.gl/maps')) return 'Google Maps';
    if (lowerRef.includes('google.com') || lowerRef.includes('google.co.kr')) return 'Google Search';

    // 영상/SNS
    if (lowerRef.includes('youtube.com') || lowerRef.includes('youtu.be')) return 'Youtube';
    if (lowerRef.includes('instagram.com') || lowerRef.includes('l.instagram')) return 'Instagram';
    if (lowerRef.includes('facebook.com') || lowerRef.includes('fb.com') || lowerRef.includes('l.facebook')) return 'Facebook';
    if (lowerRef.includes('kakao')) return 'KakaoTalk';

    return 'Others';
}

export function useTrafficSource() {
    const [searchParams] = useSearchParams();
    const { center } = useCenter(); // ✨ Get center context

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

            // ✨ [FIX] Naver 세분화 — Blog vs Place vs 검색 구분
            if (lowerRef.includes('blog.naver') || lowerRef.includes('m.blog.naver')) derivedSource = 'naver_blog';
            else if (lowerRef.includes('map.naver') || lowerRef.includes('place.naver') || lowerRef.includes('m.place.naver') || lowerRef.includes('naver.me')) derivedSource = 'naver_place';
            else if (lowerRef.includes('naver')) derivedSource = 'naver_search';
            // ✨ [FIX] Google 세분화 — Maps vs 검색 구분
            else if (lowerRef.includes('maps.google') || lowerRef.includes('google.com/maps') || lowerRef.includes('goo.gl/maps')) derivedSource = 'google_maps';
            else if (lowerRef.includes('google')) derivedSource = 'google_search';
            // 영상/SNS
            else if (lowerRef.includes('youtube') || lowerRef.includes('youtu.be')) derivedSource = 'youtube';
            else if (lowerRef.includes('instagram') || lowerRef.includes('l.instagram')) derivedSource = 'instagram';
            else if (lowerRef.includes('facebook') || lowerRef.includes('fb.com') || lowerRef.includes('l.facebook')) derivedSource = 'facebook';
            // ✨ [FIX] 카카오톡 감지 추가
            else if (lowerRef.includes('kakao')) derivedSource = 'kakaotalk';
            else if (lowerRef.includes('daum')) derivedSource = 'daum_search';
            else if (lowerRef.includes(window.location.hostname)) return; // Ignore internal clicks

            sessionStorage.setItem('marketing_source', derivedSource);
        }

        // ✨ [FIX] localStorage + 채널별 + 날짜별 중복 방지
        // 같은 사람이 같은 채널 링크를 같은 날 반복 클릭 → 1회만 기록
        // 다른 채널 유입은 허용, 다음 날은 다시 카운트
        const category = categorizeSource(referrer, source);
        const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const isBlogPage = window.location.pathname.includes('/blog/');

        // 채널+날짜 기반 중복 키 (블로그는 포스트별로 별도 관리)
        const dedupeKey = isBlogPage
            ? `zv_${todayStr}_${category}_${window.location.pathname}`
            : `zv_${todayStr}_${category}`;

        const alreadyRecorded = localStorage.getItem(dedupeKey);

        // ✨ [FIX] Direct 트래픽은 DB에 기록하지 않음 (인프라/자사 도메인 노이즈 방지)
        if (!alreadyRecorded && category !== 'Direct') {
            const recordVisit = async () => {
                if (!center?.id) return; // ✨ Wait for center context

                try {
                    const { error } = await supabase.from('site_visits').insert({
                        center_id: center.id,
                        source_category: category,
                        referrer_url: referrer || null,
                        utm_source: source || null,
                        utm_medium: medium || null,
                        utm_campaign: campaign || null,
                        page_url: window.location.href,
                        user_agent: navigator.userAgent,
                        visited_at: new Date().toISOString()
                    });

                    if (error) {
                        console.warn('❌ [Traffic] Record failed:', error.message, error.details);
                        return;
                    }

                    // ✅ 기록 성공 → localStorage에 마킹
                    localStorage.setItem(dedupeKey, '1');

                    // 🧹 [Auto-Cleanup] 7일 이상 된 방문 기록 키 자동 정리
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
                    } catch (e) { /* cleanup 실패해도 무시 */ }
                } catch (error) {
                    console.warn('⚠️ [Traffic] System error:', error);
                }
            };

            recordVisit();
        }
    }, [searchParams, center?.id, window.location.pathname]); // ✨ Add center and path to dependencies

    // ✨ [For Form Submission] Get the stored source data
    const getSource = () => {
        return sessionStorage.getItem('marketing_source') ||
            localStorage.getItem('utm_source') ||
            'direct';
    };

    return { getSource };
}
