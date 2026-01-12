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
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { isSuperAdmin } from '@/config/superAdmin';
import { TermsModal } from '@/components/public/TermsModal';

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

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [centerId, setCenterId] = useState('');

    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
                        // 기존 역할을 유지하되, 수정 가능하게 함
                        setRole(existingProfile.role || 'parent');
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
            if (data) setCenters(data);
        }
        fetchCenters();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId) return setError('소속 센터를 선택해 주세요.');

        setLoading(true);
        setError(null);

        try {
            if (isOAuthUser && oauthUserData) {
                // ✨ [권한 결정] Super Admin > 그 외 모두 학부모(Parent)
                let finalRole = 'parent';
                let finalStatus = 'active';

                if (isSuperAdmin(oauthUserData.email)) {
                    finalRole = 'admin';
                }

                // ✨ user_profiles에 저장
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .upsert({
                        id: oauthUserData.id,
                        email: oauthUserData.email,
                        name: name,
                        role: finalRole,
                        center_id: centerId,
                        status: finalStatus
                    }, { onConflict: 'id' });

                if (profileError) throw profileError;

                // ✨ 무조건 학부모 홈으로 이동
                navigate('/parent/home');

            } else {
                // 일반 이메일 회원가입
                let finalRole = 'parent';
                let finalStatus = 'active';

                if (isSuperAdmin(email)) {
                    finalRole = 'admin';
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
                <Link
                    to="/"
                    className={cn(
                        "absolute top-6 right-6 p-2 rounded-full transition-colors",
                        isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                    )}
                >
                    {Icons.close("w-5 h-5")}
                </Link>

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
                    {/* 센터 선택 */}
                    <div className="space-y-1">
                        <label className={cn(
                            "text-xs font-black ml-1",
                            isDark ? "text-slate-500" : "text-slate-400"
                        )}>
                            소속 센터
                        </label>
                        <select
                            required
                            value={centerId}
                            onChange={(e) => setCenterId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">다니시는 센터 선택</option>
                            {centers.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>



                    <div className="space-y-4 pt-2">
                        <InputField label="이름" placeholder="성함 입력" value={name} onChange={setName} isDark={isDark} />
                        {!isOAuthUser && (
                            <>
                                <InputField label="이메일" type="email" placeholder="example@email.com" value={email} onChange={setEmail} isDark={isDark} />
                                <InputField label="비밀번호" type="password" placeholder="8자 이상" value={password} onChange={setPassword} isDark={isDark} />
                            </>
                        )}
                        {isOAuthUser && (
                            <div className={cn(
                                "p-4 rounded-2xl text-xs font-bold border",
                                isDark ? "bg-emerald-900/20 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            )}>
                                ✨ {oauthUserData?.email}으로 로그인되었습니다. 소속 센터와 가입 유형을 선택해 주세요.
                            </div>
                        )}
                    </div>

                    {/* 이용약관 동의 */}
                    <div className="flex items-start gap-3 px-1">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="terms" className={cn("text-xs leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
                            <span
                                onClick={(e) => { e.preventDefault(); setModalType('terms'); }}
                                className="font-bold underline cursor-pointer hover:text-indigo-500"
                            >
                                이용약관
                            </span> 및 <span
                                onClick={(e) => { e.preventDefault(); setModalType('privacy'); }}
                                className="font-bold underline cursor-pointer hover:text-indigo-500"
                            >
                                개인정보 처리방침
                            </span>을 확인하였으며, 이에 동의합니다. (필수)
                        </label>
                    </div>

                    {error && (
                        <div className={cn(
                            "p-4 rounded-2xl text-xs font-bold border text-center transition-all animate-in fade-in slide-in-from-bottom-2",
                            isDark ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-500 border-red-100"
                        )}>
                            {error === 'ALREADY_REGISTERED' ? (
                                <div className="flex flex-col gap-2 items-center">
                                    <span className="text-sm">😲 이미 가입된 이메일입니다!</span>
                                    <span className="text-[10px] text-slate-500">혹시 구글/카카오로 가입하셨나요? 간편 로그인을 이용해 주세요.</span>
                                    <Link
                                        to="/login"
                                        className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        로그인하러 가기
                                    </Link>
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