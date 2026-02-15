/**
 * 🌐 API 서버리스 함수용 공용 설정
 * 
 * Vercel 서버리스 환경에서는 Vite의 import.meta.env를 사용할 수 없으므로
 * process.env 기반의 별도 상수 파일이 필요합니다.
 * 
 * 도메인 변경 시 이 파일과 src/config/domain.ts만 수정하면 됩니다.
 */

/** 메인 SaaS 플랫폼 도메인 */
export const PLATFORM_DOMAIN = 'app.myparents.co.kr';

/** 메인 플랫폼 Base URL (환경 변수 우선, 하드코딩 폴백) */
export const BASE_URL = process.env.BASE_URL || `https://${PLATFORM_DOMAIN}`;

/** 로컬/개발 환경 호스트 목록 */
export const DEV_HOSTS = ['localhost', '127.0.0.1'];

/** 메인 플랫폼 도메인 여부 확인 (서버리스용) */
export function isDefaultDomain(host: string): boolean {
    const clean = host.replace(/^www\./, '');
    return clean === PLATFORM_DOMAIN
        || DEV_HOSTS.includes(clean)
        || clean.endsWith('.vercel.app');
}
