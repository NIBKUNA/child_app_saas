// @ts-nocheck
/* eslint-disable */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ✨ retired 타입 추가
export type UserRole = 'admin' | 'staff' | 'therapist' | 'parent' | 'retired' | null;

const ROLE_CACHE_KEY = 'cached_user_role';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    profile: any;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    // ✨ [Instant Role] localStorage에서 캐시된 역할을 바로 사용
    const [role, setRole] = useState<UserRole>(() => {
        const cached = localStorage.getItem(ROLE_CACHE_KEY);
        return cached ? (cached as UserRole) : null;
    });
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ✨ [No Re-block] 초기 로딩 후에는 전체 화면 로딩을 다시 보여주지 않음
    const initialLoadComplete = useRef(false);

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

    useEffect(() => {
        let mounted = true;

        const fetchRole = async () => {
            if (!user) return;

            // ✨ [Optimization] 이미 역할이 있으면 loading을 true로 다시 설정하지 않음
            // 초기 로딩 때만 전체 화면 로딩 표시
            if (!initialLoadComplete.current) {
                setLoading(true);
            }

            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (mounted) {
                    const fetchedRole = (data?.role as UserRole) || 'parent';
                    setRole(fetchedRole);
                    setProfile(data);
                    // ✨ localStorage에 캐시
                    localStorage.setItem(ROLE_CACHE_KEY, fetchedRole);
                }
            } catch (error) {
                if (mounted) setRole('parent');
            } finally {
                if (mounted) {
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            }
        };

        fetchRole();
    }, [user]);

    const signOut = async () => {
        localStorage.removeItem(ROLE_CACHE_KEY);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, profile, loading, signOut }}>
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
