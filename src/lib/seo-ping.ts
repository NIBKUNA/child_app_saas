/**
 * 🎨 SEO Ping Utility
 * -----------------------------------------------------------
 * 검색 엔진(네이버, 구글)에 사이트맵 업데이트를 알리는 핑 요청을 보냅니다.
 * 실제 프로덕션에서는 서버 사이드(Edge Function)에서 호출하는 것이 좋습니다.
 */
export async function pingSearchEngines(sitemapUrl: string = 'https://mydomain.com/sitemap.xml') {
    // ⚠️ Note: Google removed public ping endpoint support in late 2023.
    // For Google, use Indexing API via Google Search Console.
    // This function now primarily targets Naver / Bing or custom indexers.

    const engines = [
        `https://search.naver.com/web/help/website/sitemap_register.jsp?url=${encodeURIComponent(sitemapUrl)}`, // Naver (Example)
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];

    try {
        console.log("📡 Pinging search engines...");
        await Promise.all(engines.map(url => fetch(url, { mode: 'no-cors' }).catch(() => { })));
        console.log("✅ Ping requests sent (no-cors mode).");
        return true;
    } catch (e) {
        console.error("Ping failed:", e);
        return false;
    }
}
