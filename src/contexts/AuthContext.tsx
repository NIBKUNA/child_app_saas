/* eslint-disable react-refresh/only-export-components */
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

// ✨ UserProfile 타입 정의 (DB user_profiles 테이블 스키마 기반 — schema.sql 참조)
export interface UserProfile {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    role: UserRole;
    is_active: boolean | null;
    status: string | null;
    center_id: string | null;
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
                    console.warn("⚠️ Session expired or invalid:", error.message);
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
            supabase.from('user_profiles').select('id, email, name, phone, role, is_active, status, center_id, created_at, updated_at').eq('id', user.id).maybeSingle()
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
            // 1. [Sync] 프로필 조회 — 실제 DB 스키마 컬럼만 명시 (schema.sql 참조)
            const { data: dbProfile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, email, name, phone, role, is_active, status, center_id, created_at, updated_at')
                .eq('id', user.id)
                .maybeSingle();

            // 🚨 [진단] 쿼리 에러 시 로그 출력 (컬럼 미존재 등 DB 스키마 불일치 감지용)
            if (profileError) {
                console.error('[Auth] user_profiles 쿼리 실패:', profileError.message, profileError.code);
            }

            // ✨ Type assertion for dbProfile
            const typedProfile = dbProfile as unknown as UserProfile | null;

            if (typedProfile) {
                // 🛡️ [핵심] role이 null/빈값이면 therapists 테이블에서 교차 확인 (자가 복구)
                let dbRole = typedProfile.role as UserRole;
                if (!dbRole && user.email) {
                    console.warn('[Auth] user_profiles.role is null/empty, cross-checking therapists table...');
                    const { data: therapistRecord } = await supabase
                        .from('therapists')
                        .select('system_role')
                        .ilike('email', user.email)
                        .maybeSingle();
                    const crossRole = (therapistRecord as { system_role: string } | null)?.system_role as UserRole;
                    if (crossRole && crossRole !== 'parent') {
                        dbRole = crossRole;
                        if (import.meta.env.DEV) console.log('[Auth] Role recovered from therapists table:', crossRole);
                    } else {
                        dbRole = 'parent'; // 진짜 아무 데도 없으면 최종 폴백
                    }
                }

                // 🚨 [보안] 퇴사자 및 비활성 계정 철저 차단
                if (typedProfile.status === 'retired' || typedProfile.status === 'inactive' || typedProfile.is_active === false || dbRole === 'retired') {
                    console.warn('[Auth] Access Blocked: Retired/Inactive User');
                    setRole(null);
                    setProfile(null);
                    alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)\n관리자에게 문의하세요.');
                    await signOut();
                    const slugMatch = window.location.pathname.match(/\/centers\/([^/]+)/);
                    const centerSlug = slugMatch?.[1] || localStorage.getItem('zarada_center_slug');
                    window.location.href = centerSlug ? `/centers/${centerSlug}/login` : '/login';
                    return;
                }

                setRole(dbRole);
                setProfile(typedProfile);
                setCenterId(typedProfile.center_id);

                // 치료사 전용 ID 세팅 + 🚨 퇴사 상태 이중 체크
                if (dbRole === 'therapist' && user.email) {
                    const { data: therapistData } = await supabase
                        .from('therapists')
                        .select('id, system_status')
                        .ilike('email', user.email)
                        .maybeSingle();
                    const typedTherapistData = therapistData as { id: string; system_status: string } | null;

                    // 🚨 [보안 강화] therapists.system_status가 'retired'이면 즉시 차단
                    if (typedTherapistData?.system_status === 'retired') {
                        console.warn('[Auth] Access Blocked: Therapist system_status is retired');
                        setRole(null);
                        setProfile(null);
                        alert('접근 권한이 없습니다. (퇴사 처리됨)\n관리자에게 문의하세요.');
                        await signOut();
                        const slugMatch2 = window.location.pathname.match(/\/centers\/([^/]+)/);
                        const centerSlug2 = slugMatch2?.[1] || localStorage.getItem('zarada_center_slug');
                        window.location.href = centerSlug2 ? `/centers/${centerSlug2}/login` : '/login';
                        return;
                    }

                    if (typedTherapistData) setTherapistId(typedTherapistData.id);
                }

                setLoading(false);
                initialLoadComplete.current = true;

            } else if (profileError) {
                // 🚨 [핵심 수정] DB 쿼리 자체가 실패한 경우 (RLS 차단, 네트워크 등)
                // therapists 테이블에서 교차 확인하여 최대한 복구 시도
                console.error('[Auth] Profile query failed, attempting therapists cross-check...');
                if (user.email) {
                    const { data: therapistFallback } = await supabase
                        .from('therapists')
                        .select('id, system_role, system_status, center_id')
                        .ilike('email', user.email)
                        .maybeSingle();
                    const typedFallback = therapistFallback as { id: string; system_role: string; system_status: string; center_id: string } | null;

                    if (typedFallback && typedFallback.system_status !== 'retired') {
                        const fallbackRole = (typedFallback.system_role as UserRole) || 'therapist';
                        if (import.meta.env.DEV) console.log('[Auth] Role recovered from therapists:', fallbackRole);
                        setRole(fallbackRole);
                        setCenterId(typedFallback.center_id);
                        if (fallbackRole === 'therapist') setTherapistId(typedFallback.id);
                        setLoading(false);
                        initialLoadComplete.current = true;
                        return;
                    }
                }
                // 교차 확인도 실패하면 parent 폴백 (진짜 최후의 수단)
                console.error('[Auth] All cross-checks failed. Falling back to parent.');
                setRole('parent');
                setLoading(false);
                initialLoadComplete.current = true;

            } else {
                // 프로필 레코드 자체가 없는 경우 — 재시도 (최대 3회, 300ms 간격)
                if (retryCount < 3) {
                    setTimeout(() => executeFetchRole(forceUpdate, retryCount + 1), 300);
                } else {
                    // 재시도 후에도 없으면 therapists 테이블에서 교차 확인
                    if (user.email) {
                        const { data: therapistFallback2 } = await supabase
                            .from('therapists')
                            .select('id, system_role, system_status, center_id')
                            .ilike('email', user.email)
                            .maybeSingle();
                        const typedFallback2 = therapistFallback2 as { id: string; system_role: string; system_status: string; center_id: string } | null;

                        if (typedFallback2 && typedFallback2.system_status !== 'retired') {
                            const fb2Role = (typedFallback2.system_role as UserRole) || 'therapist';
                            if (import.meta.env.DEV) console.log('[Auth] No profile found but recovered from therapists:', fb2Role);
                            setRole(fb2Role);
                            setCenterId(typedFallback2.center_id);
                            if (fb2Role === 'therapist') setTherapistId(typedFallback2.id);
                            setLoading(false);
                            initialLoadComplete.current = true;
                            return;
                        }
                    }
                    // 정말 어디에도 없으면 Parent 취급
                    console.warn('[Auth] No profile or therapist record found. Final fallback: parent');
                    setRole('parent');
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        } catch (e) {
            console.error('[Auth] Critical Auth Check Error:', e);
            // 🛡️ [핵심 수정] 에러 시에도 기존 역할이 있으면 유지 (불필요한 parent 강등 방지)
            if (!role) {
                // 역할이 아직 설정되지 않은 초기 상태에서만 parent 폴백
                setRole('parent');
            }
            // role이 이미 있으면 (예: 이전 세션에서 admin 등) 그대로 유지
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
            // ✨ [Snapshot] 로그아웃 전 현재 센터 정보 백업
            const savedSlug = localStorage.getItem('zarada_center_slug');

            // ✨ [Security] 모든 로컬 데이터 파괴
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

            // ⚠️ [Fix] setState / initialLoadComplete 리셋 제거
            // window.location.href로 전체 페이지가 새로 로드되므로 React 상태 초기화 불필요.
            // 오히려 setState → 리렌더링 → 로딩 오버레이 재표시 → location 이동 지연
            // 순서로 모바일에서 무한 로딩이 발생했음.

            // ✨ [Redirect Logic] 백업해둔 센터 정보로 정확하게 이동
            if (savedSlug) {
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