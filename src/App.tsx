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
import Programs from '@/pages/app/Programs';
import { Billing } from '@/pages/app/Billing';
import { Settlement } from '@/pages/app/Settlement';
import { ConsultationList } from '@/pages/app/consultations/ConsultationList';

// ✨ [동적 리다이렉트]
// 로그인 직후 '/app'으로 들어왔을 때, 역할에 따라 가장 먼저 보여줄 페이지를 결정합니다.
function AppHomeRedirect() {
  const { role } = useAuth();

  // 관리자나 직원은 대시보드가 메인
  if (role === 'admin' || role === 'staff') {
    return <Navigate to="/app/dashboard" replace />;
  }
  // ✨ 치료사도 이제 대시보드를 볼 수 있으니 대시보드로 보내도 되고,
  //    업무 효율을 위해 '일정(schedule)'을 기본으로 보여줘도 됩니다.
  //    일단 요청하신 대로 '대시보드 접속'이 목표시라면 아래를 주석 처리하거나 dashboard로 바꾸셔도 됩니다.
  //    (여기서는 편의상 '일정'을 기본으로 두되, 메뉴 클릭으로 대시보드 이동은 가능하게 합니다.)
  if (role === 'therapist') {
    return <Navigate to="/app/schedule" replace />;
  }

  return <Navigate to="/parent/home" replace />;
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. 🌐 공개 페이지 */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* 2. 🔐 로그인/회원가입 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 3. 👨‍👩‍👧‍👦 [학부모 전용 구역] */}
            <Route element={<ProtectedRoute allowedRoles={['parent', 'admin']} />}>
              <Route path="/parent/home" element={<ParentHomePage />} />
              <Route path="/parent/stats" element={<ParentStatsPage />} />
              <Route path="/parent/logs" element={<ParentLogsPage />} />
            </Route>

            {/* 4. 🏢 [관리자/직원/치료사 공통 앱 구역] */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'therapist']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AppHomeRedirect />} />

              {/* ✨ [수정됨] 대시보드에 'therapist' 권한 추가! 이제 들어갈 수 있습니다. */}
              <Route path="dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'therapist']}>
                  <Dashboard />
                </ProtectedRoute>
              } />

              {/* 상담 문의(Leads)는 보통 영업/관리직만 봄 (치료사 제외 유지) */}
              <Route path="leads" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <LeadList />
                </ProtectedRoute>
              } />

              {/* 일정, 아동, 프로그램은 모두 접근 가능 */}
              <Route path="schedule" element={<Schedule />} />
              <Route path="children" element={<ChildList />} />
              <Route path="programs" element={<Programs />} />

              {/* 직원 관리는 관리자만 */}
              <Route path="therapists" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TherapistList />
                </ProtectedRoute>
              } />

              <Route path="sessions" element={<SessionList />} />
              <Route path="sessions/:scheduleId/note" element={<SessionNote />} />

              {/* ✨ 수납 관리도 치료사가 봐야 한다면 여기에 'therapist' 추가하세요 */}
              <Route path="billing" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Billing />
                </ProtectedRoute>
              } />

              {/* 정산(급여) 관리는 민감하므로 관리자만 */}
              <Route path="settlement" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settlement />
                </ProtectedRoute>
              } />

              <Route path="consultations" element={<ConsultationList />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;