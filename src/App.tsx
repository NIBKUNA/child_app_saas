// @ts-nocheck
/* eslint-disable */
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthProvider } from '@/contexts/AuthContext';

// 공개 페이지
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ProgramsPage } from '@/pages/public/ProgramsPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { BlogPage } from '@/pages/public/BlogPage';
import { BlogPostPage } from '@/pages/public/BlogPostPage';

// 부모님 전용 페이지
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
import { SplashScreen } from '@/components/SplashScreen';
import { useState, useEffect } from 'react';

function AppHomeRedirect() {
  const { role } = useAuth();
  if (role === 'admin' || role === 'staff') {
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
        <BrowserRouter>
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 3. 학부모 전용 구역 */}
            <Route element={<ProtectedRoute allowedRoles={['parent', 'admin']} />}>
              <Route path="/parent/home" element={<ParentHomePage />} />
              <Route path="/parent/stats" element={<ParentStatsPage />} />
              <Route path="/parent/logs" element={<ParentLogsPage />} />
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;