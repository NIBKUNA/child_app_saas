/**
 * 📰 Blog Feed API
 * Vercel Serverless Function
 *
 * 센터별 네이버 블로그 RSS를 가져와서 JSON으로 변환합니다.
 * CORS 제한을 우회하기 위해 서버사이드에서 RSS를 fetch합니다.
 *
 * 호출:
 *   GET /api/blog-feed?blogId=zarada_jamsil&count=6
 *   GET /api/blog-feed?blogUrl=https://blog.naver.com/zarada_jamsil&count=6
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BlogPost {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    thumbnail: string | null;
}

/** RSS XML에서 블로그 포스트 추출 */
function parseRSS(xml: string): BlogPost[] {
    const posts: BlogPost[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];

        const getTag = (tag: string): string => {
            // CDATA 포함 처리
            const cdataMatch = item.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
            if (cdataMatch) return cdataMatch[1].trim();
            const plainMatch = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
            return plainMatch ? plainMatch[1].trim() : '';
        };

        // description에서 첫 번째 이미지 URL 추출
        const desc = getTag('description');
        const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);

        // HTML 태그 제거하여 순수 텍스트만 추출
        const cleanDesc = desc
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim()
            .slice(0, 200);

        posts.push({
            title: getTag('title')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/<[^>]+>/g, ''),
            link: getTag('link'),
            description: cleanDesc,
            pubDate: getTag('pubDate'),
            thumbnail: imgMatch ? imgMatch[1] : null,
        });
    }

    return posts;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300'); // 10분 캐시

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'GET only' });
    }

    const { blogId, blogUrl, count = '6' } = req.query;
    const maxCount = Math.min(Number(count) || 6, 20);

    let rssUrl = '';

    if (blogId && typeof blogId === 'string') {
        // 네이버 블로그 ID로 RSS URL 생성
        rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;
    } else if (blogUrl && typeof blogUrl === 'string') {
        // 블로그 URL에서 ID 추출
        // https://blog.naver.com/zarada_jamsil → zarada_jamsil
        const urlMatch = blogUrl.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)/);
        if (urlMatch) {
            rssUrl = `https://rss.blog.naver.com/${urlMatch[1]}.xml`;
        } else {
            return res.status(400).json({ error: '지원되지 않는 블로그 URL 형식입니다. 네이버 블로그 URL을 입력해주세요.' });
        }
    } else {
        return res.status(400).json({ error: 'blogId 또는 blogUrl 파라미터가 필요합니다.' });
    }

    try {
        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Zarada-Blog-Feed/1.0',
            },
        });

        if (!response.ok) {
            return res.status(404).json({
                error: '블로그를 찾을 수 없습니다. 블로그 ID를 확인해주세요.',
                rssUrl,
                status: response.status,
            });
        }

        const xml = await response.text();
        const posts = parseRSS(xml).slice(0, maxCount);

        // 블로그 제목 추출
        const channelTitle = xml.match(/<channel>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
        const blogTitle = channelTitle ? channelTitle[1].trim() : '';

        return res.status(200).json({
            blogTitle,
            posts,
            count: posts.length,
            fetchedAt: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[Blog Feed] RSS fetch error:', err.message);
        return res.status(500).json({ error: 'RSS 피드를 가져오는 데 실패했습니다.', detail: err.message });
    }
}
