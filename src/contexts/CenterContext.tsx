import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/config/superAdmin';
import { isMainDomain as checkMainDomain } from '@/config/domain';

type Center = Database['public']['Tables']['centers']['Row'];

interface CenterContextType {
  center: Center | null;
  loading: boolean;
  error: string | null;
  setCenter: (center: Center | null) => void;
}

const CenterContext = createContext<CenterContextType | undefined>(undefined);

export const CenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [center, setCenterState] = useState<Center | null>(null);
  const lastLoggedId = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { profile, loading: authLoading } = useAuth();

  const setCenter = (data: any) => {
    if (data) {
      if (lastLoggedId.current !== data.id) {
        lastLoggedId.current = data.id;
        console.log(`✅ [CenterContext] Loaded: ${data.name}`, { id: data.id, slug: data.slug });
      }
    }
    if (data?.slug) {
      localStorage.setItem('zarada_center_slug', data.slug);
    }
    if (data && !data.id) {
      console.error("CenterContext: Attempted to set center without ID", data);
      return;
    }
    setCenterState(data);
  };

  // ✨ [Performance] 경로 변경의 '범주'만 추적 (같은 /app/ 내 이동 시 재쿼리 방지)
  const getRouteCategory = (pathname: string) => {
    if (pathname.startsWith('/master')) return 'master';
    if (pathname.startsWith('/app/')) return 'app';
    if (pathname.startsWith('/parent/')) return 'parent';
    const parts = pathname.split('/');
    const ci = parts.indexOf('centers');
    if (ci !== -1 && parts.length > ci + 1) return `center:${parts[ci + 1]}`;
    return pathname; // 글로벌 라우트는 정확한 경로 추적
  };

  const routeCategory = getRouteCategory(location.pathname);

  useEffect(() => {
    const fetchCenter = async () => {
      const pathParts = location.pathname.split('/');

      // ── 1. /master 라우트 → 센터 없음
      if (location.pathname.startsWith('/master')) {
        setCenterState(null);
        setLoading(false);
        return;
      }

      // ── 2. URL에 /centers/:slug 가 있으면 → 항상 그 slug 사용 (최우선)
      const centerIndex = pathParts.indexOf('centers');
      const urlSlug = (centerIndex !== -1 && pathParts.length > centerIndex + 1)
        ? pathParts[centerIndex + 1]
        : null;

      if (urlSlug) {
        if (center && center.slug === urlSlug) {
          setLoading(false);
          return;
        }
        setLoading(true);
        await loadCenterBySlug(urlSlug);
        return;
      }

      // ── 3. /app/ 경로 → 센터 이미 로드됨이면 skip
      const isAppRoute = location.pathname.startsWith('/app/') || location.pathname.startsWith('/parent/');
      if (isAppRoute) {
        const savedSlug = localStorage.getItem('zarada_center_slug');
        if (savedSlug) {
          if (center && center.slug === savedSlug) {
            setLoading(false);
            return;
          }
          setLoading(true);
          await loadCenterBySlug(savedSlug);
          return;
        }
      }

      // ── 4. 커스텀 도메인 → DB에서 매핑된 센터 로드 (공개 페이지용)
      const hostname = window.location.hostname;
      const cleanHostname = hostname.replace(/^www\./, '');
      const isDefaultDomain = checkMainDomain(cleanHostname);

      if (!isDefaultDomain) {
        if (center) {
          // 이미 로드된 센터가 있으면 skip
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const { data: domainCenter } = await supabase
            .from('centers')
            .select('*')
            .in('custom_domain', [hostname, cleanHostname])
            .maybeSingle();

          if (domainCenter) {
            setCenter(domainCenter);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Custom domain lookup failed', e);
        }
      }

      // ── 5. 글로벌 라우트 → slug 클리어
      const isGlobalRoute = ['/', '/login', '/register', '/auth/forgot-password', '/auth/update-password'].includes(location.pathname);
      if (isGlobalRoute) {
        localStorage.removeItem('zarada_center_slug');
      }

      // ── 6. 프로필 기반 센터 (일반 유저)
      const isSuper = profile?.role === 'super_admin' || (profile?.email && isSuperAdmin(profile.email));
      if (!authLoading && profile?.center_id && !isSuper) {
        if (center && center.id === profile.center_id) {
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const { data: profileCenter } = await supabase
            .from('centers')
            .select('*')
            .eq('id', profile.center_id)
            .single() as { data: Center | null, error: any };

          if (profileCenter) {
            setCenter(profileCenter);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to hydrate center from profile");
        }
      }

      // ── 7. 아무것도 없으면 센터 null
      if (!authLoading) {
        setCenterState(null);
        setLoading(false);
        setError(null);
      }
    };

    // slug로 센터 로드하는 헬퍼
    const loadCenterBySlug = async (slug: string) => {
      if (center && center.slug === slug) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('centers')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Center not found");

        setCenter(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching center:', err);
        setError('Center not found');
        setCenterState(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCenter();
  }, [routeCategory, profile?.center_id, authLoading]);

  return (
    <CenterContext.Provider value={{ center, loading, error, setCenter }}>
      {children}
    </CenterContext.Provider>
  );
};

export const useCenter = () => {
  const context = useContext(CenterContext);
  if (context === undefined) {
    throw new Error('useCenter must be used within a CenterProvider');
  }
  return context;
};
