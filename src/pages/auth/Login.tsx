// @ts-nocheck
/* eslint-disable */
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
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, setRememberMe, getRememberMe } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';

// Custom SVG Icons
const Icons = {
    loader: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeLinecap="round" />
        </svg>
    ),
    close: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />
        </svg>
    ),
    google: (className: string) => (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    ),
    kakao: (className: string) => (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.636 4.03 5.88-.18.67-.64 2.42-.73 2.8-.12.49.18.48.38.35.15-.1 2.47-1.68 3.47-2.37.6.09 1.22.14 1.85.14 5.523 0 10-3.478 10-7.77C22 6.477 17.523 3 12 3z" fill="#3C1E1E" />
        </svg>
    ),
};

export function Login() {
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const centerName = getSetting('center_name') || '아동발달센터';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMeState] = useState(getRememberMe()); // ✨ 로그인 유지 체크박스
    const navigate = useNavigate();

    // ✨ [OAuth 콜백 처리] OAuth 로그인 후 돌아왔을 때만 세션 체크
    useEffect(() => {
        async function handleOAuthCallback() {
            // URL에 access_token이나 code가 있을 때만 (OAuth 콜백일 때만) 세션 체크
            const hash = window.location.hash;
            const params = new URLSearchParams(window.location.search);
            const isOAuthCallback = hash.includes('access_token') || params.has('code');

            if (!isOAuthCallback) return; // OAuth 콜백이 아니면 아무것도 안 함

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role, center_id, status')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profile?.center_id && profile?.status === 'active') {
                    // 이미 가입 완료 -> 홈으로
                    if (profile.role === 'admin' || profile.role === 'super_admin') navigate('/app/dashboard');
                    else if (profile.role === 'therapist') navigate('/app/schedule');
                    else navigate('/parent/home');
                } else {
                    // 신규 유저 -> 가입 페이지로
                    navigate('/register');
                }
            }
        }
        handleOAuthCallback();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // ✨ [로그인 유지] 체크 여부에 따라 세션 스토리지 결정
            setRememberMe(rememberMe);

            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error('프로필 정보를 가져올 수 없습니다:', profileError);
                    navigate('/');
                    return;
                }

                switch (profile.role) {
                    case 'super_admin':
                    case 'admin':
                        navigate('/app/dashboard');
                        break;
                    case 'employee':
                    case 'therapist':
                        navigate('/app/schedule');
                        break;
                    case 'parent':
                        navigate('/parent/home');
                        break;
                    default:
                        navigate('/');
                }
            }
        } catch (err: any) {
            setError(err.message || '로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>로그인 - {centerName}</title>
            </Helmet>

            <div className={cn(
                "min-h-screen flex items-center justify-center px-4 relative transition-colors",
                isDark ? "bg-slate-950" : "bg-slate-50"
            )}>
                <div className={cn(
                    "w-full max-w-md space-y-8 p-10 rounded-[40px] shadow-xl border relative",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                )}>
                    {/* Close Button */}
                    <Link
                        to="/"
                        className={cn(
                            "absolute top-6 right-6 p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                        )}
                    >
                        {Icons.close("w-5 h-5")}
                    </Link>

                    <div className="text-center pt-2">
                        <h2 className={cn(
                            "text-2xl font-black tracking-tight",
                            isDark ? "text-white" : "text-slate-900"
                        )}>다시 오신 걸 환영해요!</h2>
                        <p className={cn(
                            "mt-2 text-sm font-medium",
                            isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                            센터 서비스를 위해 로그인이 필요합니다.
                        </p>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className={cn(
                                    "block text-xs font-black ml-1 mb-1",
                                    isDark ? "text-slate-500" : "text-slate-400"
                                )}>
                                    이메일 주소
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={cn(
                                        "block w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
                                        isDark
                                            ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/20"
                                            : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    )}
                                    placeholder="example@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className={cn(
                                    "block text-xs font-black ml-1 mb-1",
                                    isDark ? "text-slate-500" : "text-slate-400"
                                )}>
                                    비밀번호
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={cn(
                                        "block w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
                                        isDark
                                            ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/20"
                                            : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    )}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-xs font-bold text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        {/* ✨ 로그인 상태 유지 체크박스 */}
                        <div className="flex items-center gap-3 pt-2">
                            <input
                                id="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMeState(e.target.checked)}
                                className={cn(
                                    "w-5 h-5 rounded-lg border-2 cursor-pointer transition-all accent-indigo-600",
                                    isDark
                                        ? "border-slate-600 bg-slate-800"
                                        : "border-slate-300 bg-white"
                                )}
                            />
                            <label htmlFor="remember-me" className={cn(
                                "text-sm font-bold cursor-pointer select-none",
                                isDark ? "text-slate-400" : "text-slate-600"
                            )}>
                                로그인 상태 유지
                            </label>
                        </div>

                        <div className="pt-2">
                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "flex w-full justify-center items-center py-4 px-4 text-sm font-black rounded-2xl shadow-lg transition-all",
                                    "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-95",
                                    "shadow-indigo-500/25",
                                    loading && "opacity-80 cursor-not-allowed"
                                )}
                            >
                                {loading ? (
                                    <>
                                        {Icons.loader("w-5 h-5 animate-spin mr-2")}
                                        로그인 중...
                                    </>
                                ) : '로그인'}
                            </button>
                        </div>

                        {/* ✨ 소셜 로그인 구분선 */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className={cn("w-full border-t", isDark ? "border-slate-700" : "border-slate-200")} />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className={cn("px-4 font-bold", isDark ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400")}>
                                    또는
                                </span>
                            </div>
                        </div>

                        {/* ✨ 소셜 로그인 버튼 */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: { redirectTo: `${window.location.origin}/login` }
                                    });
                                }}
                                className={cn(
                                    "flex w-full items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all hover:scale-[1.02]",
                                    isDark
                                        ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                {Icons.google("w-5 h-5")}
                                Google로 계속하기
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await supabase.auth.signInWithOAuth({
                                        provider: 'kakao',
                                        options: { redirectTo: `${window.location.origin}/login` }
                                    });
                                }}
                                className="flex w-full items-center justify-center gap-3 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD800]"
                            >
                                {Icons.kakao("w-5 h-5")}
                                카카오로 계속하기
                            </button>
                        </div>

                        <div className="text-center space-y-4">
                            <div className={cn(
                                "text-sm font-medium",
                                isDark ? "text-slate-400" : "text-slate-500"
                            )}>
                                계정이 없으신가요?
                                {/* Register Link - indigo-600 / indigo-400 for dark */}
                                <Link
                                    to="/register"
                                    className={cn(
                                        "ml-1 font-bold hover:underline",
                                        isDark ? "text-indigo-400" : "text-indigo-600"
                                    )}
                                >
                                    회원가입
                                </Link>
                            </div>
                            <Link
                                to="/"
                                className={cn(
                                    "block text-xs font-bold transition-colors",
                                    isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                ← 홈으로 돌아가기
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}