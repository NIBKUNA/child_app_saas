/**
 * 🗺️ CenterMap — Leaflet + OpenStreetMap 기반 센터 위치 지도
 * admin_settings의 center_map_url(네이버 지도 URL)에서 좌표를 추출하여
 * OpenStreetMap 지도에 마커를 표시합니다.
 * API 키 불필요 / 완전 무료
 */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// Leaflet 기본 마커 아이콘 경로 수정 (vite 호환)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** 네이버 지도 URL에서 lat/lng 추출 (동기) */
function extractCoordsFromUrlSync(url: string): { lat: number; lng: number } | null {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        const lat = urlObj.searchParams.get('lat');
        const lng = urlObj.searchParams.get('lng');
        if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };

        const coordMatch = url.match(/[?&@](-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };

        const cParam = urlObj.searchParams.get('c');
        if (cParam) {
            const parts = cParam.split(',');
            if (parts.length >= 2) {
                const num1 = parseFloat(parts[0]);
                const num2 = parseFloat(parts[1]);
                if (num1 > 30 && num1 < 44 && num2 > 124 && num2 < 132) {
                    return { lat: num1, lng: num2 };
                }
            }
        }
    } catch {
        const latMatch = url.match(/lat=(-?\d+\.?\d*)/);
        const lngMatch = url.match(/lng=(-?\d+\.?\d*)/);
        if (latMatch && lngMatch) return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
    }
    return null;
}

/** 주소로 좌표 조회 (Nominatim — OpenStreetMap 무료 geocoding) */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address) return null;

    // 주소를 점진적으로 단순화하며 재시도
    const variations = [
        address,
        address.replace(/\s*\d+호\s*$/, ''),           // "201호" 제거
        address.replace(/\s*\d+\s*\d*호?\s*$/, ''),     // "51 201호" 제거  
        address.replace(/\s+\d+[-\d]*\s*$/, ''),        // 번지 제거
        address.split(' ').slice(0, 3).join(' '),        // 시 구 동/길 만
        address.split(' ').slice(0, 2).join(' '),        // 시 구 만
    ].filter((v, i, a) => v && a.indexOf(v) === i);     // 중복 제거

    for (const query of variations) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=1`,
                { headers: { 'Accept-Language': 'ko' } }
            );
            if (!res.ok) continue;
            const data = await res.json();
            if (data?.[0]?.lat && data?.[0]?.lon) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch {
            continue;
        }
    }
    return null;
}

/** 네이버 지도 URL에서 좌표 추출 → 실패 시 주소 geocoding */
async function extractCoordsFromUrl(url: string, address?: string): Promise<{ lat: number; lng: number } | null> {
    // 1차: URL 파라미터에서 직접 추출
    const syncResult = extractCoordsFromUrlSync(url);
    if (syncResult) return syncResult;

    // 2차: 주소로 geocoding (Nominatim)
    if (address) {
        const geocoded = await geocodeAddress(address);
        if (geocoded) return geocoded;
    }

    return null;
}

interface CenterMapProps {
    className?: string;
}

export function CenterMap({ className }: CenterMapProps) {
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const mapUrl = getSetting('center_map_url') || '';
    const centerName = getSetting('center_name') || '센터';
    const centerAddress = getSetting('center_address') || '';

    useEffect(() => {
        if (mapUrl || centerAddress) {
            extractCoordsFromUrl(mapUrl, centerAddress).then(result => setCoords(result));
        }
    }, [mapUrl, centerAddress]);

    useEffect(() => {
        if (!coords || !mapContainerRef.current) return;
        if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

        const map = L.map(mapContainerRef.current, {
            center: [coords.lat, coords.lng], zoom: 16,
            zoomControl: false, attributionControl: false, scrollWheelZoom: false,
        });

        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#7C3AED,#EC4899);border-radius:50% 50% 50% 4px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg style="transform:rotate(45deg);width:18px;height:18px;" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
            iconSize: [40, 40], iconAnchor: [4, 40], popupAnchor: [16, -40],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`<div style="font-family:'Pretendard',sans-serif;padding:4px 0;"><strong style="font-size:14px;font-weight:900;">${centerName}</strong>${centerAddress ? `<br/><span style="font-size:12px;color:#64748b;">${centerAddress}</span>` : ''}</div>`);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 200);

        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    }, [coords, isDark, centerName, centerAddress]);

    if (!coords) return null;

    return (
        <motion.section className={cn("mt-24", className)} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 80 }}>
            <div className="text-center mb-10">
                <span className={cn("inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-4", isDark ? "bg-violet-900 text-violet-300" : "bg-violet-50 text-violet-600")}>Location</span>
                <h2 className={cn("text-3xl md:text-4xl font-black tracking-[-0.05em]", isDark ? "text-white" : "text-slate-900")} style={{ wordBreak: 'keep-all' }}>오시는 길</h2>
                {centerAddress && <p className={cn("font-medium mt-3 text-base", isDark ? "text-slate-400" : "text-slate-500")}>{centerAddress}</p>}
            </div>
            <div className={cn("relative rounded-[40px] overflow-hidden shadow-2xl border", isDark ? "bg-slate-800 border-slate-700 shadow-slate-900/50" : "bg-white border-slate-100 shadow-slate-200/50")}>
                <div ref={mapContainerRef} className="w-full h-[280px] md:h-[340px] z-0" />
                <div className={cn("px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                    <div className="space-y-1">
                        <h3 className={cn("font-black text-base", isDark ? "text-white" : "text-slate-900")}>{centerName}</h3>
                        {centerAddress && (
                            <p className={cn("text-sm font-medium flex items-center gap-1.5", isDark ? "text-slate-400" : "text-slate-500")}>
                                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                                {centerAddress}
                            </p>
                        )}
                    </div>
                    {(mapUrl || centerAddress) && (
                        <a href={mapUrl || `https://map.naver.com/search/${encodeURIComponent(centerAddress)}`} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shrink-0", isDark ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25")}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            네이버 지도에서 보기
                        </a>
                    )}
                </div>
            </div>
        </motion.section>
    );
}
