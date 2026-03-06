/**
 * 🔄 Pull-to-Refresh Hook for PWA (iOS Safari + Android)
 * iPhone 홈 화면 추가 PWA에서 당겨서 새로고침 기능 구현
 * 
 * ✨ [2026-03-06 Fix] iOS 스크롤 차단 + 리프레시 미작동 버그 수정
 * - scrollTop tolerance 추가 (iOS 바운스 스크롤의 미세 양수값 대응)
 * - preventDefault() 호출 조건 강화 (확실히 pull 중일 때만)
 * - 아래로 스크롤 시 즉시 pull 모드 해제
 */
import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
    /** 새로고침 트리거까지 필요한 당김 거리 (px) */
    threshold?: number;
    /** 스크롤 컨테이너 ref */
    containerRef: React.RefObject<HTMLElement>;
}

// iOS 바운스 스크롤에서 scrollTop이 정확히 0이 아닌 미세한 양수값을 반환할 수 있음
const SCROLL_TOP_TOLERANCE = 5;

export function usePullToRefresh({ threshold = 80, containerRef }: UsePullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const container = containerRef.current;
        // ✨ [Fix] tolerance 적용: iOS 바운스로 scrollTop이 0.5~2px일 수 있음
        if (!container || container.scrollTop > SCROLL_TOP_TOLERANCE || isRefreshing) return;
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
    }, [containerRef, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;
        const container = containerRef.current;

        // ✨ [Fix] 스크롤이 상단이 아니면 즉시 pull 모드 해제
        if (!container || container.scrollTop > SCROLL_TOP_TOLERANCE) {
            isPulling.current = false;
            setPullDistance(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && container.scrollTop <= SCROLL_TOP_TOLERANCE) {
            // 위로 당기는 중 (pull-to-refresh)
            const dampened = Math.min(diff * 0.4, threshold * 1.5);
            setPullDistance(dampened);

            // ✨ [Fix] 실제로 pull UI가 작동 중일 때만 preventDefault 호출
            // dampened > 10 → 확실히 pull 제스처로 인식된 후에만 네이티브 스크롤 차단
            if (dampened > 10) {
                e.preventDefault();
            }
        } else {
            // ✨ [Fix] diff <= 0이면 아래로 스크롤하려는 것 → pull 모드 즉시 해제
            // 이전에는 여기서 해제하지 않아 iOS에서 스크롤이 "자석처럼 붙는" 현상 발생
            isPulling.current = false;
            setPullDistance(0);
        }
    }, [containerRef, isRefreshing, threshold]);

    const handleTouchEnd = useCallback(() => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(threshold * 0.6);

            // 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 400);
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, threshold]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { pullDistance, isRefreshing };
}
