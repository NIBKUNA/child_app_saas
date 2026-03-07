/**
 * 🗺️ CenterMap — Leaflet + OpenStreetMap 기반 센터 위치 지도
 * 
 * 좌표 취득 우선순위:
 * 1. DB 저장 좌표 (center_lat, center_lng) — 관리자 저장 시 서버에서 추출
 * 2. URL에서 직접 파싱 (lat/lng 파라미터 포함된 경우)
 * → 외부 API 호출 없음 (CORS/rate limit 문제 원천 차단)
 */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useCenter } from '@/contexts/CenterContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// Leaflet 기본 마커 아이콘 경로 수정 (vite 호환)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** URL에서 lat/lng 직접 추출 (동기, 외부 호출 없음) */
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    if (!url) return null;
    try {
        const urlObj = new URL(url);

        // ?lat=37.5&lng=127.0
        const lat = urlObj.searchParams.get('lat');
        const lng = urlObj.searchParams.get('lng');
        if (lat && lng) {
            const latN = parseFloat(lat), lngN = parseFloat(lng);
            if (isKoreaCoord(latN, lngN)) return { lat: latN, lng: lngN };
        }

        // @37.5,127.0 형식
        const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
            const latN = parseFloat(coordMatch[1]), lngN = parseFloat(coordMatch[2]);
            if (isKoreaCoord(latN, lngN)) return { lat: latN, lng: lngN };
        }

        // c=37.5,127.0,... 형식
        const cParam = urlObj.searchParams.get('c');
        if (cParam) {
            const parts = cParam.split(',');
            if (parts.length >= 2) {
                const num1 = parseFloat(parts[0]), num2 = parseFloat(parts[1]);
                if (isKoreaCoord(num1, num2)) return { lat: num1, lng: num2 };
            }
        }
    } catch {
        // URL 파싱 실패 시 정규식 fallback
        const latMatch = url.match(/lat=(-?\d+\.?\d*)/);
        const lngMatch = url.match(/lng=(-?\d+\.?\d*)/);
        if (latMatch && lngMatch) {
            const latN = parseFloat(latMatch[1]), lngN = parseFloat(lngMatch[1]);
            if (isKoreaCoord(latN, lngN)) return { lat: latN, lng: lngN };
        }
    }
    return null;
}

/** 한국 좌표 범위 확인 */
function isKoreaCoord(lat: number, lng: number): boolean {
    return lat > 33 && lat < 43 && lng > 124 && lng < 132;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

interface CenterMapProps {
    className?: string;
    /** compact: 카드 안에 임베드할 때 — 헤더/하단바 없이 지도만 표시 */
    compact?: boolean;
}

export function CenterMap({ className, compact = false }: CenterMapProps) {
    const { getSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const mapUrl = getSetting('center_map_url') || '';
    const centerName = center?.name || getSetting('center_name') || '센터';
    const centerAddress = center?.address || getSetting('center_address') || '';

    // DB 저장 좌표
    const savedLat = getSetting('center_lat');
    const savedLng = getSetting('center_lng');

    // ── 좌표 결정 (외부 API 호출 없음) ──
    useEffect(() => {
        // 1순위: DB에 저장된 좌표
        if (savedLat && savedLng) {
            const lat = parseFloat(savedLat), lng = parseFloat(savedLng);
            if (isKoreaCoord(lat, lng)) {
                setCoords({ lat, lng });
                return;
            }
        }
        // 2순위: URL에서 직접 파싱
        const urlCoords = extractCoordsFromUrl(mapUrl);
        if (urlCoords) {
            setCoords(urlCoords);
            return;
        }
        // 좌표 없음 → 지도 표시 안 함
        setCoords(null);
    }, [mapUrl, savedLat, savedLng]);

    // ── Leaflet 지도 초기화 ──
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

        if (!compact) L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 200);

        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    }, [coords, isDark, centerName, centerAddress, compact]);

    // 좌표 없으면 렌더링 안 함
    if (!coords) return null;

    // ─── compact 모드: 카드 안에 임베드 ───
    if (compact) {
        return (
            <div className={cn("relative overflow-hidden", className)}>
                <div ref={mapContainerRef} className="w-full h-[200px] z-0" />
                {(mapUrl || centerAddress) && (
                    <a
                        href={mapUrl || `https://map.naver.com/search/${encodeURIComponent(centerAddress)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs bg-white/90 backdrop-blur-sm text-slate-700 shadow-lg hover:bg-white transition-all"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        네이버 지도
                    </a>
                )}
            </div>
        );
    }

    // ─── 기본 모드: 독립 섹션 (AboutPage 등) ───
    return (
        <motion.section className={cn("mt-24 mx-auto max-w-7xl px-6", className)} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 80 }}>
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
