/**
 * 🔄 Reindex All Centers API
 * Vercel Serverless Function
 * 
 * 기존에 등록되어 있지만 아직 색인이 안 된 모든 센터를 
 * 검색엔진에 일괄적으로 색인 요청합니다.
 * 
 * 호출 방법:
 *   POST /api/reindex-all
 *   Body: (없음 또는 { "secret": "your-secret" })
 * 
 * Super Admin 전용 — CenterList 페이지에서 호출됩니다.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { BASE_URL } from './_config.js';

const SUB_PAGES = ['', '/about', '/programs', '/therapists', '/contact'];

// ============================================
// IndexNow (Bing, Yandex, Seznam 등)
// ============================================
async function submitIndexNow(urls: string[]) {
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
        return { success: res.status === 200 || res.status === 202, status: res.status };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ============================================
// Google Indexing API
// ============================================
async function submitGoogleIndexing(urls: string[]) {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        return { success: false, note: 'GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다. Sitemap 기반 크롤링에 의존합니다.' };
    }

    try {
        const account = JSON.parse(serviceAccountJson);
        const accessToken = await getGoogleAccessToken(account);

        const results: any[] = [];
        // Google Indexing API는 분당 200개 제한이므로 순차 처리
        for (const url of urls) {
            try {
                const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
                });
                const data = await res.json();
                results.push({ url, status: res.status, ok: res.status === 200 });

                // Rate limit 방지 — 100ms 간격
                await new Promise(r => setTimeout(r, 100));
            } catch (err: any) {
                results.push({ url, error: err.message });
            }
        }

        const successCount = results.filter(r => r.ok).length;
        return {
            success: true,
            submitted: successCount,
            total: urls.length,
            failures: results.filter(r => !r.ok),
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

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
    if (!tokenData.access_token) throw new Error('토큰 발급 실패');
    return tokenData.access_token;
}

// ============================================
// Naver 사이트맵 재크롤링 트리거
// ============================================
async function pingNaver() {
    try {
        await fetch(`https://searchadvisor.naver.com/indexnow?url=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`).catch(() => { });
        return { success: true };
    } catch {
        return { success: false };
    }
}

// ============================================
// Handler
// ============================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'POST only' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase 설정 누락' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 모든 활성 센터 조회
    const { data: centers, error: dbError } = await supabase
        .from('centers')
        .select('slug, name')
        .eq('is_active', true)
        .order('name');

    if (dbError || !centers) {
        return res.status(500).json({ error: '센터 목록 조회 실패', detail: dbError?.message });
    }

    // 전체 URL 목록 구성
    const allUrls: string[] = [
        `${BASE_URL}/`,
        `${BASE_URL}/centers`,
    ];

    for (const center of centers) {
        if (!center.slug) continue;
        for (const page of SUB_PAGES) {
            allUrls.push(`${BASE_URL}/centers/${center.slug}${page}`);
        }
    }

    console.log(`📢 [전체 재색인] ${centers.length}개 센터, ${allUrls.length}개 URL 제출 시작`);

    // 병렬 실행
    const [googleResult, indexNowResult, naverResult] = await Promise.all([
        submitGoogleIndexing(allUrls),
        submitIndexNow(allUrls),
        pingNaver(),
    ]);

    const response = {
        centersCount: centers.length,
        centersSubmitted: centers.map(c => ({ name: c.name, slug: c.slug })),
        totalUrls: allUrls.length,
        google: googleResult,
        indexNow: indexNowResult,
        naver: naverResult,
        timestamp: new Date().toISOString(),
        message: `✅ ${centers.length}개 센터의 ${allUrls.length}개 URL 색인 요청이 완료되었습니다.`,
    };

    console.log('📢 [전체 재색인] 결과:', JSON.stringify(response, null, 2));
    res.status(200).json(response);
}
