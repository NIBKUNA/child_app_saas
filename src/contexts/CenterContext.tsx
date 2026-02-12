import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/config/superAdmin';

type Center = Database['public']['Tables']['centers']['Row'];

interface CenterContextType {
  center: Center | null;
  loading: boolean;
  error: string | null;
  setCenter: (center: any) => void; // ✨ Added for Super Admin switching
}

const CenterContext = createContext<CenterContextType | undefined>(undefined);

export const CenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [center, setCenterState] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { profile, loading: authLoading } = useAuth();

  const setCenter = (data: any) => {
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
      } else if (!isGlobalRoute) {
        // ✨ Auto-restore ONLY if NOT on a global landing/login route
        // This prevents the "Jamsil Capture" when landing on the global page
        slug = localStorage.getItem('zarada_center_slug');
      } else if (isGlobalRoute && isSuper) {
        // ✨ [Security] Force clear context for Super Admin on Global routes
        localStorage.removeItem('zarada_center_slug');
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

        setCenter(data);
        setError(null);
        if (import.meta.env.DEV) {
          console.log(`✅ [센터 로드] ${data.name} (${data.slug}) | ID: ${data.id}`);
        }
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
