import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, setRememberMe, getRememberMe } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '@/config/superAdmin';

// Icons
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
};

interface HomeLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    centerName?: string;
}

export function HomeLoginModal({ isOpen, onClose, centerName = "아동발달센터" }: HomeLoginModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMeState] = useState(getRememberMe());

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

            if (user) {
                if (user && isSuperAdmin(user.email)) {
                    // 🛡️ Super Admin Bypass
                    navigate('/app/dashboard');
                    return;
                }

                // Explicitly typing the response to avoid "never" issues if local types aren't perfect
                let { data: profile } = await (supabase as any)
                    .from('user_profiles')
                    .select('role, center_id')
                    .eq('id', user.id)
                    .maybeSingle();

                // ✨ [Auto-Repair] If profile missing but therapist exists
                if (!profile) {
                    const { data: therapist } = await supabase
                        .from('therapists')
                        .select('system_role')
                        .ilike('email', user.email || '')
                        .maybeSingle();

                    if (therapist) {
                        // Cast to any to bypass strict type check if needed or just conform
                        profile = { role: (therapist as any).system_role || 'therapist', center_id: null } as any;
                    } else {
                        setError('회원 프로필 정보를 찾을 수 없습니다.');
                        return;
                    }
                }

                // Safety check
                if (!profile) {
                    setError('회원 프로필 정보를 찾을 수 없습니다.');
                    return;
                }

                // Center Routing
                if (profile.center_id) {
                    const { data: centerData } = await supabase
                        .from('centers')
                        .select('slug')
                        .eq('id', profile.center_id)
                        .maybeSingle();

                    if (centerData && (centerData as any).slug) {
                        localStorage.setItem('zarada_center_slug', (centerData as any).slug);
                    }
                }

                switch (profile.role) {
                    case 'super_admin':
                        // ✨ [Sovereign SaaS] Super Admin Impersonation
                        const selectedSlug = localStorage.getItem('zarada_center_slug');
                        if (selectedSlug) {
                            navigate('/app/dashboard');
                        } else {
                            navigate('/master/centers');
                        }
                        break;
                    case 'admin':
                        navigate('/app/dashboard');
                        break;
                    case 'manager':
                    case 'therapist':
                        navigate('/app/schedule');
                        break;
                    case 'parent':
                        navigate('/parent/home');
                        break;
                    default:
                        // Reload or stay to update auth state
                        window.location.reload();
                }
                onClose();
            }
        } catch (err: any) {
            let msg = err.message || '로그인 중 오류가 발생했습니다.';
            if (msg.includes('Invalid login credentials')) msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            className={cn(
                                "w-full max-w-[400px] p-8 rounded-[32px] shadow-2xl relative overflow-hidden pointer-events-auto",
                                isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-100"
                            )}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className={cn(
                                    "absolute top-5 right-5 p-2 rounded-full transition-colors",
                                    isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                                )}
                            >
                                {Icons.close("w-5 h-5")}
                            </button>

                            <div className="text-center mb-8">
                                <h2 className={cn("text-2xl font-black mb-2", isDark ? "text-white" : "text-slate-900")}>
                                    센터 로그인
                                </h2>
                                <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                                    {centerName}에 오신 것을 환영합니다.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleLogin}>
                                <div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={cn(
                                            "block w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
                                            isDark
                                                ? "border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:bg-slate-700 focus:border-indigo-500"
                                                : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500"
                                        )}
                                        placeholder="이메일 주소"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={cn(
                                            "block w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
                                            isDark
                                                ? "border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:bg-slate-700 focus:border-indigo-500"
                                                : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500"
                                        )}
                                        placeholder="비밀번호"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember-me-modal"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMeState(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="remember-me-modal" className={cn("text-xs font-bold cursor-pointer", isDark ? "text-slate-400" : "text-slate-500")}>
                                        로그인 상태 유지
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-black text-white text-sm shadow-lg transition-all mb-4",
                                        "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]",
                                        loading && "opacity-70 cursor-wait"
                                    )}
                                >
                                    {loading ? '로그인 중...' : '로그인'}
                                </button>

                                <div className="flex flex-col gap-3 pt-2">
                                    <div className="flex items-center justify-between px-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const slug = window.location.pathname.split('/')[2];
                                                navigate(slug ? `/centers/${slug}/forgot-password` : '/forgot-password');
                                                onClose();
                                            }}
                                            className={cn("text-xs font-bold hover:underline", isDark ? "text-slate-500" : "text-slate-400")}
                                        >
                                            비밀번호 변경(분실)
                                        </button>
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-700" : "text-slate-200")}>Security</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const slug = window.location.pathname.split('/')[2];
                                            navigate(slug ? `/centers/${slug}/register` : '/register');
                                            onClose();
                                        }}
                                        className={cn(
                                            "w-full py-3.5 rounded-2xl font-black text-xs border transition-all",
                                            isDark
                                                ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                                                : "border-slate-100 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        처음이신가요? 회원가입하기
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
