// @ts-nocheck
/* eslint-disable */
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function PublicLayout() {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🧸</span>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">행복아동발달센터</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">센터 소개</Link>
                        <Link to="/programs" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">프로그램</Link>
                        <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">문의하기</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {/* 🛡️ 1. 학부모가 아닐 때 (관리자, 치료사) */}
                                {role !== 'parent' && (
                                    <Link
                                        to="/app" /* ✨ [핵심 수정] /app/dashboard -> /app */
                                        className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        {/* 문구도 역할에 따라 다르게 보여주면 더 좋습니다 */}
                                        ⚙️ {role === 'admin' ? '관리자 대시보드' : '업무 시스템 접속'}
                                    </Link>
                                )}

                                {/* 👨‍👩‍👧‍👦 2. 학부모일 때 */}
                                {role === 'parent' && (
                                    <Link
                                        to="/parent/home"
                                        className="text-sm font-bold text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full hover:bg-yellow-100 transition-all border border-yellow-200"
                                    >
                                        👶 내 아이 센터
                                    </Link>
                                )}

                                <button onClick={handleLogout} className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2">로그인</Link>
                                <Link to="/contact" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">상담 예약</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                <Outlet />
            </main>

            <footer className="bg-slate-50 py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-400 text-sm">© 2026 행복아동발달센터. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default PublicLayout;