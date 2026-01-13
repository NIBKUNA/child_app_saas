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
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ✨ super_admin, retired 타입 추가
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'therapist' | 'parent' | 'retired' | null;

const ROLE_CACHE_KEY = 'cached_user_role';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profile: any;
    therapistId: string | null;  // ✨ therapists.id (치료사 전용)
    centerId: string | null;     // ✨ center_id (소속 센터)
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

// ✨ Import Fixed Center ID
import { JAMSIL_CENTER_ID } from '@/config/center';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    // ✨ [Instant Role] localStorage에서 캐시된 역할을 바로 사용
    const [role, setRole] = useState<UserRole>(() => {
        const cached = localStorage.getItem(ROLE_CACHE_KEY);
        return cached ? (cached as UserRole) : null;
    });
    const [profile, setProfile] = useState<any>(null);
    const [therapistId, setTherapistId] = useState<string | null>(null);  // ✨ therapists.id
    // ✨ [Force Single Center] Initialize with Jamsil ID
    const [centerId, setCenterId] = useState<string | null>(JAMSIL_CENTER_ID); // ✨ center_id
    const [loading, setLoading] = useState(true);

    // ✨ [No Re-block] 초기 로딩 후에는 전체 화면 로딩을 다시 보여주지 않음
    const initialLoadComplete = useRef(false);
    const isMounted = useRef(true); // ✨ [Fix] Mount tracking

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    // 세션이 없으면 로딩 종료
                    if (!session) {
                        setLoading(false);
                        initialLoadComplete.current = true;
                    }
                }
            } catch (error) {
                if (mounted) {
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (!session) {
                    setRole(null);
                    localStorage.removeItem(ROLE_CACHE_KEY);
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

    // ✨ [Single Source of Truth] 권한 확인 로직 리팩토링
    // Auth Metadata가 아닌 실제 DB(user_profiles)의 role을 기준으로 함
    const fetchRole = async (forceUpdate = false) => {
        if (!user) return;

        // 이미 로드되었고 강제 업데이트가 아니면 스킵 (초기 로딩 시)
        if (!forceUpdate && role && initialLoadComplete.current) return;

        if (!initialLoadComplete.current) setLoading(true);

        try {
            // ✨ [Direct DB Query] 항상 최신 권한을 가져옴
            const { data, error } = await supabase
                .from('profiles') // ✨ user_profiles -> profiles (Schema Alignment)
                .select('*') // 모든 프로필 정보 가져옴
                .eq('id', user.id)
                .maybeSingle();

            if (isMounted.current) {
                if (data) {
                    const dbRole = (data.role as UserRole) || 'parent';
                    console.log(`[Auth] Role Synced: ${dbRole} (${data.email})`);

                    // ✨ [Security] 퇴사자나 비활성 사용자는 강제로 접근 차단
                    if (data.status === 'inactive' || data.status === 'banned' || dbRole === 'retired') {
                        console.warn('[Auth] Blocked inactive user');
                        setRole(null);
                        setProfile(null);
                        if (window.location.pathname.startsWith('/app')) {
                            alert('접근 권한이 없습니다. (퇴사 또는 계정 비활성화)');
                            await signOut(); // 강제 로그아웃
                            window.location.href = '/'; // 홈으로 이동
                        }
                        return;
                    }

                    setRole(dbRole);
                    setProfile(data);
                    setCenterId(data.center_id || null);  // ✨ 센터 ID 저장

                    // ✨ 치료사인 경우 therapists 테이블에서 ID 조회
                    if (dbRole === 'therapist') {
                        const { data: therapistData } = await supabase
                            .from('therapists')
                            .select('id, center_id')
                            .eq('profile_id', user.id)
                            .maybeSingle();
                        if (therapistData) {
                            setTherapistId(therapistData.id);
                            if (!data.center_id && therapistData.center_id) {
                                setCenterId(therapistData.center_id);
                            }
                        }
                    }

                    // 캐시 업데이트 (오프라인/빠른 로딩용, 실제 검증은 DB가 함)
                    localStorage.setItem(ROLE_CACHE_KEY, dbRole);
                } else {
                    // 프로필이 없는 경우 (아직 생성 전)
                    console.warn('[Auth] No profile found, defaulting to parent');
                    setRole('parent');
                }
            }
        } catch (error) {
            console.error('[Auth] Role fetch error:', error);
            if (isMounted.current) setRole('parent'); // 기본값
        } finally {
            if (isMounted.current) {
                setLoading(false);
                initialLoadComplete.current = true;
            }
        }
    };

    useEffect(() => {
        fetchRole();

        // ✨ [Real-time] 내 권한이 변경되면 즉시 반영 (Supabase Realtime)
        const channel = supabase.channel(`public:profiles:id=eq.${user?.id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` },
                (payload) => {
                    console.log('[Auth] Role updated via Realtime:', payload.new.role);
                    fetchRole(true); // 강제 업데이트
                })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // ✨ [Manual Refresh] 외부에서(예: 로그인 직후) 권한 갱신 요청 가능하게 노출
    const refreshRole = () => fetchRole(true);

    const signOut = async () => {
        localStorage.removeItem(ROLE_CACHE_KEY);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, profile, therapistId, centerId, loading, signOut }}>
            {children}
            {/* ✨ 초기 로딩 때만 전체 화면 로딩 표시 (한 번 완료되면 다시 표시 안 함) */}
            {loading && !initialLoadComplete.current && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                    <p className="text-slate-500 font-bold">권한을 확인 중입니다...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
