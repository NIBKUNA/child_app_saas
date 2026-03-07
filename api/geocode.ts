/**
 * 🗺️ Geocode API — Naver Place ID → 좌표 변환
 * Vercel Serverless Function (서버사이드 → CORS 없음)
 * 
 * GET /api/geocode?placeId=1857866722
 * GET /api/geocode?address=서울+송파구+위례서로+248
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // 24시간 캐싱

    const { placeId, address } = req.query;

    // 1) Place ID로 좌표 조회
    if (placeId && typeof placeId === 'string') {
        try {
            // Naver Place API (서버사이드라 CORS 없음)
            const resp = await fetch(`https://map.naver.com/p/api/search/allSearch?query=${placeId}&type=place`, {
                headers: { 'User-Agent': 'Zarada/1.0 (https://zarada.co.kr)' }
            });
            if (resp.ok) {
                const data = await resp.json();
                const place = data?.result?.place?.list?.[0];
                if (place?.x && place?.y) {
                    return res.json({ lat: parseFloat(place.y), lng: parseFloat(place.x) });
                }
            }

            // 대안: Naver entity API
            const resp2 = await fetch(`https://map.naver.com/p/api/entity/${placeId}`, {
                headers: { 'User-Agent': 'Zarada/1.0 (https://zarada.co.kr)' }
            });
            if (resp2.ok) {
                const data2 = await resp2.json();
                if (data2?.x && data2?.y) {
                    return res.json({ lat: parseFloat(data2.y), lng: parseFloat(data2.x) });
                }
            }
        } catch {
            // 네이버 API 실패 → fallback으로 진행
        }
    }

    // 2) 주소로 좌표 조회 (Nominatim — 서버사이드라 rate limit 완화)
    if (address && typeof address === 'string') {
        const variations = [
            address.replace(/\s*\d+호?\s*$/, '').trim(),
            address.split(' ').slice(0, 3).join(' '),
            address.split(' ').slice(0, 2).join(' '),
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        for (const query of variations) {
            try {
                const resp = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=1`,
                    { headers: { 'User-Agent': 'Zarada/1.0 (https://zarada.co.kr)', 'Accept-Language': 'ko' } }
                );
                if (!resp.ok) continue;
                const data = await resp.json();
                if (data?.[0]?.lat && data?.[0]?.lon) {
                    return res.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                }
            } catch {
                continue;
            }
        }
    }

    return res.status(404).json({ error: 'coordinates not found' });
}
