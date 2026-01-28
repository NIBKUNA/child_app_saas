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
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { isSuperAdmin } from '@/config/superAdmin';
import { TermsModal } from '@/components/public/TermsModal';
import { useCenter } from '@/contexts/CenterContext';

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
};

export function Register() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { center } = useCenter(); // ✨ SaaS Context

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [centerId, setCenterId] = useState(center?.id || import.meta.env.VITE_CENTER_ID || '');

    useEffect(() => {
        if (center?.id) setCenterId(center.id);
    }, [center]);

    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { slug } = useParams(); // ✨ Get URL Slug for SaaS

    // ✨ [소셜 로그인 감지] 이미 인증된 사용자인지 확인
    const [isOAuthUser, setIsOAuthUser] = useState(false);
    const [oauthUserData, setOauthUserData] = useState<any>(null);
    const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // ✨ [기존 가입자 확인] 이미 프로필이 있는지 체크
                const { data: existingProfile } = await supabase
                    .from('user_profiles')
                    .select('role, center_id, status')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (existingProfile?.center_id) {
                    // ✨ [재접속 사용자] 온보딩 스킵 → 바로 대시보드로
                    if (existingProfile.status === 'active') {
                        if (existingProfile.role === 'parent') {
                            navigate('/parent/home');
                        } else if (existingProfile.role === 'admin' || existingProfile.role === 'super_admin') {
                            navigate('/app/dashboard');
                        } else {
                            navigate('/app/schedule');
                        }
                        return;
                    } else if (existingProfile.status === 'rejected') {
                        alert('가입 신청이 거절되었습니다. 센터에 문의해 주세요.');
                        await supabase.auth.signOut();
                        navigate('/login');
                        return;
                    } else {
                        // ✨ [Pending 상태 구제] 승인 대기 중이지만 역할을 바꾸거나 수정하고 싶어하는 경우
                        // 로그아웃 시키지 않고 폼을 채워서 수정 기회를 줌
                        setIsOAuthUser(true);
                        setOauthUserData(session.user);
                        setEmail(existingProfile.email || session.user.email || '');
                        setName(existingProfile.name || '');
                        setCenterId(existingProfile.center_id);
                        setError('⚠️ 현재 승인 대기 중인 계정입니다. 가입 유형을 학부모로 변경하면 즉시 이용 가능합니다.');

                        // 기존 상태가 pending이면 수정 폼을 보여주기 위해 여기서 return하지 않고 진행
                        // (단, 알림은 너무 자주 뜨지 않게 제거하거나 상단 에러로 대체)
                    }
                }

                // 신규 소셜 로그인 사용자 → 온보딩 필요
                setIsOAuthUser(true);
                setOauthUserData(session.user);
                setEmail(session.user.email || '');
                setName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
            }
        }
        checkSession();
    }, [navigate]);

    useEffect(() => {
        async function fetchCenters() {
            const { data } = await supabase.from('centers').select('id, name');
            if (data && data.length > 0) {
                setCenters(data);
            }
        }
        fetchCenters();
    }, [centerId]); // Add centerId dependency to strictly check it

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId) return setError('소속 센터를 선택해 주세요.');

        setLoading(true);
        setError(null);

        try {
            // 기본값은 Parent
            let finalRole = 'parent';
            let finalStatus = 'active';

            // ✨ [Security] 하이재킹 방지 및 권한 자동 할당
            // therapists 테이블에 이미 등록된 직원이면 'therapist' 권한 부여
            const { data: preRegistered } = await supabase
                .from('therapists')
                .select('system_role')
                .ilike('email', email)
                .maybeSingle();

            if (preRegistered) {
                console.log("🛠️ Pre-registered staff detected. Assigning proper role.");
                finalRole = preRegistered.system_role || 'therapist';
                finalStatus = 'active'; // 이미 관리자가 등록했으므로 즉시 활성
            } else if (isSuperAdmin(email)) {
                finalRole = 'super_admin';
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: finalRole,
                        center_id: centerId
                    }
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // ✨ user_profiles에 직접 저장
                await supabase.from('user_profiles').upsert({
                    id: authData.user.id,
                    email: email,
                    name: name,
                    role: finalRole,
                    center_id: centerId,
                    status: finalStatus,
                }, { onConflict: 'id' });

                alert('회원가입이 완료되었습니다!\n환영합니다.');
                await supabase.auth.signInWithPassword({ email, password }); // 자동 로그인 시도
                navigate('/parent/home');
            }
        } catch (err: any) {
            let msg = err.message || '오류가 발생했습니다.';
            if (msg.includes('User already registered') || msg.includes('unique constraint')) {
                msg = 'ALREADY_REGISTERED';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = cn(
        "w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
        isDark
            ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/20"
            : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
    );

    return (
        <div className={cn(
            "min-h-screen flex items-center justify-center px-4 py-10 relative transition-colors",
            isDark ? "bg-slate-950" : "bg-slate-50"
        )}>
            <div className={cn(
                "w-full max-w-md p-8 rounded-[40px] shadow-xl border relative",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
                {/* Close Button */}
                <button
                    onClick={() => slug ? navigate(`/centers/${slug}`) : navigate('/')}
                    className={cn(
                        "absolute top-6 right-6 p-2 rounded-full transition-colors",
                        isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                    )}
                >
                    {Icons.close("w-5 h-5")}
                </button>

                <div className="text-center mb-8 pt-4">
                    <h2 className={cn(
                        "text-2xl font-black tracking-tight",
                        isDark ? "text-white" : "text-slate-900"
                    )}>서비스 시작하기</h2>
                    <p className={cn(
                        "mt-2 text-sm font-medium text-balance",
                        isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                        소속 센터와 가입 유형을 선택해 주세요.
                    </p>
                </div>

                <TermsModal
                    isOpen={!!modalType}
                    onClose={() => setModalType(null)}
                    type={modalType || 'terms'}
                />

                <form className="space-y-5" onSubmit={handleRegister}>
                    {/* 센터 선택 (자동 할당) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">가입 센터</p>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                    {center?.name || (slug ? '센터 정보 확인 중...' : 'Zarada Platform')}
                                </p>
                            </div>
                        </div>
                    </div>



                    <div className="space-y-4 pt-2">
                        <InputField label="이름" placeholder="성함 입력" value={name} onChange={setName} isDark={isDark} />
                        <InputField label="이메일" type="email" placeholder="example@email.com" value={email} onChange={setEmail} isDark={isDark} />
                        <InputField label="비밀번호" type="password" placeholder="8자 이상" value={password} onChange={setPassword} isDark={isDark} />
                    </div>

                    {/* 이용약관 동의 (Simplified) */}
                    <div className="flex items-start gap-3 px-1">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="terms" className={cn("text-xs leading-relaxed cursor-pointer select-none", isDark ? "text-slate-400" : "text-slate-500")}>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">[필수]</span> Zarada Platform의{' '}
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setModalType('terms'); }}
                                className="font-bold underline hover:text-indigo-500"
                            >
                                이용약관
                            </button>
                            {' '}및{' '}
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setModalType('privacy'); }}
                                className="font-bold underline hover:text-indigo-500"
                            >
                                개인정보 처리방침
                            </button>
                            에 모두 동의합니다.
                        </label>
                    </div>

                    {error && (
                        <div className={cn(
                            "p-4 rounded-2xl text-xs font-bold border text-center transition-all animate-in fade-in slide-in-from-bottom-2",
                            isDark ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-500 border-red-100"
                        )}>
                            {error === 'ALREADY_REGISTERED' ? (
                                <div className="flex flex-col gap-2 items-center">
                                    <span className="text-sm font-bold">🚫 이미 등록된 사용자입니다!</span>
                                    <span className="text-[11px] text-slate-500 text-center leading-relaxed">
                                        센터 관리자가 이미 계정을 생성했거나, 이전 가입 이력이 있습니다.<br />
                                        만약 가입한 적이 없는데 이 메시지가 뜬다면 아래 버튼을 눌러주세요.
                                    </span>
                                    <div className="flex gap-2 mt-2 w-full">
                                        <Link
                                            to="/login"
                                            className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md text-xs flex items-center justify-center"
                                        >
                                            로그인 하기
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!window.confirm(`${email} 계정을 초기화하고 다시 가입하시겠습니까?`)) return;
                                                setLoading(true);
                                                try {
                                                    const { error } = await supabase.rpc('force_cleanup_user_by_email', { target_email: email });
                                                    if (error) throw error;
                                                    alert('계정이 초기화되었습니다. 다시 가입 버튼을 눌러주세요.');
                                                    setError(null);
                                                } catch (e: any) {
                                                    alert('초기화 실패: ' + e.message + '\n관리자에게 문의하세요.');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="flex-1 py-2.5 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-all text-xs"
                                        >
                                            계정 초기화 (오류 해결)
                                        </button>
                                    </div>
                                </div>
                            ) : error}
                        </div>
                    )}

                    {/* Register Button - Always visible with indigo-600 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full py-4 font-black rounded-2xl shadow-lg transition-all flex justify-center items-center",
                            "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-95",
                            "shadow-indigo-500/25",
                            loading && "opacity-80 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <>
                                {Icons.loader("w-5 h-5 animate-spin mr-2")}
                                가입 중...
                            </>
                        ) : '가입하기'}
                    </button>

                    <div className="text-center mt-6 space-y-4">
                        <div className={cn(
                            "text-xs font-medium",
                            isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                            이미 계정이 있으신가요?
                            <Link
                                to="/login"
                                className={cn(
                                    "ml-1 font-bold underline",
                                    isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
                                )}
                            >
                                로그인
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => slug ? navigate(`/centers/${slug}`) : navigate('/')}
                            className={cn(
                                "block w-full text-xs font-bold transition-colors",
                                isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            ← 센터 홈으로 돌아가기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InputField({ label, type = "text", placeholder, value, onChange, isDark }: any) {
    return (
        <div className="space-y-1">
            <label className={cn(
                "text-xs font-black ml-1",
                isDark ? "text-slate-500" : "text-slate-400"
            )}>
                {label}
            </label>
            <input
                required
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all",
                    isDark
                        ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/20"
                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                )}
            />
        </div>
    );
}