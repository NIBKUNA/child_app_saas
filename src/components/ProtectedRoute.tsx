// @ts-nocheck
/* eslint-disable */
import { Navigate, useLocation, Outlet } from 'react-router-dom'; // ✨ Outlet 추가
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children?: React.ReactNode; // ✨ 물음표(?) 추가: children이 없을 수도 있음을 명시
    allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    // 1. 로딩 중 UI
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    <p className="text-slate-400 font-bold text-sm">보안 접속 중...</p>
                </div>
            </div>
        );
    }

    // 2. 비로그인 처리
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. 권한 없음 처리
    if (role && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    // 4. ✨ [핵심 수정] 
    // 내용물(children)이 있으면 그걸 보여주고, 
    // 없으면 라우터가 매칭시켜준 하위 페이지(Outlet)를 보여줍니다.
    return children ? <>{children}</> : <Outlet />;
}