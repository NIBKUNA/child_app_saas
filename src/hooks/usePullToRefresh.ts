/**
 * 🔄 Pull-to-Refresh Hook for PWA (iOS Safari)
 * iPhone 홈 화면 추가 PWA에서 당겨서 새로고침 기능 구현
 */
import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
    /** 새로고침 트리거까지 필요한 당김 거리 (px) */
    threshold?: number;
    /** 스크롤 컨테이너 ref */
    containerRef: React.RefObject<HTMLElement>;
}

export function usePullToRefresh({ threshold = 80, containerRef }: UsePullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const container = containerRef.current;
        if (!container || container.scrollTop > 0 || isRefreshing) return;
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
    }, [containerRef, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;
        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            isPulling.current = false;
            setPullDistance(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // 저항감 적용 (로그 스케일)
            const dampened = Math.min(diff * 0.4, threshold * 1.5);
            setPullDistance(dampened);
            if (diff > 10) e.preventDefault();
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
