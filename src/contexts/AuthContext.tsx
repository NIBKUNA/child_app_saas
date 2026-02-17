/* eslint-disable @typescript-eslint/no-unused-vars */
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


// ✨ UserRole 타입 유지 (단순화: admin, manager, therapist, parent, super_admin)
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'therapist' | 'parent' | 'retired' | null;

// ✨ UserProfile 타입 정의 (DB user_profiles 테이블 스키마 기반)
export interface UserProfile {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    role: UserRole;
    status: 'active' | 'inactive' | 'retired' | null;
    center_id: string | null;
    avatar_url: string | null;
    created_at: string | null;
    updated_at: string | null;
}

// ✨ Realtime Payload 타입 정의
interface ProfileChangePayload {
    new: {
        role: string;
        status: string;
    };
}

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profile: UserProfile | null;
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
        // Invite link detection handled silently
    }, []);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // 1. 세션 초기화 및 상태 감시
    useEffect(() => {
        let mounted = true;
        const initSession = async () => {
            // ✨ [Safety] 4초 후에도 로딩이 안 끝나면 강제로 종료 (Infinite Loading 방지)
            const safetyTimeout = setTimeout(() => {
                if (mounted && !initialLoadComplete.current) {
                    console.warn("⚠️ Auth Check Timed Out - Forcing Load Complete");
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }, 4000);

            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                clearTimeout(safetyTimeout); // 정상 응답 시 타이머 해제

                if (error) {
                    console.error("❌ Session Init Error:", error.message);
                    // ✨ [Auto-Fix] 토큰이 만료되었거나 유효하지 않으면 강제 로그아웃 처리
                    if (error.message.includes("Refresh Token") || error.message.includes("Not Found")) {
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
            } catch (err) {
                clearTimeout(safetyTimeout);
                console.error("🚨 Unexpected Auth Error:", err);
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
                    window.location.href = '/auth/update-password';
                    return;
                }

                // 👑 [Sovereign Fortress] Immediate Super Admin Recognition
                if (isSuperAdmin(session?.user?.email)) {
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
            setRole('super_admin');
            setCenterId(null); // ✨ Global Access

            // 프로필 데이터가 없어도 무방하나, 있으면 로드.
            supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        // 👑 [Conflict Resolution] Super Admin has NO primary center
                        const profileData = data as unknown as UserProfile;
                        setProfile({ ...profileData, center_id: null });
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
            const { data: dbProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            // ✨ Type assertion for dbProfile
            const typedProfile = dbProfile as unknown as UserProfile | null;

            // 2. ✨ [Self-Healing] Removed hardcoded repair relying on CURRENT_CENTER_ID
            // If needed, we can implement dynamic repair later.
            /* 
            if (!dbProfile || dbProfile.role === 'parent') {
                // ... (Logic removed for SaaS safety)
            }
            */

            if (typedProfile) {
                const dbRole = (typedProfile.role as UserRole) || 'parent';

                // 🚨 [보안] 퇴사자 및 비활성 계정 철저 차단
                if (typedProfile.status === 'retired' || typedProfile.status === 'inactive' || dbRole === 'retired') {
                    console.warn('[Auth] Access Blocked: Retired/Inactive User');
                    setRole(null);
                    setProfile(null);
                    alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)\n관리자에게 문의하세요.');
                    await signOut();
                    window.location.href = '/';
                    return;
                }

                setRole(dbRole);
                setProfile(typedProfile);
                setCenterId(typedProfile.center_id);

                // 치료사 전용 ID 세팅
                if (dbRole === 'therapist' && user.email) {
                    const { data: therapistData } = await supabase
                        .from('therapists')
                        .select('id')
                        .ilike('email', user.email)
                        .maybeSingle();
                    const typedTherapistData = therapistData as { id: string } | null;
                    if (typedTherapistData) setTherapistId(typedTherapistData.id);
                }

                setLoading(false);
                initialLoadComplete.current = true;
            } else {
                // 프로필 없을 시 재시도 (최대 3회, 300ms 간격 → 최대 0.9초)
                if (retryCount < 3) {
                    setTimeout(() => executeFetchRole(forceUpdate, retryCount + 1), 300);
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
                    (payload: ProfileChangePayload) => {
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
            // ✨ [Fix] 세션이 있는 경우에만 서버 로그아웃 요청 (403 에러 방지)
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
                await supabase.auth.signOut();
            }
        } catch (e) {
            console.warn('Supabase signout request failed (possibly already expired):', e);
        } finally {
            // ✨ [Snapshot] 로그아웃 전 현재 센터 정보 백업 (이게 지워져서 튕기는 것)
            const savedSlug = localStorage.getItem('zarada_center_slug');

            // ✨ [Security Nuclear Option] 서버 결과와 관계없이 모든 로컬 데이터 파괴
            localStorage.clear();
            sessionStorage.clear();

            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
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

            // ✨ [Redirect Logic] 백업해둔 센터 정보로 정확하게 이동
            if (savedSlug) {
                // 재로그인 시 편의를 위해 슬러그 복원
                localStorage.setItem('zarada_center_slug', savedSlug);
                window.location.href = `/centers/${savedSlug}/login`;
            } else {
                window.location.href = '/';
            }
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