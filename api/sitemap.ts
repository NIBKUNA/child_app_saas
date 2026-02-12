/**
 * 🗺️ Dynamic Sitemap Generator
 * Vercel Serverless Function
 * 
 * 새 센터가 DB에 등록되면 자동으로 sitemap에 반영됩니다.
 * 센터별 모든 하위 페이지(홈, 소개, 프로그램, 치료사, 문의)를 포함합니다.
 * 
 * robots.txt → Sitemap: https://app.myparents.co.kr/sitemap.xml
 * vercel.json → /sitemap.xml → /api/sitemap
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        res.status(500).send('<!-- Supabase configuration missing -->');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = 'https://app.myparents.co.kr';
    const today = new Date().toISOString().split('T')[0];

    // 🔍 DB에서 모든 활성 센터 조회
    const { data: centers } = await supabase
        .from('centers')
        .select('slug, name, address, updated_at')
        .eq('is_active', true)
        .order('name');

    // 📄 센터별 하위 페이지 정의
    const subPages = [
        { path: '', priority: '0.9', changefreq: 'weekly' },      // 홈
        { path: '/about', priority: '0.7', changefreq: 'monthly' },    // 소개
        { path: '/programs', priority: '0.8', changefreq: 'monthly' }, // 프로그램
        { path: '/therapists', priority: '0.7', changefreq: 'weekly' }, // 치료사
        { path: '/contact', priority: '0.8', changefreq: 'monthly' },  // 문의
    ];

    // 🗺️ XML 생성
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- 🌐 Global Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/centers</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/policy/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/policy/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // 📍 센터별 페이지 동적 생성
    for (const center of (centers || [])) {
        if (!center.slug) continue;

        const lastmod = center.updated_at
            ? new Date(center.updated_at).toISOString().split('T')[0]
            : today;

        for (const page of subPages) {
            xml += `
  <!-- ${center.name}${page.path || ' 홈'} -->
  <url>
    <loc>${baseUrl}/centers/${center.slug}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
        }
    }

    xml += `
</urlset>`;

    // ⚡ Cache: 1시간 (CDN + 브라우저)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(xml);
}
