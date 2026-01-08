// @ts-nocheck
/* eslint-disable */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { Loader2, Lock, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Supabase Auth 로그인 시도
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (user) {
                // 2. ✨ 로그인 성공 후 user_profiles 테이블에서 역할(role) 가져오기
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('프로필 정보를 가져올 수 없습니다:', profileError);
                    // 프로필이 없는 경우 기본적으로 홈으로 이동
                    navigate('/');
                    return;
                }

                // 3. ✨ 역할(role)에 따른 리다이렉트 분기 처리
                // 사용자의 제안: admin(전체), employee(일정/일지), parent(아이정보/그래프)
                switch (profile.role) {
                    case 'admin':
                        navigate('/app/dashboard'); // 관리자: 모든 기능 액세스
                        break;
                    case 'employee':
                        navigate('/app/schedule');  // 직원: 치료일정 및 상담일지 중심
                        break;
                    case 'parent':
                        navigate('/parent/home');   // 학부모: 해당 아동 전용 홈
                        break;
                    default:
                        navigate('/'); // 알 수 없는 역할인 경우 메인으로
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
                <title>로그인 - 행복아동발달센터</title>
            </Helmet>

            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center text-4xl mb-4 bg-orange-50 w-20 h-20 rounded-3xl">🧸</div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">다시 오신 걸 환영해요!</h2>
                        <p className="mt-2 text-sm text-slate-500 font-medium">
                            센터 서비스를 위해 로그인이 필요합니다.
                        </p>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-xs font-black text-slate-400 ml-1 mb-1 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> 이메일 주소
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    placeholder="example@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-black text-slate-400 ml-1 mb-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> 비밀번호
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-500 border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "flex w-full justify-center items-center py-4 px-4 bg-primary text-white text-sm font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all",
                                    loading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : '로그인'}
                            </button>
                        </div>

                        <div className="text-center text-sm font-medium">
                            <span className="text-slate-500">계정이 없으신가요? </span>
                            <Link to="/register" className="font-bold text-primary hover:underline">
                                회원가입
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}