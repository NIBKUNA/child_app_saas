import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 🚀 ScrollToTop Component
 * 페이지 이동 시 브라우저 스크롤을 최상단으로 리셋합니다.
 */
export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
