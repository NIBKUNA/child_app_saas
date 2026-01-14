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
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';

// 공개 페이지
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ProgramsPage } from '@/pages/public/ProgramsPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { UpdatePassword } from '@/pages/auth/UpdatePassword';
import { BlogPage } from '@/pages/public/BlogPage';
import { BlogPostPage } from '@/pages/public/BlogPostPage';

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
import { TherapistList } from '@/pages/app/therapists/TherapistList';
import SessionList from '@/pages/app/sessions/SessionList';
import SessionNote from '@/pages/app/sessions/SessionNote';
import { LeadList } from '@/pages/app/leads/LeadList';
import ConsultationInquiryList from '@/pages/app/consultations/ConsultationInquiryList';
import BlogList from '@/pages/app/blog/BlogList';
import BlogEditor from '@/pages/app/blog/BlogEditor';
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
  const { role } = useAuth();
  if (role === 'super_admin' || role === 'admin' || role === 'staff') {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (role === 'therapist') {
    return <Navigate to="/app/schedule" replace />;
  }
  return <Navigate to="/parent/home" replace />;
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    const hasSeenSplash = sessionStorage.getItem('splash_shown');
    return !hasSeenSplash;
  });

  // ✨ [UTM Tracking] URL 파라미터 캡처 및 세션 저장
  // MUST be before any conditional returns (React Hooks Rule)
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
      console.log("🎨 [Marketing] UTM 파라미터가 감지되어 저장되었습니다:", {
        source: localStorage.getItem('utm_source'),
        medium: localStorage.getItem('utm_medium')
      });
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <SEOHead />
            <Routes>
              {/* 1. 공개 페이지 */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/programs" element={<ProgramsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
              </Route>

              {/* 2. 로그인/회원가입 */}
              {/* 2. 로그인/회원가입 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/update-password" element={<UpdatePassword />} />

              {/* 3. 학부모 전용 구역 */}
              <Route element={<ProtectedRoute allowedRoles={['parent', 'admin']} />}>
                <Route element={<ParentLayout />}>
                  <Route path="/parent/home" element={<ParentHomePage />} />
                  <Route path="/parent/stats" element={<ParentStatsPage />} />
                  <Route path="/parent/logs" element={<ParentLogsPage />} />
                  <Route path="/parent/mypage" element={<ParentMyPage />} />
                </Route>
              </Route>

              {/* 4. 관리자/직원/치료사 공통 앱 구역 */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff', 'therapist']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AppHomeRedirect />} />

                <Route path="dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff', 'therapist']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="leads" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <ConsultationInquiryList />
                  </ProtectedRoute>
                } />

                <Route path="schedule" element={<Schedule />} />
                <Route path="children" element={<ChildList />} />
                <Route path="programs" element={<Programs />} />

                <Route path="therapists" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TherapistList />
                  </ProtectedRoute>
                } />

                <Route path="sessions" element={<SessionList />} />
                <Route path="sessions/:scheduleId/note" element={<SessionNote />} />

                <Route path="billing" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <Billing />
                  </ProtectedRoute>
                } />

                <Route path="settlement" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settlement />
                  </ProtectedRoute>
                } />

                <Route path="consultations" element={<ConsultationList />} />

                {/* 블로그 관리 */}
                <Route path="blog" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <BlogList />
                  </ProtectedRoute>
                } />
                <Route path="blog/new" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <BlogEditor />
                  </ProtectedRoute>
                } />
                <Route path="blog/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <BlogEditor />
                  </ProtectedRoute>
                } />

                {/* 사이트 관리 */}
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                {/* ✅ 전체 센터 관리 (슈퍼 어드민 전용) */}
                <Route path="admin/centers" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <CenterList />
                  </ProtectedRoute>
                } />
                <Route path="admin/centers/:centerId" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <CenterDetailPage />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;