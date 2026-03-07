/**
 * 🗺️ Resolve Coordinates API
 * 지도 URL 또는 주소에서 좌표를 추출하여 반환
 * 관리자가 설정 저장 시 호출 → 결과를 DB에 저장
 * 
 * POST /api/resolve-coords
 * Body: { mapUrl?: string, address?: string }
 * Response: { lat: number, lng: number } | { error: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** 한국 좌표 범위 확인 */
function isKoreaCoord(lat: number, lng: number): boolean {
    return lat > 33 && lat < 43 && lng > 124 && lng < 132;
}

/** URL에서 좌표 직접 추출 */
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        const lat = urlObj.searchParams.get('lat');
        const lng = urlObj.searchParams.get('lng');
        if (lat && lng) {
            const latN = parseFloat(lat), lngN = parseFloat(lng);
            if (isKoreaCoord(latN, lngN)) return { lat: latN, lng: lngN };
        }

        const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
            const latN = parseFloat(coordMatch[1]), lngN = parseFloat(coordMatch[2]);
            if (isKoreaCoord(latN, lngN)) return { lat: latN, lng: lngN };
        }

        const cParam = urlObj.searchParams.get('c');
        if (cParam) {
            const parts = cParam.split(',');
            if (parts.length >= 2) {
                const num1 = parseFloat(parts[0]), num2 = parseFloat(parts[1]);
                if (isKoreaCoord(num1, num2)) return { lat: num1, lng: num2 };
            }
        }
    } catch {
        const latMatch = url.match(/lat=(-?\d+\.?\d*)/);
        const lngMatch = url.match(/lng=(-?\d+\.?\d*)/);
        if (latMatch && lngMatch) {
            const latN = parseFloat(latMatch[1]), lngN = parseFloat(lngMatch[1]);
            if (isKoreaCoord(latN, lngN)) return { lat: latN, lng: lngN };
        }
    }
    return null;
}

/** URL에서 Place ID 추출 */
function extractPlaceId(url: string): string | null {
    const match = url.match(/place\/(\d{5,})/);
    return match ? match[1] : null;
}

/** Place ID로 좌표 조회 */
async function fetchFromPlaceId(placeId: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const resp = await fetch(`https://map.naver.com/p/api/search/allSearch?query=${placeId}&type=place`, {
            headers: { 'User-Agent': 'Zarada/1.0 (https://zarada.co.kr)' }
        });
        if (resp.ok) {
            const data = await resp.json();
            const place = data?.result?.place?.list?.[0];
            if (place?.x && place?.y) {
                return { lat: parseFloat(place.y), lng: parseFloat(place.x) };
            }
        }
    } catch { /* ignore */ }
    return null;
}

/** 주소로 좌표 조회 (Nominatim) */
async function fetchFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
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
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch { continue; }
    }
    return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { mapUrl, address } = req.body || {};

    // 1차: URL에서 직접 좌표 추출
    if (mapUrl) {
        const coords = extractCoordsFromUrl(mapUrl);
        if (coords) return res.json(coords);

        // 2차: Place ID로 조회
        const placeId = extractPlaceId(mapUrl);
        if (placeId) {
            const placeCoords = await fetchFromPlaceId(placeId);
            if (placeCoords) return res.json(placeCoords);
        }
    }

    // 3차: 주소로 조회
    if (address) {
        const addrCoords = await fetchFromAddress(address);
        if (addrCoords) return res.json(addrCoords);
    }

    return res.status(404).json({ error: 'coordinates not found' });
}
