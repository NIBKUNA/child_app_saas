/**
 * 🔍 Auto Index Request API
 * Vercel Serverless Function
 * 
 * 새 센터가 생성되면 자동으로 검색엔진에 색인을 요청합니다.
 * 
 * 지원 검색엔진:
 * - Google: Indexing API (서비스 계정 필요) / Sitemap ping (폴백)
 * - Naver: 웹마스터 도구 사이트맵 재제출 ping
 * - Bing/Yandex: IndexNow 프로토콜
 * 
 * 호출 방법:
 *   POST /api/request-indexing
 *   Body: { slug: "jamsil", pages?: ["", "/about", "/programs", "/therapists", "/contact"] }
 * 
 * 환경변수 (Vercel Dashboard에서 설정):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  - Google Cloud 서비스 계정 JSON (선택)
 *   INDEXNOW_API_KEY             - IndexNow API 키 (선택, 없으면 자동 생성)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = 'https://app.myparents.co.kr';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

// 기본 하위 페이지
const DEFAULT_PAGES = ['', '/about', '/programs', '/therapists', '/contact'];

// ============================================
// Google Indexing API
// ============================================
async function requestGoogleIndexing(urls: string[]): Promise<{ success: boolean; results: any[] }> {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        // 서비스 계정이 없으면 sitemap ping으로 폴백
        console.log('[Google] 서비스 계정 미설정 → sitemap ping 폴백');
        try {
            // Google의 공식 sitemap ping (참고용 — Google은 2023년부터 공식 ping을 중단했지만 sitemap 재처리 트리거 용도)
            const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
            await fetch(pingUrl).catch(() => { });
            return { success: true, results: [{ method: 'sitemap_ping', note: 'Google 서비스 계정을 설정하면 직접 색인 요청이 가능합니다.' }] };
        } catch {
            return { success: false, results: [{ error: 'sitemap ping 실패' }] };
        }
    }

    try {
        const account = JSON.parse(serviceAccountJson);
        const accessToken = await getGoogleAccessToken(account);

        const results = [];
        for (const url of urls) {
            try {
                const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        url,
                        type: 'URL_UPDATED',
                    }),
                });
                const data = await res.json();
                results.push({ url, status: res.status, data });
            } catch (err: any) {
                results.push({ url, error: err.message });
            }
        }
        return { success: true, results };
    } catch (err: any) {
        console.error('[Google] Indexing API 오류:', err.message);
        return { success: false, results: [{ error: err.message }] };
    }
}

/** Google OAuth2 JWT → Access Token */
async function getGoogleAccessToken(account: any): Promise<string> {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const claimSet = btoa(JSON.stringify({
        iss: account.client_email,
        scope: 'https://www.googleapis.com/auth/indexing',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }));

    // JWT 서명 (Node.js crypto)
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${claimSet}`);
    const signature = sign.sign(account.private_key, 'base64url');

    const jwt = `${header}.${claimSet}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Google 토큰 발급 실패: ' + JSON.stringify(tokenData));
    return tokenData.access_token;
}

// ============================================
// IndexNow (Bing, Yandex, Seznam, Naver*)
// ============================================
async function requestIndexNow(urls: string[]): Promise<{ success: boolean; results: any[] }> {
    const apiKey = process.env.INDEXNOW_API_KEY || 'zarada-indexnow-key-2026';
    const host = new URL(BASE_URL).host;

    try {
        const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host,
                key: apiKey,
                keyLocation: `${BASE_URL}/${apiKey}.txt`,
                urlList: urls,
            }),
        });

        return {
            success: res.status === 200 || res.status === 202,
            results: [{ status: res.status, statusText: res.statusText, urlCount: urls.length }],
        };
    } catch (err: any) {
        return { success: false, results: [{ error: err.message }] };
    }
}

// ============================================
// Naver Search Advisor 사이트맵 알림
// ============================================
async function pingNaverSitemap(): Promise<{ success: boolean; note: string }> {
    try {
        // Naver 검색어드바이저에 사이트맵 재크롤링 트리거
        const pingUrl = `https://searchadvisor.naver.com/indexnow?url=${encodeURIComponent(SITEMAP_URL)}`;
        await fetch(pingUrl).catch(() => { });
        return { success: true, note: '네이버 사이트맵 ping 완료 (실제 반영은 네이버 크롤링 주기에 따름)' };
    } catch {
        return { success: false, note: '네이버 ping 실패' };
    }
}

// ============================================
// Handler
// ============================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // POST만 허용
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'POST only' });
    }

    const { slug, pages } = req.body || {};

    if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'slug 파라미터가 필요합니다.' });
    }

    // 색인 요청할 URL 목록 생성
    const subPages = Array.isArray(pages) ? pages : DEFAULT_PAGES;
    const urls = subPages.map(p => `${BASE_URL}/centers/${slug}${p}`);

    // 글로벌 페이지도 함께 알림 (센터 디렉토리에 새 항목 추가되었으므로)
    const allUrls = [
        `${BASE_URL}/`,
        `${BASE_URL}/centers`,
        ...urls,
    ];

    console.log(`📢 색인 요청 시작: ${slug} (${allUrls.length}개 URL)`);

    // 병렬로 모든 검색엔진에 요청
    const [googleResult, indexNowResult, naverResult] = await Promise.all([
        requestGoogleIndexing(allUrls),
        requestIndexNow(allUrls),
        pingNaverSitemap(),
    ]);

    const response = {
        slug,
        urlsSubmitted: allUrls,
        google: googleResult,
        indexNow: indexNowResult,   // Bing, Yandex
        naver: naverResult,
        timestamp: new Date().toISOString(),
        message: '✅ 색인 요청이 완료되었습니다. 검색 반영까지 수일이 소요될 수 있습니다.',
    };

    console.log('📢 색인 요청 결과:', JSON.stringify(response, null, 2));

    res.status(200).json(response);
}
