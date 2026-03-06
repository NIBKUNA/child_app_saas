// ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
// -----------------------------------------------------------
// 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
// 예술적 영감을 바탕으로 구축되었습니다.

import { Routes, Route, Navigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CenterProvider, useCenter } from '@/contexts/CenterContext';
import { CenterGuard } from '@/components/auth/CenterGuard';

import ProtectedRoute from '@/components/ProtectedRoute'; // Ensure this exports UserRole or accept string[]
import { useAuth } from '@/contexts/AuthContext';
import { isMainDomain as checkMainDomain } from '@/config/domain';
import { isSuperAdmin } from '@/config/superAdmin';

import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { MasterLayout } from '@/layouts/MasterLayout';

// Global Landing (Center Selector) - always loaded
import { GlobalLanding } from '@/pages/public/GlobalLanding';
import { CenterDirectory } from '@/pages/public/CenterDirectory';

// 공개 페이지 - always loaded (SEO critical)
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ProgramsPage } from '@/pages/public/ProgramsPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { TherapistsPage } from '@/pages/public/TherapistsPage';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { UpdatePassword } from '@/pages/auth/UpdatePassword';
import { LegalPage } from '@/pages/public/LegalPage';

// 부모님 전용 페이지 - always loaded (lightweight)
import { ParentLayout } from '@/layouts/ParentLayout';
import { ParentMyPage } from '@/pages/public/ParentMyPage';
import { ParentHomePage } from '@/pages/public/ParentHomePage';
import { ParentStatsPage } from '@/pages/public/ParentStatsPage';
import { ParentLogsPage } from '@/pages/public/ParentLogsPage';

// ⚡ [Code Splitting] 앱 관리 페이지 — Lazy Loading
// 로그인 후 접근하는 관리 페이지들을 동적 import로 분리하여 초기 로딩 속도를 개선합니다.
import { lazy, Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// ⚡ [Eager Loading] 자주 사용하는 핵심 페이지 — 즉시 로드
import { Dashboard } from '@/pages/app/Dashboard';
import { Schedule } from '@/pages/app/Schedule';
import { ChildList } from '@/pages/app/children/ChildList';
import { ConsultationList } from '@/pages/app/consultations/ConsultationList';
import { Billing } from '@/pages/app/Billing';

// ⚡ [Lazy Loading] 덜 사용하는 페이지 — 필요 시 로드
const ParentList = lazy(() => import('@/pages/app/parents/ParentList').then(m => ({ default: m.ParentList })));
const TherapistList = lazy(() => import('@/pages/app/therapists/TherapistList').then(m => ({ default: m.TherapistList })));
const SessionList = lazy(() => import('@/pages/app/sessions/SessionList'));
const SessionNote = lazy(() => import('@/pages/app/sessions/SessionNote'));
const ConsultationInquiryList = lazy(() => import('@/pages/app/consultations/ConsultationInquiryList'));
const Programs = lazy(() => import('@/pages/app/Programs'));
const Settlement = lazy(() => import('@/pages/app/Settlement').then(m => ({ default: m.Settlement })));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CenterList = lazy(() => import('@/pages/app/admin/CenterList').then(m => ({ default: m.CenterList })));
const CenterDetailPage = lazy(() => import('@/pages/app/admin/CenterDetailPage').then(m => ({ default: m.CenterDetailPage })));
const DomainGuide = lazy(() => import('@/pages/app/admin/PromoAnimation').then(m => ({ default: m.DomainGuide })));
const NotificationSettingsPage = lazy(() => import('@/pages/app/NotificationSettingsPage'));

import { SplashScreen } from '@/components/SplashScreen';

// ⚡ Lazy Loading Fallback
function LazyFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );
}

