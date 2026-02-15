/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */
import { Navigate, useLocation, Outlet } from 'react-router-dom'; // ✨ Outlet 추가
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { isSuperAdmin as checkSuperAdmin } from '@/config/superAdmin';

// ✨ allowedRoles에 null을 제외한 UserRole만 허용
type AllowedRole = Exclude<UserRole, null>;

interface ProtectedRouteProps {
    children?: React.ReactNode; // ✨ 물음표(?) 추가: children이 없을 수도 있음을 명시
    allowedRoles: AllowedRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    // 1. 로딩 중 UI (AuthContext가 fetchRole 완료할 때까지 True 유지됨)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    <p className="text-slate-400 font-bold text-sm">권한 정보를 확인하고 있습니다...</p>
                </div>
            </div>
        );
    }

    // 2. 비로그인 처리
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. ✨ [마스터 키] super_admin 역할은 모든 권한 통과 (DB 역할 기반)
    const isMasterUser = role === 'super_admin' || checkSuperAdmin(user?.email);

    if (!isMasterUser && role && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    // 4. ✨ [핵심 수정] 
    // 내용물(children)이 있으면 그걸 보여주고, 
    // 없으면 라우터가 매칭시켜준 하위 페이지(Outlet)를 보여줍니다.
    return children ? <>{children}</> : <Outlet />;
}