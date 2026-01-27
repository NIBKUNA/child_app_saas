import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useCenter } from '@/contexts/CenterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';

interface CenterGuardProps {
    children?: React.ReactNode;
}

export const CenterGuard: React.FC<CenterGuardProps> = ({ children }) => {
    const { center, loading: centerLoading } = useCenter();
    const { role, loading: authLoading } = useAuth();
    const location = useLocation();
    const { slug: urlSlug } = useParams();

    const isPublicPath = location.pathname.startsWith('/centers');
    const isAdminPath = location.pathname.startsWith('/app/admin') || location.pathname.startsWith('/master');
    const isSuperAdmin = role === 'super_admin';

    // 🚀 [Critical Fix] URL 슬러그가 있는데 아직 컨텍스트가 로드되지 않았거나 다른 경우
    // 이 상태에서 Redirect 하는 현상이 '0.1초 튕김'의 원인입니다.
    const isTransitioning = urlSlug && center?.slug !== urlSlug;

    // 1. 센터 정보 로딩 중이거나 권한 확인 중일 때 로더 표시
    // ✨ [UX Optimization] 공용 페이지 진입 시에는 '보안 확인' 느낌을 줄이고 '센터 진입' 느낌을 줍니다.
    if (centerLoading || authLoading || isTransitioning) {
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
    // 센터가 선택되지 않았고, 관련 경로도 아니며, 슈퍼 어드민도 아닐 때만 리다이렉트
    if (!center && !isAdminPath && !isSuperAdmin) {
        if (location.pathname === '/' || location.pathname === '') return <Outlet />;

        console.log("🛡️ [CenterGuard] No center selected, redirecting to portal...");
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