function AppHomeRedirect() {
  const { role, loading, user } = useAuth();
  const { center, loading: centerLoading } = useCenter();

  // ✨ [Domain Check] Identify if we are on a custom domain
  const hostname = window.location.hostname;
  const isSaaSDomain = checkMainDomain(hostname);
  const isCustomDomain = !isSaaSDomain;

  // 👑 [Super Admin Check] email 기반 + role 기반 이중 체크
  const isSuper = role === 'super_admin' || (user?.email ? isSuperAdmin(user.email) : false);

  if (loading || centerLoading) return null; // 로딩 중에는 아무것도 렌더링하지 않아 플래시 방지

  // 👑 [Super Admin on SaaS Domain]
  if (isSuper && isSaaSDomain) {
    const savedSlug = localStorage.getItem('zarada_center_slug');
    if (savedSlug) {
      return <Navigate to="/app/dashboard" replace />;
    }
    // slug 없으면 통합 포탈 표시 (센터 선택/마스터 콘솔 접근 가능)
    return <GlobalLanding />;
  }

  // ✨ [Staff Redirect] 센터 소속 직원은 자기 워크스페이스로 이동
  // super_admin은 제외 — 커스텀 도메인에서 센터 홈페이지를 봐야 하므로
  if (role && role !== 'parent' && role !== 'super_admin' && center?.slug) {
    if (role === 'manager' || role === 'therapist') {
      return <Navigate to="/app/schedule" replace />;
    }
    return <Navigate to="/app/dashboard" replace />;
  }

  // ✨ [Center Redirect] 커스텀 도메인 or 센터 컨텍스트가 있으면 센터 홈페이지
  if (center?.slug) {
    return <Navigate to={`/centers/${center.slug}`} replace />;
  }

  // 🚨 [Safety] If on a custom domain but NO center found, DO NOT show Global Landing.
  if (isCustomDomain) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-800">센터 정보를 불러오는 중입니다...</h1>
        <div className="mt-2 text-xs text-gray-400">Target: {hostname}</div>
        <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          새로고침
        </button>
      </div>
    );
  }

  // 🌐 [Universal Rule] Anyone at root "/" sees the Global Landing (Portal).
  return <GlobalLanding />;
}

