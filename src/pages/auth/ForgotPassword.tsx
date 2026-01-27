import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { Helmet } from 'react-helmet-async';

export function ForgotPassword() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });
            if (error) throw error;
            setMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다. 메일함(스팸함)을 확인해주세요.');
        } catch (err: any) {
            setError(err.message || '요청 처리에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>비밀번호 찾기 - Zarada</title></Helmet>
            <div className={cn("min-h-screen flex items-center justify-center px-4 transition-colors", isDark ? "bg-slate-950" : "bg-slate-50")}>
                <div className={cn("w-full max-w-md p-8 rounded-[32px] shadow-lg border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
                    <div className="text-center mb-8">
                        <h2 className={cn("text-2xl font-black mb-2", isDark ? "text-white" : "text-slate-900")}>비밀번호 찾기</h2>
                        <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>가입한 이메일을 입력하시면 재설정 링크를 보내드립니다.</p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className={cn("block text-xs font-bold ml-1 mb-1", isDark ? "text-slate-500" : "text-slate-400")}>이메일</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cn("w-full px-4 py-3 rounded-2xl border font-bold text-sm outline-none transition-all",
                                    isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-2 ring-indigo-500/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-2 ring-indigo-500/20")}
                                placeholder="example@email.com"
                            />
                        </div>

                        {message && <div className="p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100">{message}</div>}
                        {error && <div className="p-4 bg-red-50 text-red-500 text-sm font-bold rounded-xl border border-red-100">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? '전송 중...' : '재설정 링크 보내기'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                const slug = window.location.pathname.split('/')[2];
                                if (slug && window.location.pathname.includes('/centers/')) {
                                    window.history.back();
                                } else {
                                    window.location.href = '/login';
                                }
                            }}
                            className={cn("text-xs font-bold hover:underline", isDark ? "text-slate-400" : "text-slate-500")}
                        >
                            로그인 페이지로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
