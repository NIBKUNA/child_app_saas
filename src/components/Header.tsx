// @ts-nocheck
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // AuthContext 경로 확인
// ... 기타 import

export function Header() {
    // 1. role 정보 가져오기
    const { user, role, signOut } = useAuth();

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* 로고 영역 */}
                <Link to="/" className="font-black text-xl flex items-center gap-2">
                    🧸 행복아동발달센터
                </Link>

                {/* 우측 메뉴 영역 */}
                <div className="flex items-center gap-4">
                    <Link to="/about" className="text-sm font-bold text-slate-500 hover:text-slate-900">센터 소개</Link>
                    <Link to="/programs" className="text-sm font-bold text-slate-500 hover:text-slate-900">프로그램</Link>

                    {/* ✨ 로그인 상태에 따른 버튼 분기 처리 */}
                    {user ? (
                        <>
                            {/* 🛡️ [수정됨] 학부모가 아닐 때만(관리자, 치료사 등) '관리자 대시보드' 버튼 노출 */}
                            {role !== 'parent' && (
                                <Link
                                    to="/app/dashboard"
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-black hover:bg-slate-200 transition-colors"
                                >
                                    ⚙️ 관리자 대시보드
                                </Link>
                            )}

                            {/* 👨‍👩‍👧‍👦 [추가] 학부모일 때는 '내 아이 관리' 버튼을 헤더에도 띄워주면 좋습니다 (선택사항) */}
                            {role === 'parent' && (
                                <Link
                                    to="/parent/home"
                                    className="px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-full text-xs font-black hover:bg-yellow-100 transition-colors"
                                >
                                    👶 내 아이 센터
                                </Link>
                            )}

                            <button
                                onClick={signOut}
                                className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        // 비로그인 상태
                        <Link
                            to="/login"
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black hover:bg-primary transition-all shadow-lg shadow-slate-200"
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}