function App() {
  // 🚀 [Critical] Force full purge if HMR fails - v1.3.0 (SCHEMA ALIGNMENT)
  useEffect(() => {
    try {
      const SAAS_ENGINE_VER = "1.3.0";
      if (localStorage.getItem('zarada_ver') !== SAAS_ENGINE_VER) {
        const token = localStorage.getItem('zarada-auth-token');
        const rememberMe = localStorage.getItem('remember_me');

        localStorage.clear();
        sessionStorage.clear();

        if (token) localStorage.setItem('zarada-auth-token', token);
        if (rememberMe) localStorage.setItem('remember_me', rememberMe);

        localStorage.setItem('zarada_ver', SAAS_ENGINE_VER);
        window.location.reload();
      }
    } catch (e) {
      // localStorage 접근 실패 시 무한 reload 방지 — 조용히 진행
      console.warn('[App] Version purge skipped due to storage error:', e);
    }
  }, []);

  const [showSplash, setShowSplash] = useState<boolean>(false);

  // ✨ [UTM Tracking] URL 파라미터 캡처 및 세션 저장
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmTags = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    let hasUtm = false;

    utmTags.forEach(tag => {
      const value = params.get(tag);
      if (value) {
        localStorage.setItem(tag, value);
        hasUtm = true;
      }
    });

    if (hasUtm) {
      // UTM parameters captured and stored for marketing analytics
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <CenterProvider>
      <ScrollToTop />
      <SEOHead />
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <Routes>
          {/* 1. Global Home Logic (Redirection or Portal) */}
          <Route path="/" element={<AppHomeRedirect />} />
          <Route path="/policy/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/policy/terms" element={<LegalPage type="terms" />} />


          {/* 2. Public Center Pages */}
          <Route path="/centers" element={<PublicLayout />}>
            <Route index element={<CenterDirectory />} />
          </Route>
          <Route path="/centers/:slug" element={<CenterGuard><PublicLayout /></CenterGuard>}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="therapists" element={<TherapistsPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>

          {/* 2-1. Custom Domain Routes — 커스텀 도메인에서 /about, /contact 등 직접 접근
              /centers/:slug 없이 최상위 경로로 공개 페이지에 접근하는 경우를 처리합니다.
              CenterGuard가 커스텀 도메인을 감지하여 센터 컨텍스트를 자동 주입합니다. */}
          <Route element={<CenterGuard><PublicLayout /></CenterGuard>}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/therapists" element={<TherapistsPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* 3. Authentication (Global & Branded) */}
          <Route path="/login" element={<Login />} />
          <Route path="/centers/:slug/login" element={<CenterGuard><Login /></CenterGuard>} />
          <Route path="/register" element={<Register />} />
          <Route path="/centers/:slug/register" element={<CenterGuard><Register /></CenterGuard>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/centers/:slug/forgot-password" element={<CenterGuard><ForgotPassword /></CenterGuard>} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/update-password" element={<UpdatePassword />} />
          <Route path="/update-password" element={<Navigate to="/auth/update-password" replace />} />

          {/* 4. Parent Zone (Protected + Center Context) */}
          {/* Note: In a real multi-tenant app, parents might also need a center context or sub-path. 
              For now, keeping legacy paths but we might want /centers/:slug/parent/... later. 
              Currently assuming parents log in and CenterGuard (if we wrap them) or Profile determines context.
          */}
          <Route element={<ProtectedRoute allowedRoles={['parent', 'admin']} />}>
            <Route element={<ParentLayout />}>
              <Route path="/parent/home" element={<ParentHomePage />} />
              <Route path="/parent/stats" element={<ParentStatsPage />} />
              <Route path="/parent/logs" element={<ParentLogsPage />} />
              <Route path="/parent/mypage" element={<ParentMyPage />} />
            </Route>
          </Route>

          {/* 5. SaaS Admin/Staff App Zone (Protected + Center Guard) */}
          {/* All routes here require a valid center context. Since we use LocalStorage persistence in CenterContext,
              even if the URL is just /app/dashboard, the Context might try to restore center.
              However, strictly speaking, pure SaaS usually enforces /centers/:slug/app/... 
              But based on request "Maintain current App structure but add CenterContext", 
              we will rely on the CenterGuard checking for a selected center (from previous selection or storage). 
          */}
          <Route
            path="/app"
            element={
              <CenterGuard>
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'therapist']}>
                  <Suspense fallback={<LazyFallback />}>
                    <AppLayout />
                  </Suspense>
                </ProtectedRoute>
              </CenterGuard>
            }
          >
            <Route index element={<AppHomeRedirect />} />

            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="leads" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <ConsultationInquiryList />
              </ProtectedRoute>
            } />

            <Route path="schedule" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'therapist']}>
                <Schedule />
              </ProtectedRoute>
            } />

            <Route path="children" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <ChildList />
              </ProtectedRoute>
            } />

            <Route path="parents" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <ParentList />
              </ProtectedRoute>
            } />

            <Route path="programs" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <Programs />
              </ProtectedRoute>
            } />

            <Route path="therapists" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <TherapistList />
              </ProtectedRoute>
            } />

            {/* ✨ Sessions - Access controlled per role */}
            <Route path="sessions" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'therapist']}>
                <SessionList />
              </ProtectedRoute>
            } />
            <Route path="sessions/:scheduleId/note" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'therapist']}>
                <SessionNote />
              </ProtectedRoute>
            } />

            <Route path="billing" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                <Billing />
              </ProtectedRoute>
            } />

            <Route path="settlement" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Settlement />
              </ProtectedRoute>
            } />

            <Route path="consultations" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'therapist', 'manager']}>
                <ConsultationList />
              </ProtectedRoute>
            } />

            {/* 사이트 관리 - Admin Only */}
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />

            <Route path="notifications" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <NotificationSettingsPage />
              </ProtectedRoute>
            } />

          </Route>

          {/* ✨ Redirect Removed/Moved Routes */}
          <Route path="/app/admin/centers" element={<Navigate to="/master/centers" replace />} />
          <Route path="/app/admin/centers/*" element={<Navigate to="/master/centers" replace />} />

          {/* 6. Master Console (Super Admin Only) - Dedicated Layout & Context */}
          <Route path="/master" element={<Suspense fallback={<LazyFallback />}><MasterLayout /></Suspense>}>
            <Route index element={<Navigate to="/master/centers" replace />} />
            <Route path="centers" element={<CenterList />} />
            <Route path="centers/:centerId" element={<CenterDetailPage />} />
            <Route path="promo" element={<DomainGuide />} />
          </Route>
        </Routes >
      )
      }
    </CenterProvider >
  );
}

export default App;