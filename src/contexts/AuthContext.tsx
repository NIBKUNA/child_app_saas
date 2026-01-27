// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Modified by: Gemini AI (for An Uk-bin)
 * 📅 Date: 2026-01-13
 * 🖋️ Description: "퇴사자 실시간 차단 및 권한 변경 즉시 반영 로직 최적화"
 */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin } from '@/config/superAdmin';


// ✨ UserRole 타입 유지 (retired 포함)
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'employee' | 'therapist' | 'parent' | 'retired' | null;

const ROLE_CACHE_KEY = 'cached_user_role';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profile: any;
    therapistId: string | null;
    centerId: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    profile: null,
    therapistId: null,
    centerId: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [profile, setProfile] = useState<any>(null);
    const [therapistId, setTherapistId] = useState<string | null>(null);
    const [centerId, setCenterId] = useState<string | null>(null); // ✨ Default to null
    const [loading, setLoading] = useState(true);

    const initialLoadComplete = useRef(false);
    const isMounted = useRef(true);

    // ✨ [Immutable Flag] 페이지 로드 시점의 Hash 정보를 영구 보존
    const initialHash = useRef(window.location.hash);
    const initialParams = useRef(new URLSearchParams(window.location.search));

    useEffect(() => {
        // ✨ [DEBUG] 초기 로드 시 Invite Flag 확인
        if (initialHash.current.includes('type=invite') || initialParams.current.get('type') === 'invite') {
            console.log("🚩 Invite Link Detected on Mount (Persisted)");
        }
    }, []);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // 1. 세션 초기화 및 상태 감시
    useEffect(() => {
        let mounted = true;
        const initSession = async () => {
            // ✨ [Safety] 3초 후에도 로딩이 안 끝나면 강제로 종료 (Infinite Loading 방지)
            const safetyTimeout = setTimeout(() => {
                if (mounted && !initialLoadComplete.current) {
                    console.warn("⚠️ Auth Check Timed Out - Forcing Load Complete");
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }, 3000);

            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                clearTimeout(safetyTimeout); // 정상 응답 시 타이머 해제

                if (error) {
                    console.error("❌ Session Init Error:", error.message);
                    // ✨ [Auto-Fix] 토큰이 만료되었거나 유효하지 않으면 강제 로그아웃 처리
                    if (error.message.includes("Refresh Token") || error.message.includes("Not Found")) {
                        console.log("🧹 Cleaning up invalid session data...");
                        await supabase.auth.signOut(); // Clean Supabase state
                        localStorage.clear();
                        sessionStorage.clear();
                        // 상태가 꼬였으므로 깔끔하게 리로드
                        window.location.reload();
                    }
                    if (mounted) setLoading(false);
                    return;
                }

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (!session) {
                        setLoading(false);
                        initialLoadComplete.current = true;
                    }
                }
            } catch (error) {
                clearTimeout(safetyTimeout);
                console.error("🚨 Unexpected Auth Error:", error);
                if (mounted) setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);

                // 1. 이벤트가 PASSWORD_RECOVERY 이거나
                // 2. 현재 URL에 type=invite/recovery가 있거나
                // 3. ✨ [핵심] **처음 로드됐을 때**의 URL에 꼬리표가 있었다면 (Supabase가 지웠어도 기억함)
                const isInviteOrRecovery =
                    _event === 'PASSWORD_RECOVERY' ||
                    window.location.hash.includes('type=recovery') ||
                    window.location.hash.includes('type=invite') ||
                    initialHash.current.includes('type=recovery') ||
                    initialHash.current.includes('type=invite') ||
                    new URLSearchParams(window.location.search).get('type') === 'invite' ||
                    initialParams.current.get('type') === 'invite';

                if (isInviteOrRecovery) {
                    // 세션이 없어도 토큰이 있다면 기다려야 하므로, 여기서는 '납치'만 준비
                    // 실제로는 session이 생긴 직후에 이동해야 함.
                    console.log('🔐 Redirecting to Password Update (AuthContext)...');
                    window.location.href = '/auth/update-password';
                    return;
                }

                // 👑 [Sovereign Fortress] Immediate Super Admin Recognition
                if (isSuperAdmin(session?.user?.email)) {
                    console.log('👑 Sovereign Alert: Immediate Super Admin Recognition in Auth Change');
                    setRole('super_admin');
                    setCenterId(null); // ✨ Global Access
                    setLoading(false);
                    initialLoadComplete.current = true;
                    return; // DB check skipped for speed and stability
                }

                if (!session) {
                    setRole(null);
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 2. [핵심] DB 기반 권한 및 상태 체크 (Sovereign Template V2)
    const executeFetchRole = async (forceUpdate = false, retryCount = 0) => {
        if (!user) return;

        // 👑 [Sovereign Fortress] God Mode Injection - Bypass ALL checks
        // 슈퍼 관리자 계정은 어떠한 상황에서도 무조건 Super Admin으로 간주한다.
        if (isSuperAdmin(user.email)) {
            console.log(`👑 Sovereign Alert: GOD MODE ACTIVATED (${user.email})`);
            setRole('super_admin');
            setCenterId(null); // ✨ Global Access

            // 프로필 데이터가 없어도 무방하나, 있으면 로드.
            supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        // 👑 [Conflict Resolution] Super Admin has NO primary center
                        setProfile({ ...data, center_id: null });
                    }
                });

            setLoading(false);
            initialLoadComplete.current = true;
            return; // ⛔ ABSOLUTE RETURN - 더 이상 아무 로직도 실행하지 않음
        }

        if (!forceUpdate && role && initialLoadComplete.current) return;
        if (!initialLoadComplete.current) setLoading(true);

        try {
            // 1. [Sync] 프로필 조회
            let { data: dbProfile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            // 2. ✨ [Self-Healing] Removed hardcoded repair relying on CURRENT_CENTER_ID
            // If needed, we can implement dynamic repair later.
            /* 
            if (!dbProfile || dbProfile.role === 'parent') {
                // ... (Logic removed for SaaS safety)
            }
            */

            if (dbProfile) {
                const dbRole = (dbProfile.role as UserRole) || 'parent';

                // 🚨 [보안] 퇴사자 및 비활성 계정 철저 차단
                if (dbProfile.status === 'retired' || dbProfile.status === 'inactive' || dbRole === 'retired') {
                    console.warn('[Auth] Access Blocked: Retired/Inactive User');
                    setRole(null);
                    setProfile(null);
                    alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)\n관리자에게 문의하세요.');
                    await signOut();
                    window.location.href = '/';
                    return;
                }

                setRole(dbRole);
                setProfile(dbProfile);
                setCenterId(dbProfile.center_id);

                // 치료사 전용 ID 세팅
                if (dbRole === 'therapist') {
                    const { data: therapistData } = await supabase
                        .from('therapists')
                        .select('id')
                        .ilike('email', user.email)
                        .maybeSingle();
                    if (therapistData) setTherapistId(therapistData.id);
                }

                setLoading(false);
                initialLoadComplete.current = true;
            } else {
                // 프로필 없을 시 재시도 (최대 5회)
                if (retryCount < 5) {
                    setTimeout(() => executeFetchRole(forceUpdate, retryCount + 1), 500);
                } else {
                    // 정말 없으면 Parent 취급
                    setRole('parent');
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        } catch (e) {
            console.error('Auth Check Error:', e);
            // 에러 시 보안을 위해 parent로 강등하거나 에러 페이지
            setRole('parent');
            setLoading(false);
            initialLoadComplete.current = true;
        }
    };

    const fetchRole = (forceUpdate = false) => executeFetchRole(forceUpdate, 0);

    useEffect(() => {
        if (user) {
            fetchRole();

            // ✨ [Real-time] 관리자가 DB에서 권한을 바꾸면 즉시 감지
            const channel = supabase.channel(`profile_changes_${user.id}`)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}` },
                    (payload) => {
                        // 👑 [Sovereign Fortress] 슈퍼 어드민은 감시 대상에서도 제외 (혹은 DB변경 무시)
                        if (isSuperAdmin(user.email)) return;

                        const newRole = payload.new.role;
                        const newStatus = payload.new.status;

                        if (newStatus === 'retired' || newRole === 'retired') {
                            alert('권한이 회수되었습니다. 로그아웃됩니다.');
                            window.location.reload();
                            return;
                        }

                        if (role && role !== newRole) {
                            alert(`권한이 '${newRole}'(으)로 변경되었습니다. 시스템을 재시작합니다.`);
                            window.location.reload();
                        }
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user?.id, role]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            // ✨ [Security Nuclear Option] 모든 저장소 초토화
            console.log('☢️ NUCLEAR SIGN-OUT INITIATED');

            // 1. Local/Session Storage Wipe
            localStorage.clear();
            sessionStorage.clear();

            // 2. Browser Cache Storage Wipe (Service Workers, etc.)
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    console.log('✅ All Caches Detonated');
                } catch (err) {
                    console.error('Cache Clear Failed:', err);
                }
            }

            // 전역 상태 초기화
            setSession(null);
            setUser(null);
            setRole(null);
            setProfile(null);
            setTherapistId(null);
            setCenterId(null);
            initialLoadComplete.current = false;

            // 페이지 강제 리로드로 메모리 상의 잔여 데이터까지 제거하여 상태값 초기화 보장
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, role, profile, therapistId, centerId, loading, signOut }}>
            {children}
            {/* 초기 로딩 화면 */}
            {loading && !initialLoadComplete.current && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                    <p className="text-slate-500 font-bold">센터 보안 확인 중...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);