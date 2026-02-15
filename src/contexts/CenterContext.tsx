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
  setCenter: (center: Center | null) => void; // ✨ Added for Super Admin switching
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
    // 🔍 [Verification] Log Center ID and Code for validation
    if (data) {
      // ✨ Use ref to force-prevent duplicates even in Strict Mode / Redirects
      if (lastLoggedId.current !== data.id) {
        lastLoggedId.current = data.id;
        const isDomainMatch = window.location.hostname === data?.custom_domain;
        console.log(`✅ [CenterContext] Loaded: ${data.name}`, {
          id: data.id,
          slug: data.slug,
          domain: data.custom_domain || 'N/A',
          source: isDomainMatch ? 'Custom Domain' : 'Slug/Path'
        });
      }
    }

    if (data?.slug) {
      localStorage.setItem('zarada_center_slug', data.slug);
    }
    // ✨ [Safety] Ensure ID is present
    if (data && !data.id) {
      console.error("CenterContext: Attempted to set center without ID", data);
      return;
    }
    setCenterState(data);
  };

  useEffect(() => {
    // 🚀 [Critical Fix] Set loading to true IMMEDIATELY when effect triggers
    // This prevents CenterGuard from seeing loading: false + center: null during the micro-task gap
    setLoading(true);

    const fetchCenter = async () => {
      const pathParts = location.pathname.split('/');

      // ✨ [Custom Domain] 커스텀 도메인 감지
      const hostname = window.location.hostname;
      const cleanHostname = hostname.replace(/^www\./, '');
      const isDefaultDomain = checkMainDomain(cleanHostname);

      // ✨ [Custom Domain Protection] 커스텀 도메인에서는 매핑된 센터가 우선
      // /master 라우트 제외, /app/ 라우트에서는 Super Admin 센터 전환 허용
      if (!isDefaultDomain && !location.pathname.startsWith('/master')) {
        try {
          const { data: domainCenter, error: domainError } = await supabase
            .from('centers')
            .select('*')
            .in('custom_domain', [hostname, cleanHostname])
            .maybeSingle();

          if (!domainError && domainCenter) {
            // ✨ [Super Admin 센터 전환] /app/ 경로에서 Super Admin이 다른 센터로 전환한 경우 → slug 우선
            const storedSlug = localStorage.getItem('zarada_center_slug');
            const isAppRoute = location.pathname.startsWith('/app/');
            const isSuper = profile?.role === 'super_admin' || (profile?.email && isSuperAdmin(profile.email));
            if (isAppRoute && isSuper && storedSlug && storedSlug !== domainCenter.slug) {
              // Super Admin이 다른 센터로 전환한 상태 → 아래 slug 기반 로직으로 폴백
            } else {
              // /centers/:slug 경로로 명시적으로 다른 센터를 보고 있는 경우 → 허용
              const hasExplicitSlugPath = location.pathname.startsWith('/centers/') && pathParts.length > pathParts.indexOf('centers') + 1;
              if (hasExplicitSlugPath) {
                const urlSlug = pathParts[pathParts.indexOf('centers') + 1];
                if (urlSlug !== domainCenter.slug) {
                  // 다른 센터 slug 접근을 허용 → 아래 slug 로직으로 폴백
                } else {
                  setCenter(domainCenter);
                  setLoading(false);
                  return;
                }
              } else {
                // 도메인 매핑 센터 로드 (공개 페이지 등)
                setCenter(domainCenter);
                setLoading(false);
                return;
              }
            }
          }
          // 도메인 매칭 실패 시 기본 로직으로 폴백
        } catch (e) {
          console.warn('Custom domain lookup failed, falling back to slug', e);
        }
      }

      // ✨ [Master Console] Skip any center loading for master routes
      if (location.pathname.startsWith('/master')) {
        setCenterState(null);
        setLoading(false);
        return;
      }

      const centerIndex = pathParts.indexOf('centers');

      let slug = null;
      const isSuper = profile?.role === 'super_admin' || (profile?.email && isSuperAdmin(profile.email));

      if (centerIndex !== -1 && pathParts.length > centerIndex + 1) {
        slug = pathParts[centerIndex + 1];
      }

      const isGlobalRoute = ['/', '/login', '/register', '/auth/forgot-password', '/auth/update-password'].includes(location.pathname);

      // ✨ [Fix] If we are on a center specific route, we are definitively NOT global
      if (location.pathname.startsWith('/centers/')) {
        // Force slug extraction logic to take precedence
      } else if (isGlobalRoute) {
        // Only treat as global if NOT under /centers/
      }

      if (slug) {
        localStorage.setItem('zarada_center_slug', slug);
      } else if (isGlobalRoute) {
        // ✨ [Fix] 글로벌 페이지에서는 모든 사용자의 센터 slug 클리어
        // 이전 센터가 계속 복원되는 문제 방지
        localStorage.removeItem('zarada_center_slug');
      } else if (!isGlobalRoute) {
        // ✨ Auto-restore ONLY if NOT on a global landing/login route
        slug = localStorage.getItem('zarada_center_slug');
      }

      if (!slug && !authLoading && profile?.center_id && !isSuper) {
        try {
          const { data: profileCenter, error: profileError } = await supabase
            .from('centers')
            .select('*')
            .eq('id', profile.center_id)
            .single() as { data: Center | null, error: any };

          if (profileError) throw profileError;

          if (profileCenter) {
            setCenter(profileCenter);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to hydrate center from profile");
        }
      }

      if (!slug) {
        if (!authLoading) {
          setCenterState(null);
          setLoading(false);
          // ✨ [Fix] Clear error if we are intentionally in global mode
          setError(null);
        }
        return;
      }

      if (center && center.slug === slug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('centers')
          .select('*')
          .eq('slug', slug)
          .maybeSingle(); // ✨ [Fix] Use maybeSingle to avoid 406/JSON error on 0 rows

        if (error) throw error;

        if (!data) {
          throw new Error("Center not found");
        }

        // ✨ [Custom Domain Redirect] 메인 플랫폼에서 커스텀 도메인이 있는 센터 접근 시 리디렉트
        // /app/ 경로는 제외 (관리자 센터 전환 허용)
        if (isDefaultDomain && data.custom_domain && !location.pathname.startsWith('/app/')) {
          const subPath = location.pathname.replace(`/centers/${slug}`, '') || '/';
          window.location.href = `https://${data.custom_domain}${subPath}`;
          return;
        }

        setCenter(data);
        setError(null);

      } catch (err: any) {
        console.error('Error fetching center:', err);
        setError('Center not found');
        setCenterState(null);
        // localStorage.removeItem('zarada_center_slug'); // Don't aggressively remove, user might have made a typo
      } finally {
        setLoading(false);
      }
    };

    fetchCenter();
  }, [location.pathname, profile?.center_id, authLoading]);

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
