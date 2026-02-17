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
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase, setRememberMe, getRememberMe } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding';
import { isSuperAdmin } from '@/config/superAdmin';

// Custom SVG Icons
type IconFunction = (className: string) => ReactNode;

const Icons: Record<string, IconFunction> = {
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
    const { center } = useCenter(); // ✨ Get Center Context
    const { branding } = useCenterBranding(); // ✨ Get Unified Branding
    const isDark = theme === 'dark';
    const centerName = branding?.name || getSetting('center_name') || 'Zarada';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMeState] = useState(getRememberMe());
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams();
    // ✨ [Fix] 커스텀 도메인에서는 URL에 slug가 없으므로 CenterContext에서 가져옴
    const slug = urlSlug || center?.slug;

    // ✨ Agreement Modal State
    const [showAgreement] = useState(false);

    // ✨ [Mount Check] Redirect if already logged in
    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                if (isSuperAdmin(session.user.email)) {
                    navigate('/master/centers', { replace: true });
                } else {
                    // Try to restore center context if exists, otherwise go to parent home or app home
                    const savedSlug = localStorage.getItem('zarada_center_slug');
                    if (savedSlug) {
                        navigate('/app/dashboard', { replace: true });
                    } else {
                        navigate('/', { replace: true }); // Back to portal to pick a center
                    }
                }
            }
        }

        async function handleOAuthCallback() {
            const hash = window.location.hash;
            const params = new URLSearchParams(window.location.search);
            const isOAuthCallback = hash.includes('access_token') || params.has('code');

            if (!isOAuthCallback) {
                // Not an OAuth callback? Just check if we're already logged in normally.
                checkSession();
                return;
            }

            // ✨ Wait for Supabase to process the hash/tokens
            const { data: { session } } = await supabase.auth.getSession();

            // ... (existing OAuth logic remains same)
            if (session?.user) {
                if (hash.includes('type=invite') || hash.includes('type=recovery') || params.get('type') === 'invite' || params.get('type') === 'recovery') {
                    navigate('/auth/update-password');
                    return;
                }
                if (isSuperAdmin(session.user.email)) {
                    navigate(!slug ? '/master/centers' : '/app/dashboard', { replace: true });
                } else {
                    navigate('/app/dashboard');
                }
            }
        }
        handleOAuthCallback();
    }, [navigate, slug]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            setRememberMe(rememberMe);

            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (user && user.email) {
                // 🛡️ Super Admin Whitelist check 
                const isSuper = isSuperAdmin(user.email);

                let { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('role, center_id')
                    .eq('id', user.id)
                    .maybeSingle();

                // ✨ [God Mode / Auto-Repair] 
                if (!profile) {
                    if (isSuper) {
                        profile = { role: 'super_admin', center_id: null };
                    } else {
                        // Therapist Auto-Repair
                        const { data: therapist } = await supabase
                            .from('therapists')
                            .select('system_role')
                            .ilike('email', user.email)
                            .maybeSingle();

                        if (therapist) {
                            profile = { role: (therapist.system_role || 'therapist') as typeof profile extends null ? never : NonNullable<typeof profile>['role'], center_id: null };
                        } else {
                            console.error('프로필 정보를 가져올 수 없습니다:', profileError);
                            setError('회원 프로필 정보를 찾을 수 없습니다. (계정 오류)');
                            return;
                        }
                    }
                } else if (isSuper) {
                    // 👑 Force clear center_id for existing Super Admin profiles to prevent captures
                    profile = { ...profile, center_id: null };
                }

                if (!profile) {
                    setError('회원 프로필 정보를 찾을 수 없습니다.');
                    return;
                }

                // 3. ✨ [Sovereign SaaS] Center Routing Logic
                // 유저의 소속 센터를 찾아 Context를 설정하고 해당 화면으로 이동
                if (profile.role === 'super_admin') {
                    // ✨ [Sovereign SaaS] Super Admin Context Management
                    // If slug is present (Scenario 2), set it. If not (Scenario 1), clear it.
                    if (slug) {
                        localStorage.setItem('zarada_center_slug', slug);
                    } else {
                        localStorage.removeItem('zarada_center_slug');
                    }
                } else if (profile.center_id) {
                    const { data: centerData } = await supabase
                        .from('centers')
                        .select('slug')
                        .eq('id', profile.center_id)
                        .maybeSingle();

                    if (centerData?.slug) {
                        localStorage.setItem('zarada_center_slug', centerData.slug);
                    }
                }

                switch (profile.role) {
                    case 'super_admin':
                        // ✨ [Sovereign SaaS] Super Admin Directive
                        // 1. Global Page > Admin Login -> Master Console
                        // 2. Center Page > Login -> Center Dashboard
                        const isGlobalPath = !slug;

                        if (isGlobalPath) {
                            localStorage.removeItem('zarada_center_slug');
                            navigate('/master/centers', { replace: true });
                        } else {
                            // Contextual Login - Respect existing context (set by URL/Guard)
                            const selectedSlug = localStorage.getItem('zarada_center_slug');
                            if (selectedSlug) {
                                navigate('/app/dashboard');
                            } else {
                                navigate('/master/centers', { replace: true });
                            }
                        }
                        break;
                    case 'admin':
                        navigate('/app/dashboard');
                        break;
                    case 'manager':
                    case 'therapist':
                        navigate('/app/schedule'); // Land on Schedule directly
                        break;
                    case 'parent':
                        navigate('/parent/home');
                        break;
                    default:
                        navigate(center?.slug ? `/centers/${center.slug}` : '/');
                }
            }
        } catch (err: any) {
            let msg = err.message || '로그인 중 오류가 발생했습니다.';
            if (msg.includes('Invalid login credentials')) msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAgree = () => {
        // ✨ 약관 동의 후 회원가입 페이지로 이동 (센터 컨텍스트 유지 시도)
        navigate(center?.slug ? `/centers/${center.slug}/register` : '/register');
    };

    const handleDisagree = async () => {
        // 🛑 동의 거부 시 로그아웃 및 홈으로
        await supabase.auth.signOut();
        navigate(center?.slug ? `/centers/${center.slug}` : '/');
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
                        to={center?.slug ? `/centers/${center.slug}` : "/"}
                        className={cn(
                            "absolute top-6 right-6 p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                        )}
                    >
                        {Icons.close("w-5 h-5")}
                    </Link>

                    <div className="text-center pt-2">
                        {branding.logo_url && (
                            <div className="flex justify-center mb-6">
                                <img
                                    src={branding.logo_url}
                                    alt={centerName}
                                    className="h-12 w-auto object-contain"
                                    style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
                                />
                            </div>
                        )}
                        <h2 className={cn(
                            "text-2xl font-black tracking-tight",
                            isDark ? "text-white" : "text-slate-900"
                        )} style={branding.brand_color ? { color: branding.brand_color } : {}}>
                            {branding.name || 'Zarada'}
                        </h2>
                        <h3 className={cn(
                            "text-xl font-bold tracking-tight mt-2",
                            isDark ? "text-slate-200" : "text-slate-800"
                        )}>다시 오신 걸 환영해요!</h3>
                        <p className={cn(
                            "mt-2 text-sm font-medium",
                            isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                            센터 서비스를 위해 로그인이 필요합니다.
                        </p>
                    </div>

                    {/* Email Form */}
                    <form className="space-y-5" onSubmit={handleLogin}>
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
                                            ? "border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/20"
                                            : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    )}
                                    placeholder="example@email.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1 ml-1">
                                    <label htmlFor="password" className={cn(
                                        "block text-xs font-black",
                                        isDark ? "text-slate-500" : "text-slate-400"
                                    )}>
                                        비밀번호
                                    </label>
                                    <Link
                                        to={slug ? `/centers/${slug}/forgot-password` : "/forgot-password"}
                                        className={cn(
                                            "text-xs font-bold hover:underline opacity-80",
                                            isDark ? "text-slate-500" : "text-slate-400"
                                        )}
                                    >
                                        비밀번호 변경(분실)
                                    </Link>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={cn(
                                        "block w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
                                        isDark
                                            ? "border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/20"
                                            : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                    )}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-xs font-bold text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}

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

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "flex w-full justify-center items-center py-4 px-4 text-sm font-black rounded-2xl shadow-lg transition-all",
                                !branding.brand_color ? "bg-slate-900 text-white hover:bg-slate-800" : "text-white hover:brightness-110",
                                "hover:scale-[1.02] active:scale-95",
                                loading && "opacity-80 cursor-not-allowed"
                            )}
                            style={branding.brand_color ? { backgroundColor: branding.brand_color } : {}}
                        >
                            {loading ? (
                                <>
                                    {Icons.loader("w-5 h-5 animate-spin mr-2")}
                                    로그인 중...
                                </>
                            ) : '이메일로 로그인'}
                        </button>
                    </form>
                    {/* Sign Up Section - 통합페이지(슈퍼어드민 전용)에서는 회원가입 숨김 */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
                        {slug && (
                            <>
                                <p className={cn(
                                    "text-xs font-bold",
                                    isDark ? "text-slate-500" : "text-slate-400"
                                )}>
                                    Zarada가 처음이신가요?
                                </p>
                                <Link
                                    to={`/centers/${slug}/register`}
                                    className={cn(
                                        "flex w-full justify-center items-center py-4 px-4 text-sm font-black rounded-2xl border transition-all hover:scale-[1.02] active:scale-95",
                                        isDark
                                            ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                                            : "border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                                    )}
                                >
                                    회원가입하고 시작하기
                                </Link>
                            </>
                        )}

                        <Link
                            to={slug ? `/centers/${slug}` : "/"}
                            className="inline-block text-[11px] font-black uppercase tracking-widest text-indigo-500/50 hover:text-indigo-500 transition-colors"
                        >
                            {slug ? '← 센터 홈으로 돌아가기' : '통합 센터 검색으로 돌아가기'}
                        </Link>
                    </div>
                </div>
            </div>

            {/* ✨ Agreement Modal */}
            {showAgreement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className={cn(
                        "w-full max-w-md p-8 rounded-[32px] shadow-2xl space-y-6 relative overflow-hidden",
                        isDark ? "bg-slate-900" : "bg-white"
                    )}>
                        <div className="text-center space-y-2">
                            <h3 className={cn("text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>이용 약관 동의</h3>
                            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                                서비스 이용을 위해 필수 약관에 동의해주세요.<br />
                                동의 후 회원가입 절차가 진행됩니다.
                            </p>
                        </div>

                        <div className={cn("p-4 rounded-2xl text-xs space-y-2 max-h-40 overflow-y-auto custom-scrollbar", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600")}>
                            <p className="font-bold">[필수] 서비스 이용 약관</p>
                            <p>제 1조 (목적) 본 약관은...</p>
                            <div className="h-px bg-current opacity-10 my-2" />
                            <p className="font-bold">[필수] 개인정보 수집 및 이용 동의</p>
                            <p>1. 수집 항목: 이메일, 프로필 이미지...</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleDisagree}
                                className={cn(
                                    "flex-1 py-3.5 rounded-2xl font-bold text-sm transition-colors",
                                    isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                동의 안함
                            </button>
                            <button
                                onClick={handleAgree}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                모두 동의하고 시작
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}