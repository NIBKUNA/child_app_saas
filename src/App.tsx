// ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
// -----------------------------------------------------------
// 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
// 예술적 영감을 바탕으로 구축되었습니다.

import { Routes, Route, Navigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CenterProvider } from '@/contexts/CenterContext';
import { CenterGuard } from '@/components/auth/CenterGuard';

import ProtectedRoute from '@/components/ProtectedRoute'; // Ensure this exports UserRole or accept string[]
import { useAuth } from '@/contexts/AuthContext';

import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { MasterLayout } from '@/layouts/MasterLayout';

// Global Landing (Center Selector)
import { GlobalLanding } from '@/pages/public/GlobalLanding';

// 공개 페이지
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
// import { BlogPage } from '@/pages/public/BlogPage';
// import { BlogPostPage } from '@/pages/public/BlogPostPage';

// 부모님 전용 페이지
import { ParentLayout } from '@/layouts/ParentLayout';
import { ParentMyPage } from '@/pages/public/ParentMyPage';
import { ParentHomePage } from '@/pages/public/ParentHomePage';
import { ParentStatsPage } from '@/pages/public/ParentStatsPage';
import { ParentLogsPage } from '@/pages/public/ParentLogsPage';

// 앱 페이지들
import { Dashboard } from '@/pages/app/Dashboard';
import { Schedule } from '@/pages/app/Schedule';
import { ChildList } from '@/pages/app/children/ChildList';
import { ParentList } from '@/pages/app/parents/ParentList';
import { TherapistList } from '@/pages/app/therapists/TherapistList';
import SessionList from '@/pages/app/sessions/SessionList';
import SessionNote from '@/pages/app/sessions/SessionNote';
// import { LeadList } from '@/pages/app/leads/LeadList';
import ConsultationInquiryList from '@/pages/app/consultations/ConsultationInquiryList';
// import BlogList from '@/pages/app/blog/BlogList';
// import BlogEditor from '@/pages/app/blog/BlogEditor';
import Programs from '@/pages/app/Programs';
import { Billing } from '@/pages/app/Billing';
import { Settlement } from '@/pages/app/Settlement';
import { ConsultationList } from '@/pages/app/consultations/ConsultationList';
import { SettingsPage } from '@/pages/app/SettingsPage';
import { CenterList } from '@/pages/app/admin/CenterList';
import { CenterDetailPage } from '@/pages/app/admin/CenterDetailPage';
import { SplashScreen } from '@/components/SplashScreen';
import { useState, useEffect } from 'react';

function AppHomeRedirect() {
  const { loading } = useAuth();

  if (loading) return null; // 로딩 중에는 아무것도 렌더링하지 않아 플래시 방지

  // 🌐 [Universal Rule] Anyone at root "/" sees the Global Landing (Portal).
  // This allows all users to "exit" to the platform home.
  // Logged-in users can return to their dashboard via the "Dashboard" button in the header.
  return <GlobalLanding />;
}

function App() {
  // 🚀 [Critical] Force full purge if HMR fails - v1.3.0 (SCHEMA ALIGNMENT)
  useEffect(() => {
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
  }, []);

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // ✨ [Optimization] Splash logic:
    // 1. Only show on the main portal ('/') or Master Console ('/master')
    // 2. Do NOT show on specific center landing pages to speed up marketing conversions
    const isMasterOrRoot = window.location.pathname === '/' || window.location.pathname.startsWith('/master');
    if (!isMasterOrRoot) return false;

    // 3. Only show once per session
    const hasSeenSplash = sessionStorage.getItem('splash_shown');
    return !hasSeenSplash;
  });

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

          {/* 2. Public Center Pages (/centers/:slug/...) */}
          <Route path="/centers/:slug" element={<CenterGuard><PublicLayout /></CenterGuard>}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="therapists" element={<TherapistsPage />} />
            <Route path="contact" element={<ContactPage />} />
            {/* Blog routes removed */}
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
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff', 'employee', 'therapist']}>
                  <AppLayout />
                </ProtectedRoute>
              </CenterGuard>
            }
          >
            <Route index element={<AppHomeRedirect />} />

            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="leads" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                <ConsultationInquiryList />
              </ProtectedRoute>
            } />

            <Route path="schedule" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff', 'therapist']}>
                <Schedule />
              </ProtectedRoute>
            } />

            <Route path="children" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                <ChildList />
              </ProtectedRoute>
            } />

            <Route path="parents" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                <ParentList />
              </ProtectedRoute>
            } />

            <Route path="programs" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                <Programs />
              </ProtectedRoute>
            } />

            <Route path="therapists" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <TherapistList />
              </ProtectedRoute>
            } />

            {/* ✨ Sessions are usually linked from Schedule, access control handled by logic or same as Schedule */}
            <Route path="sessions" element={<SessionList />} />
            <Route path="sessions/:scheduleId/note" element={<SessionNote />} />

            <Route path="billing" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                <Billing />
              </ProtectedRoute>
            } />

            <Route path="settlement" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <Settlement />
              </ProtectedRoute>
            } />

            <Route path="consultations" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'therapist']}>
                <ConsultationList />
              </ProtectedRoute>
            } />

            {/* 사이트 관리 - Admin Only */}
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />

          </Route>

          {/* ✨ Redirect Removed/Moved Routes */}
          <Route path="/app/admin/centers" element={<Navigate to="/master/centers" replace />} />
          <Route path="/app/admin/centers/*" element={<Navigate to="/master/centers" replace />} />

          {/* 6. Master Console (Super Admin Only) - Dedicated Layout & Context */}
          <Route path="/master" element={<MasterLayout />}>
            <Route index element={<div className="text-slate-400 font-bold p-8">Master Dashboard (Coming Soon)</div>} />
            <Route path="centers" element={<CenterList />} />
            <Route path="centers/:centerId" element={<CenterDetailPage />} />
          </Route>
        </Routes>
      )}
    </CenterProvider>
  );
}

export default App;