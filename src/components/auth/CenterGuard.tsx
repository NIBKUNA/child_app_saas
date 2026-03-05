import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCenter } from '@/contexts/CenterContext';
import { useAuth } from '@/contexts/AuthContext';
import { isMainDomain } from '@/config/domain';
import { Loader2, Sparkles } from 'lucide-react';

interface CenterGuardProps {
    children?: React.ReactNode;
}

/** 커스텀 도메인에서 /centers/:slug 없이 직접 접근하는 공개 경로 */
const CUSTOM_DOMAIN_PUBLIC_PATHS = ['/about', '/programs', '/therapists', '/contact'];

export const CenterGuard: React.FC<CenterGuardProps> = ({ children }) => {
    const { center, loading: centerLoading } = useCenter();
    const { role, loading: authLoading } = useAuth();
    const location = useLocation();

    const isPublicPath = location.pathname.startsWith('/centers')
        || CUSTOM_DOMAIN_PUBLIC_PATHS.includes(location.pathname);
    const isAppPath = location.pathname.startsWith('/app');
    const isAdminPath = location.pathname.startsWith('/app/admin') || location.pathname.startsWith('/master');
    const isSuperAdmin = role === 'super_admin';
    const isCustomDomain = !isMainDomain();

    // CenterContext가 loading 상태를 직접 관리하므로 별도 transition 체크 불필요
    if (centerLoading || authLoading) {
        if (isPublicPath) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 opacity-20" />
                        <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-indigo-600 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black tracking-tighter text-slate-400">센터 홈페이지로 연결하고 있습니다...</p>
                </div>
            );
        }

        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
                    <p className="mt-4 text-sm font-black text-slate-500">지점 보안 및 구성 정보를 확인하고 있습니다...</p>
                </div>
            </div>
        );
    }

    // 2. 권한 유효성 검사 및 리다이렉트
    // 커스텀 도메인에서는 center가 아직 없더라도 공개 페이지 접근을 허용 (CenterContext가 도메인 기반으로 로드)
    if (!center && !isAdminPath && !isAppPath && !isSuperAdmin) {
        if (location.pathname === '/' || location.pathname === '') return <Outlet />;

        // 커스텀 도메인 공개 경로이면 리다이렉트하지 않음 — CenterContext 로드 대기
        if (isCustomDomain && isPublicPath) return <Outlet />;

        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
