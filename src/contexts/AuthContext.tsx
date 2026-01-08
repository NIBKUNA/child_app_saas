// @ts-nocheck
/* eslint-disable */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ✨ retired 타입 추가
export type UserRole = 'admin' | 'staff' | 'therapist' | 'parent' | 'retired' | null;

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    // 세션이 없으면 로딩 종료
                    if (!session) setLoading(false);
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
                if (!session) {
                    setRole(null);
                    setLoading(false);
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

            setLoading(true); // 권한 조회 시작 시 로딩 상태 유지
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (mounted) {
                    // ✨ 기본값을 'therapist'로 주지 않고 데이터 그대로 반영 (없으면 parent)
                    setRole((data?.role as UserRole) || 'parent');
                }
            } catch (error) {
                if (mounted) setRole('parent');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchRole();
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {children}
            {/* 전역 로딩: 권한 확인 전까지 화면을 가립니다. */}
            {loading && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                    <p className="text-slate-500 font-bold">권한을 확인 중입니다...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);