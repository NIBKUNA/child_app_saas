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
import { JAMSIL_CENTER_ID } from '@/config/center';

// ✨ UserRole 타입 유지 (retired 포함)
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'therapist' | 'parent' | 'retired' | null;

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
    const [centerId, setCenterId] = useState<string | null>(JAMSIL_CENTER_ID);
    const [loading, setLoading] = useState(true);

    const initialLoadComplete = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // 1. 세션 초기화 및 상태 감시
    useEffect(() => {
        let mounted = true;
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (!session) {
                        setLoading(false);
                        initialLoadComplete.current = true;
                    }
                }
            } catch (error) {
                if (mounted) setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);

                // 👑 [Sovereign Fortress] Immediate Super Admin Recognition
                if (session?.user?.email?.toLowerCase() === 'anukbin@gmail.com') {
                    console.log('👑 Sovereign Alert: Immediate Super Admin Recognition in Auth Change');
                    setRole('super_admin');
                    setCenterId(JAMSIL_CENTER_ID);
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
        // 안욱빈 원장님 계정은 어떠한 상황에서도 무조건 Super Admin으로 간주한다.
        if (user.email?.toLowerCase() === 'anukbin@gmail.com') {
            console.log('👑 Sovereign Alert: GOD MODE ACTIVATED (anukbin@gmail.com)');
            setRole('super_admin');
            setCenterId(JAMSIL_CENTER_ID); // 환경변수에서 로드된 센터 ID

            // 프로필 데이터가 없어도 무방하나, 있으면 로드. (비동기 병렬 처리로 UI 블로킹 방지)
            supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
                .then(({ data }) => { if (data) setProfile(data); });

            setLoading(false);
            initialLoadComplete.current = true;
            return; // ⛔ ABSOLUTE RETURN - 더 이상 아무 로직도 실행하지 않음
        }

        if (!forceUpdate && role && initialLoadComplete.current) return;
        if (!initialLoadComplete.current) setLoading(true);

        try {
            // 일반 유저 로직
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                const dbRole = (data.role as UserRole) || 'parent';

                // 🚨 [보안] 퇴사자 및 비활성 계정 철저 차단
                if (data.status === 'retired' || data.status === 'inactive' || dbRole === 'retired') {
                    console.warn('[Auth] Access Blocked: Retired/Inactive User');
                    setRole(null);
                    setProfile(null);
                    alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)\n관리자에게 문의하세요.');
                    await signOut();
                    window.location.href = '/';
                    return;
                }

                setRole(dbRole);
                setProfile(data);
                // Sovereign Template: 앱은 오직 하나의 센터(환경변수)만 바라본다.
                // 유저가 다른 center_id를 가지고 있어도, 이 앱의 주인은 VITE_CENTER_ID이다.
                // 만약 멀티센터 유저라면? 그래도 현재 앱의 Context는 VITE_CENTER_ID여야 한다.
                setCenterId(JAMSIL_CENTER_ID);

                // 치료사 전용 ID 세팅
                if (dbRole === 'therapist') {
                    const { data: therapistData } = await supabase
                        .from('therapists')
                        .select('id')
                        .eq('email', user.email)
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
                    // 프로필이 정말 없으면 Parent 취급 혹은 로그아웃 고민
                    setRole('parent'); // 기본값
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
                        if (user.email === 'anukbin@gmail.com') return;

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

            // 페이지 강제 리로드로 메모리 상의 잔여 데이터까지 제거
            window.location.href = '/';
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