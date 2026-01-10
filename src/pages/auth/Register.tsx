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
    const [role, setRole] = useState('parent');
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
                    .single();

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
                        // pending 상태
                        alert('아직 승인 대기 중입니다. 센터 관리자의 승인을 기다려 주세요.');
                        await supabase.auth.signOut();
                        navigate('/login');
                        return;
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
                // ✨ [권한 결정] Super Admin > 학부모(즉시승인) > 치료사(승인대기)
                let finalRole = role;
                let finalStatus = 'pending';

                if (isSuperAdmin(oauthUserData.email)) {
                    finalRole = 'admin';
                    finalStatus = 'active';
                } else if (role === 'parent') {
                    // ✨ [학부모 프리패스] 즉시 승인
                    finalStatus = 'active';
                }

                // ✨ [소셜 로그인 온보딩] user_profiles에 저장
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

                // therapist로 가입한 경우 therapists 테이블에도 추가
                if (role === 'therapist') {
                    await supabase.from('therapists').upsert({
                        id: oauthUserData.id,
                        name: name,
                        email: oauthUserData.email,
                        center_id: centerId,
                        color: '#64748b'
                    }, { onConflict: 'id' });
                }

                // ✨ [분기 처리] 학부모는 즉시 대시보드, 치료사는 승인 대기
                if (role === 'parent' || isSuperAdmin(oauthUserData.email)) {
                    // 학부모/관리자: 즉시 메인으로
                    navigate('/parent/home');
                } else {
                    // 치료사: 승인 대기 안내
                    alert('회원가입이 완료되었습니다!\n센터 관리자의 승인 후 서비스를 이용하실 수 있습니다.');
                    await supabase.auth.signOut();
                    navigate('/login');
                }
            } else {
                // 일반 이메일 회원가입
                // ✨ [권한 결정] Super Admin > 학부모(즉시승인) > 치료사(승인대기)
                let finalRole = role;
                let finalStatus = 'pending';

                if (isSuperAdmin(email)) {
                    finalRole = 'admin';
                    finalStatus = 'active';
                } else if (role === 'parent') {
                    // ✨ [학부모 프리패스] 즉시 승인
                    finalStatus = 'active';
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
                    if (role === 'parent') {
                        alert('회원가입이 완료되었습니다!\n이메일 인증 후 로그인해 주세요.');
                    } else {
                        alert('회원가입이 완료되었습니다!\n센터 관리자의 승인 후 로그인해 주세요.');
                    }
                    navigate('/login');
                }
            }
        } catch (err: any) {
            setError(err.message || '오류가 발생했습니다.');
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

                    {/* 역할 선택 */}
                    <div className="space-y-1">
                        <label className={cn(
                            "text-xs font-black ml-1",
                            isDark ? "text-slate-500" : "text-slate-400"
                        )}>
                            가입 유형
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'parent', label: '학부모' },
                                { value: 'therapist', label: '치료사' },
                            ].map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={cn(
                                        "py-3 rounded-xl text-xs font-black border transition-all",
                                        role === r.value
                                            ? (isDark
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-slate-900 text-white border-slate-900 shadow-md")
                                            : (isDark
                                                ? "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300")
                                    )}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
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
                            "p-4 rounded-2xl text-xs font-bold border",
                            isDark ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-500 border-red-100"
                        )}>{error}</div>
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