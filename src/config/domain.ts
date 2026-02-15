/**
 * 🌐 플랫폼 도메인 설정
 * 
 * 모든 도메인 관련 판단/리다이렉트의 단일 소스(Single Source of Truth).
 * 도메인 변경 시 여기만 수정하면 됩니다.
 */

/** 메인 SaaS 플랫폼 도메인 */
export const PLATFORM_DOMAIN = 'app.myparents.co.kr';

/** 메인 플랫폼 Base URL */
export const PLATFORM_URL = `https://${PLATFORM_DOMAIN}`;

/** 로컬/개발 환경 호스트 목록 */
const DEV_HOSTS = ['localhost', '127.0.0.1'];

/**
 * 현재 접속 도메인이 메인 플랫폼(또는 개발 환경)인지 판단
 * - 커스텀 도메인(센터별)이면 false
 */
export function isMainDomain(hostname?: string): boolean {
    const host = hostname || window.location.hostname;
    const clean = host.replace(/^www\./, '');
    return clean === PLATFORM_DOMAIN
        || DEV_HOSTS.includes(clean)
        || clean.endsWith('.vercel.app');
}

/**
 * 로컬 개발 환경 여부 판단
 * - Vite의 import.meta.env.DEV와 동일한 역할이지만,
 *   서버리스 함수(.ts)에서도 사용 가능하도록 런타임 체크 포함
 */
export function isLocalDev(): boolean {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.DEV;
    }
    // 런타임 폴백
    return typeof window !== 'undefined'
        && DEV_HOSTS.includes(window.location.hostname);
}

/**
 * 메인 플랫폼 도메인으로 네비게이트
 * - 이미 메인 도메인이면 navigate() 사용 (SPA 라우팅)
 * - 커스텀 도메인이면 window.location.href로 강제 이동
 */
export function navigateToMainDomain(
    path: string,
    navigate: (path: string) => void
): void {
    if (isMainDomain()) {
        navigate(path);
    } else {
        window.location.href = `${PLATFORM_URL}${path}`;
    }
}
